from langchain_text_splitters import RecursiveCharacterTextSplitter
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import ChatOpenAI
from openai import OpenAI
from pydantic import BaseModel
from uuid import uuid4
import chromadb
import os
import concurrent.futures
from dotenv import load_dotenv
load_dotenv()
from fastapi import FastAPI, UploadFile, File
app = FastAPI()
from fastapi.middleware.cors import CORSMiddleware

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ChatParameter(BaseModel):
    file_name: str
    query: str = None

class PrepareSavePdf:
    def __init__(self, pdf_file):
        self.pdf_file = pdf_file
        self.embedding_function = embedding_function=OpenAIEmbeddingFunction(
                model_name="text-embedding-3-large",
                api_key=os.getenv("OPENAI_API_KEY")
            )
        
        self.collection_name = self.pdf_file.split("/")[-1].replace(".pdf", "")
        self.message = []
        self.chroma_client = chromadb.PersistentClient(path="chroma_db")


    def extract_text(self):
        print('extracting text from pdf....')
        print('extracting text')
        loader = PyPDFLoader(self.pdf_file)
        self.text = loader.load()
        return self.text


    def split_text(self, text: str):
        print('splitting text....')
        print('splitting text')
        split_text = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )
        return split_text.split_text(text)


    def save_text_to_chroma(self, texts):
        print('saving text to chroma....')
        chroma_client = chromadb.PersistentClient(path="chroma_db")
        collection = chroma_client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedding_function
        )

        def add_chunk(chunk):
            print(f"Saving chunk: {chunk[:50]}...")
            collection.add(
                documents=[chunk],
                metadatas=[{"source": self.pdf_file}],
                ids=[str(uuid4())]
            )

        with concurrent.futures.ThreadPoolExecutor() as executor:
            list(executor.map(add_chunk, texts))

        return f"Text saved to ChromaDB collection: {self.collection_name}"


    def query_chroma(self, query, collection_name=None):
        print('querying chroma....')
        print(f"Querying ChromaDB for: {query}")
        collection = self.chroma_client.get_collection(
            name=self.collection_name,
            embedding_function=self.embedding_function
        )

        results = collection.query(
            query_texts=[query],
            n_results=20,
        )
        return results['documents'][0] if results['documents'] else "No results found."
    

    def get_all_collections(self):
        collections = self.chroma_client.list_collections()
        return [collection.name for collection in collections]
        

    def generate_tailored_response(self, query, context=None):
        llm = ChatOpenAI(
            model="gpt-4",
            temperature=0.2,
            api_key=os.getenv("OPENAI_API_KEY")
        )
        system_message = f"You are a helpful assistant. Take this document as context to answer the user's question accurately. Below is the context: {context}"
        messages = [
            SystemMessage(content=system_message),
            HumanMessage(content=query)
        ]
        response = llm.invoke(messages)
        return response.content
    
    def split_text_concurrently(self, text: str, num_parts: int = 100):
        import concurrent.futures
        print(f'splitting text into {num_parts} parts and processing concurrently...')
        length = len(text)
        # Split text into num_parts parts
        parts = [text[i*length//num_parts:(i+1)*length//num_parts] for i in range(num_parts)]
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
        )
        with concurrent.futures.ThreadPoolExecutor() as executor:
            results = list(executor.map(splitter.split_text, parts))
        # Flatten the list of lists
        return [chunk for sublist in results for chunk in sublist]
    
    def clear_collection(self):
        collections = self.chroma_client.list_collections()
        for collection in collections:
            self.chroma_client.delete_collection(name=collection.name)
        return "All collections cleared."
    
@app.get("/")
def health_check():
    return {"status": "ok"}


@app.post('/upload_pdf')
async def upload_pdf(pdf_file: UploadFile = File(...)):
    os.makedirs("temp", exist_ok=True)

    # Save file
    pdf_path = f"temp/{pdf_file.filename}"
    with open(pdf_path, "wb") as f:
        content = await pdf_file.read()
        f.write(content)
    prepare_save_pdf = PrepareSavePdf(pdf_path)
    
    texts = prepare_save_pdf.extract_text()
    text_string = "\n".join([doc.page_content for doc in texts])
    split_texts = prepare_save_pdf.split_text(text_string)
    collection_name = prepare_save_pdf.save_text_to_chroma(split_texts)
    return {"status": collection_name}


@app.post('/chat')
async def query_chroma(chat_query: ChatParameter):
    prepare_save_pdf = PrepareSavePdf(chat_query.file_name)
    results = prepare_save_pdf.query_chroma(chat_query.query, chat_query.file_name)
    response = prepare_save_pdf.generate_tailored_response(
        query=chat_query.query,
        context=results
    )
    return {"response": response}


@app.get('/get_collections')
async def get_collections():
    prepare_save_pdf = PrepareSavePdf("")
    collections = prepare_save_pdf.get_all_collections()
    return collections

@app.delete('/clear_collection')
async def clear_collection():
    prepare_save_pdf = PrepareSavePdf("")
    response = prepare_save_pdf.clear_collection()
    return {"response": response}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", reload=True)
    