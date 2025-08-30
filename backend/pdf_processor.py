import os
import chromadb
import concurrent.futures
import config
from uuid import uuid4
from langchain_text_splitters import RecursiveCharacterTextSplitter
from chromadb.utils.embedding_functions import OpenAIEmbeddingFunction
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_community.document_loaders import PyPDFLoader
from langchain_openai import ChatOpenAI


class handleProcessDocuments:
    def __init__(self):
        self.embedding_function = OpenAIEmbeddingFunction(
                model_name=config.EMBEDDING_MODEL,
                api_key=config.OPENAI_API_KEY,
                organization_id=None
            )
        
        self.collection_name = config.PDF_COLLECTION_NAME
        self.messages = []
        self.chroma_client = chromadb.PersistentClient(path=config.CHROMA_DB_PATH)

    def extract_text(self, file_path):
        print('extracting text from pdf....')
        loader = PyPDFLoader(self.pdf_file)
        self.text = loader.load()
        return self.text

    def split_text(self, documents):
        print('splitting documents into chunks...')
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.CHUNK_SIZE,
            chunk_overlap=config.CHUNK_OVERLAP,
        )
        
        chunked_documents = []
        for doc in documents:
            page_num = doc.metadata.get('page', 0)
            chunks = splitter.split_text(doc.page_content)
            
            # Preserve page metadata for each chunk
            for chunk in chunks:
                # Create a document-like object with page metadata
                chunked_documents.append({
                    'page_content': chunk,
                    'metadata': {'page': page_num, **doc.metadata}
                })
                
        return chunked_documents

    def save_text_to_chroma(self, texts, file_id, file_name, current_user_id):
        print('saving text to chroma....')
        
        chroma_client = chromadb.PersistentClient(path=config.CHROMA_DB_PATH)
        collection = chroma_client.get_or_create_collection(
            name=self.collection_name,
            embedding_function=self.embedding_function
        )

        for i, doc in enumerate(texts):
            page_num = doc.metadata.get('page', i+1) if hasattr(doc, 'metadata') else i+1
            doc_content = doc.page_content if hasattr(doc, 'page_content') else doc
            print(f"Saving chunk from page {page_num}: {doc_content[:50]}...")
            print("file_name:", type(file_name), "file_id:", type(file_id), "page_num:", type(page_num), "current_user_id:", type(self.current_user_id))
            collection.add(
                documents=[doc_content],
                metadatas=[{
                    "source": file_name,
                    "pdf_id": file_id,
                    "page": page_num,
                    "current_user_id": current_user_id,
                    "document_name": file_name,

                }],
                ids=[f"{file_id}_p{page_num}_{str(uuid4())}"]
            )

    def query_chroma(self, query, pdf_id=None):
        print('querying chroma....')
        print(f"Querying ChromaDB for: {query}")
        collection = self.chroma_client.get_collection(
            name=self.collection_name,
            embedding_function=self.embedding_function
        )

        # Use pdf_id as a filter if provided
        if pdf_id:
            results = collection.query(
                query_texts=[query],
                n_results=20,
                where={"pdf_id": pdf_id}
            )
        else:
            results = collection.query(
                query_texts=[query],
                n_results=20
            )
        
        # Combine the document content with source information
        if results['documents'] and results['documents'][0]:
            documents = results['documents'][0]
            metadatas = results['metadatas'][0]
            
            formatted_results = []
            for i, (doc, metadata) in enumerate(zip(documents, metadatas)):
                doc_name = metadata.get('document_name', 'Unknown')
                page_num = metadata.get('page', 'Unknown')
                formatted_results.append(f"[Document: {doc_name}, Page: {page_num}]\n{doc}")
            
            return "\n\n".join(formatted_results)
        else:
            return "No results found."
    
    def get_all_collections(self):
        collections = self.chroma_client.list_collections()
        return [collection.name for collection in collections]
        
    def generate_tailored_response(self, query, context=None):
        llm = ChatOpenAI(
            model=config.LLM_MODEL,
            temperature=config.LLM_TEMPERATURE,
            api_key=config.OPENAI_API_KEY
        )
        system_message = f"You are a helpful assistant. Take this document as context to answer the user's question accurately. Below is the context: {context}"
        messages = [
            SystemMessage(content=system_message),
            HumanMessage(content=query)
        ]
        response = llm.invoke(messages)
        return response.content
    
    def split_text_concurrently(self, text: str, num_parts: int = 100):
        print(f'splitting text into {num_parts} parts and processing concurrently...')
        length = len(text)
        # Split text into num_parts parts
        parts = [text[i*length//num_parts:(i+1)*length//num_parts] for i in range(num_parts)]
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=config.CHUNK_SIZE,
            chunk_overlap=config.CHUNK_OVERLAP,
        )
        with concurrent.futures.ThreadPoolExecutor() as executor:
            results = list(executor.map(splitter.split_text, parts))

        return [chunk for sublist in results for chunk in sublist]
    
    def clear_collection(self):
        collections = self.chroma_client.list_collections()
        for collection in collections:
            self.chroma_client.delete_collection(name=collection.name)
        return "All collections cleared."
        
    def delete_pdf_file(self):
        """Delete the PDF file after it has been processed."""
        if self.pdf_file and os.path.exists(self.pdf_file):
            try:
                os.remove(self.pdf_file)
                print(f"Successfully deleted file: {self.pdf_file}")
                return True
            except Exception as e:
                print(f"Error deleting file {self.pdf_file}: {str(e)}")
                return False
        return False
