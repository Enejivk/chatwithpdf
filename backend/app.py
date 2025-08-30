from email.mime import message
from unittest import result
from urllib import response
from fastapi import FastAPI, UploadFile, File, Depends, HTTPException, status, Response
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
    file_name: str
    query: str = None
    group_id: str | None = None
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
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    file_id: str = helpers.generate_unique_id()
    chat_id = helpers.generate_unique_id()

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

    prepare_save_pdf.save_text_to_chroma(texts=texts, file_id=file_id, file_name=document.filename, current_user_id=user_id)
    
    # Store document info in the database
    db_document = database.Document(
        chat_id=chat_id,
        user_id=user_id,
        id=file_id,
        filename=document.filename,
        content_type=document.content_type,
        file_path=pdf_path,
        file_size=document.size,
        title=document.filename.replace(".pdf", "")
    )
    
    # Create a new chat for this document
    db_chat = database.Chat(
        id=chat_id,
        user_id=user_id,
        title=document.filename.replace(".pdf", "")
    )
    
    db.add(db_chat)
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    
    # Delete the PDF file after successful processing
    prepare_save_pdf.delete_pdf_file()
    return {
        "status": "success",
        "id": db_document.id,
        "chat_id": db_document.chat_id, 
        "user_id": db_document.user_id,
        "filename": db_document.filename,
        "content_type": db_document.content_type,
        "file_path": db_document.file_path,
        "file_size": db_document.file_size,
        "title": db_document.title,
        "created_at": db_document.created_at
    }

@app.post('/chat')
async def query_chroma(
    chat_query: ChatParameter, 
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    user_id = current_user["user_id"]
    
    group_id = chat_query.group_id
    if not group_id:
        group_id = helpers.generate_unique_id()

    prepare_save_pdf = handleProcessDocuments()
    
    results = prepare_save_pdf.query_chroma(chat_query.query, chat_query.document_ids)
    
    response = prepare_save_pdf.generate_tailored_response(
        query=chat_query.query,
        context=results
    )
    
    message = database.Message(
        user_id=user_id,
        group_id=group_id,
        role="user",
        content=chat_query.query,
        document_ids=",".join(chat_query.document_ids) if chat_query.document_ids else None
    )

    # Add the message to the database
    db.add(message)
    db.commit()
    
    # Also save the assistant's response
    response_message = database.Message(
        user_id=user_id,
        group_id=group_id,
        role="assistant",
        content=response,
        document_ids=",".join(chat_query.document_ids) if chat_query.document_ids else None
    )
    
    db.add(response_message)
    db.commit()
    
    return {
        "response": response, 
        "context": results,
        "group_id": group_id,
        "message_id": message.id
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

@app.delete('/clear_collection')
async def clear_collection(
    db: Session = Depends(database.get_db),
    current_user = Depends(auth.get_current_user)
):
    # Only allow admin to clear collections
    user_id = current_user["user_id"]
    user = db.query(database.User).filter(database.User.id == user_id).first()
    
    # You may want to add an is_admin field to your User model
    # For now, we'll just check if this is the first user (ID 1)
    if not user or user.id != 1:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only administrators can perform this action"
        )
        
    prepare_save_pdf = handleProcessDocuments("", current_user_id=user_id)
    response = prepare_save_pdf.clear_collection()
    return {"response": response}


@app.get('/chat_history/{document_id}')
async def get_chat_history(
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
        return {"history": []}
    
    # Get chat history for document using Message model instead of ChatHistory
    history = db.query(database.Message).filter(
        database.Message.document_ids.contains(document.id),
        database.Message.user_id == user_id
    ).order_by(database.Message.created_at.desc()).all()
    
    # Group messages by role to create conversation pairs
    conversations = []
    for i in range(0, len(history), 2):
        if i+1 < len(history):
            # Assuming messages are paired (user query followed by assistant response)
            conversations.append({
                "id": history[i].id,
                "query": history[i].content if history[i].role == "user" else history[i+1].content,
                "response": history[i+1].content if history[i+1].role == "assistant" else history[i].content,
                "created_at": history[i].created_at
            })
        else:
            # Handle odd number of messages
            conversations.append({
                "id": history[i].id,
                "query": history[i].content if history[i].role == "user" else "",
                "response": "" if history[i].role == "user" else history[i].content,
                "created_at": history[i].created_at
            })
    
    return {
        "history": conversations
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", reload=True)
