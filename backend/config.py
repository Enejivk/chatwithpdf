import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration variables
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
CHROMA_DB_PATH = "chroma_db"
TEMP_DIR = "temp"
PDF_COLLECTION_NAME = "pdf_documents"
EMBEDDING_MODEL = "text-embedding-3-large"
LLM_MODEL = "gpt-4"
LLM_TEMPERATURE = 0.2
CHUNK_SIZE = 1000
CHUNK_OVERLAP = 200
