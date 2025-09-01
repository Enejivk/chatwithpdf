from email.mime import message
from unittest import result
from urllib import response
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Response, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import helpers
import os
from uuid import uuid4
from pdf_processor import handleProcessDocuments
import config
import database
from user_models import GoogleAuthResponse, UserResponse, UserCreate, Token
import auth
from pydantic import BaseModel

class ChatMessage(BaseModel):
    query: str
    response: str
    document_ids: list[str] = []

class ChatParameter(BaseModel):
    query: str = None
    chat_id: str | None = None
    document_ids: list[str] | None = None
    chat_history: list[ChatMessage] = []
    
# Create database tables
database.create_tables()

# Create FastAPI app
app = FastAPI()

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def save_to_database(db, user_id, group_id, content, sender, message_id, document_ids):
    """Save a message to the database."""
    message = database.Message(
        id=message_id if message_id else None,
        user_id=user_id,
        group_id=group_id,
        role=sender,
        content=content,
        document_ids=",".join(document_ids) if document_ids else None
    )
    db.add(message)
    db.commit()
    return message

@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post('/auth/google')
async def google_auth(
    response: Response,
    user_data: GoogleAuthResponse,
    db: Session = Depends(database.get_db)
):
    # Check if user exists
    db_user = auth.get_user_by_google_id(db, user_data.id)
    
    if not db_user:
        # Create new user
        user_create = UserCreate(
            google_id=user_data.id,
            email=user_data.email,
            name=user_data.name,
            picture=user_data.picture
        )
        result = auth.create_user(db, user_create)
    else:
        result = auth.get_token(db, db_user.id)
        
    # Set auth cookies - use secure=False for local development, but should be True in production
    auth.set_auth_cookies(response, result["access_token"], refresh_token=result["refresh_token"], secure=False)
    
    return {
        'message': "User login successful",
        'user': {
            'id': result["user"].id,
            'name': result["user"].name,
            'email': result["user"].email,
            'picture': result["user"].picture
        }
    }


@app.get('/auth/refresh-token')
async def refresh_token(
    response: Response,
    db: Session = Depends(database.get_db),
    refresh_token: str = Depends(auth.oauth2_scheme)
):
    decoded_token = auth.decode_refresh_token(refresh_token)
    if not decoded_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    user_id = decoded_token.get("sub")
    result = auth.get_token(db, int(user_id))
    
    # Set auth cookies - use secure=False for local development, but should be True in production
    auth.set_auth_cookies(response, result["access_token"], refresh_token=result["refresh_token"], secure=False)
    
    return {
        'message': "Token refreshed",
        'user': {
            'id': result["user"].id,
            'name': result["user"].name,
            'email': result["user"].email,
            'picture': result["user"].picture
        }
    }


@app.post('/upload_pdf')
async def upload_pdf(
    document: UploadFile = File(...), 
    chat_id: str = Form(None),
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    file_id: str = helpers.generate_unique_id()
    new_chat_id = helpers.generate_unique_id()

    os.makedirs(config.TEMP_DIR, exist_ok=True)

    # Save file in a directory with user ID
    user_dir = f"{config.TEMP_DIR}/{user_id}"
    os.makedirs(user_dir, exist_ok=True)
    
    pdf_path = f"{user_dir}/{document.filename}"
    with open(pdf_path, "wb") as f:
        content = await document.read()
        f.write(content)

    prepare_save_pdf = handleProcessDocuments()
    texts = prepare_save_pdf.extract_text(file_path=pdf_path)
    
    # Convert empty string to None and check if chat_id is provided
    if chat_id == "":
        chat_id = None
    generate_summary = chat_id is None

    document_summary = prepare_save_pdf.save_text_to_chroma(
        texts=texts, file_id=file_id,
        file_name=document.filename,
        current_user_id=user_id, generate_summary=generate_summary
        )
    
    
    group_id = chat_id if chat_id else new_chat_id
    save_to_database(
        db=db,
        user_id=user_id,
        group_id=group_id,
        content=document_summary.get('summary', ''),
        sender="assistant",
        message_id=None,
        document_ids=[file_id]
    )
    
    # Create a new chat for this document if chat_id is not provided
    if not chat_id:
        db_chat = database.Chat(
            id=new_chat_id,
            user_id=user_id,
            title=document_summary.get('title', 'New Chat')
        )
        db.add(db_chat)
        chat_id = new_chat_id
    
    # Store document info in the database
    db_document = database.Document(
        chat_id=group_id,
        user_id=user_id,
        id=file_id,
        filename=document.filename,
        content_type=document.content_type,
        file_path=pdf_path,
        file_size=document.size,
        title=document.filename.replace(".pdf", "")
    )
    
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    prepare_save_pdf.delete_pdf_file(pdf_path)
    return {
        "chat_id": db_document.chat_id,
        "document": {
            "id": db_document.id,
            "filename": db_document.filename,
            "title": db_document.title,
            "created_at": db_document.created_at
        }
    }

@app.post('/chat')
async def query_chroma(
    chat_query: ChatParameter, 
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    
    group_id = chat_query.chat_id
    prepare_save_pdf = handleProcessDocuments()
    
    results = prepare_save_pdf.query_chroma(chat_query.query, chat_query.document_ids)
    print(results)
    response = prepare_save_pdf.generate_tailored_response(
        query=chat_query.query,
        context=results
    )
    message_id = helpers.generate_unique_id()
    
    save_to_database(
        db=db, 
        user_id=user_id, 
        group_id=group_id, 
        content=chat_query.query, 
        sender="user", 
        message_id=None, 
        document_ids=chat_query.document_ids
    )
    
    save_to_database(
        db=db, 
        user_id=user_id, 
        group_id=group_id, 
        content=response, 
        sender="assistant", 
        message_id=message_id, 
        document_ids=chat_query.document_ids
    )

    return {
            "id": message_id,
            "content": response,
            "sender": 'assistant',
            "timestamp": "now",
            }



@app.get('/user/documents')
async def get_user_documents(
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    
    # Check if user exists
    user = db.query(database.User).filter(database.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Now we can query documents directly with user_id instead of going through chats
    documents = db.query(database.Document).filter(
        database.Document.user_id == user_id
    ).order_by(database.Document.created_at.desc()).all()
    
    return [
            {
                "id": doc.id,
                "filename": doc.filename,
                "title": doc.title,
                "created_at": doc.created_at
            } for doc in documents
        ]
    
@app.get('/chat/{chat_id}/documents')
async def get_chat_documents(
    chat_id: str,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    
    # Get documents from database for this chat
    documents = db.query(database.Document).filter(
        database.Document.chat_id == chat_id,
        database.Document.user_id == user_id
    ).all()    
    
    print(documents)
    return [
        {
            "id": doc.id,
            "filename": doc.filename,
            "title": doc.title, 
            "created_at": doc.created_at
        } for doc in documents
    ]

@app.get('/get_document/{document_id}')
async def get_document(
    document_id: str,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    
    # Get document from database
    document = db.query(database.Document).filter(
        database.Document.id == document_id,
        database.Document.user_id == user_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or you don't have permission to access it"
        )
    
    return {
        "id": document.id,
        "filename": document.filename, 
        "title": document.title,
        "created_at": document.created_at
    }


@app.get('/chat/{chat_history_id}')
async def get_chat_history_detail(
    chat_history_id: str,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    chat = db.query(database.Chat).filter(
        database.Chat.id == chat_history_id,
        database.Chat.user_id == user_id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat history not found")
    
    # Get messages for this chat history
    messages = db.query(database.Message).filter(
        database.Message.group_id == chat_history_id,
        database.Message.user_id == user_id
    ).order_by(database.Message.created_at.asc()).all()
    
    return {
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "sender": msg.role,
                "created_at": msg.created_at,
                "document_ids": msg.document_ids.split(",") if msg.document_ids else []
            } for msg in messages
        ],
    }

@app.get('/documents')
async def get_all_documents(
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    # Only show all documents to admin users
    user_id = current_user["user_id"]
    user = db.query(database.User).filter(database.User.id == user_id).first()
    
    # You may want to add an is_admin field to your User model
    # For now, we'll just check if this is the first user (ID 1)
    if not user or user.id != 1:
        # Regular users can only see their own documents
        return await get_user_documents(db=db, current_user=current_user)
        
    documents = db.query(database.Document).order_by(database.Document.created_at.desc()).all()
    
    return {
        "documents": [
            {
                "id": doc.id,
                "user_id": doc.user_id,
                "filename": doc.filename,
                "title": doc.title,
                "created_at": doc.created_at
            } for doc in documents
        ]
    }


@app.get('/user/me')
async def get_current_user_profile(
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    user = db.query(database.User).filter(database.User.id == user_id).first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "picture": user.picture,
        "created_at": user.created_at,
        "last_login": user.last_login
    }


@app.get('/chats')
async def get_all_chats(
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    
    # Query all chats for the current user
    chats = db.query(database.Chat).filter(
        database.Chat.user_id == user_id
    ).order_by(database.Chat.created_at.desc()).all()
    
    return [
        {
            "id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at
        } for chat in chats
    ]
    
@app.get('/chat/{chat_id}/detail')
async def get_chat_detail(
    chat_id: str,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    
    # Get chat info
    chat = db.query(database.Chat).filter(
        database.Chat.id == chat_id,
        database.Chat.user_id == user_id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Get documents for this chat
    documents = db.query(database.Document).filter(
        database.Document.chat_id == chat_id,
        database.Document.user_id == user_id
    ).all()
    
    # Get messages for this chat
    messages = db.query(database.Message).filter(
        database.Message.group_id == chat_id,
        database.Message.user_id == user_id
    ).order_by(database.Message.created_at.asc()).all()
    
    return {
        "chat": {
            "id": chat.id,
            "title": chat.title,
            "created_at": chat.created_at
        },
        "documents": [
            {
                "id": doc.id,
                "filename": doc.filename,
                "title": doc.title,
                "created_at": doc.created_at
            } for doc in documents
        ],
        "messages": [
            {
                "id": msg.id,
                "content": msg.content,
                "role": msg.role,
                "created_at": msg.created_at,
                "document_ids": msg.document_ids.split(",") if msg.document_ids else []
            } for msg in messages
        ]
    }


@app.delete('/document/{document_id}')
async def delete_document(
    document_id: str,
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    
    # Get document from database
    document = db.query(database.Document).filter(
        database.Document.id == document_id,
        database.Document.user_id == user_id
    ).first()
    
    if not document:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or you don't have permission to delete it"
        )

    # Delete associated messages
    db.query(database.Message).filter(
        database.Message.document_ids.contains(document_id)
    ).delete(synchronize_session=False)
    
    # Delete the document record
    db.delete(document)
    db.commit()
    
    # Delete from vector store
    prepare_save_pdf = handleProcessDocuments()
    prepare_save_pdf.delete_document(document_id)
    
    return {"message": "Document deleted successfully"}




if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", reload=True)
