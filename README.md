# ChatWithPDF

ChatWithPDF is a full-stack application that allows users to upload, analyze, and interact with PDF documents using a chat interface powered by AI. The application uses a Retrieval-Augmented Generation (RAG) approach to answer questions based on the content of uploaded PDFs.

![ChatWithPDF](https://via.placeholder.com/800x450.png?text=ChatWithPDF+Screenshot)

## Features

- **PDF Document Upload**: Upload and process PDF files
- **Document Management**: View and organize your uploaded documents
- **AI-powered Chat Interface**: Ask questions about your documents and receive intelligent responses
- **Chat History**: Review and continue previous conversations
- **Google Authentication**: Secure user authentication using Google Sign-In
- **Responsive Design**: Works on both desktop and mobile devices
- **Dark Mode**: Modern dark-themed UI for comfortable viewing

## Technology Stack

### Backend

- **FastAPI**: High-performance Python web framework
- **SQLAlchemy**: SQL toolkit and ORM
- **LangChain**: Framework for developing applications powered by language models
- **ChromaDB**: Vector database for storing document embeddings
- **OpenAI**: AI models for embeddings and chat completion
- **PyPDF**: PDF processing library

### Frontend

- **React 19**: JavaScript library for building user interfaces
- **TypeScript**: Typed JavaScript for better code quality
- **Vite**: Next-generation frontend tooling
- **Tailwind CSS**: Utility-first CSS framework
- **React Router**: Navigation for React applications
- **Axios**: Promise-based HTTP client
- **React Markdown**: Markdown rendering for chat responses

## Getting Started

### Prerequisites

- Python 3.10+
- Node.js 18+
- OpenAI API key

### Backend Setup

1. Clone the repository:

   ```bash
   git clone https://github.com/yourusername/chatwithpdf.git
   cd chatwithpdf
   ```

2. Set up a Python virtual environment:

   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install the required dependencies:

   ```bash
   pip install -r requirements.txt
   ```

4. Create a `.env` file in the backend directory with the following variables:

   ```
   OPENAI_API_KEY=your_openai_api_key
   JWT_SECRET_KEY=your_random_secret_key
   JWT_REFRESH_SECRET_KEY=your_random_refresh_secret_key
   ```

5. Start the backend server:
   ```bash
   uvicorn main:app --reload
   ```

### Frontend Setup

1. Navigate to the frontend directory:

   ```bash
   cd ../frontend
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the development server:

   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
chatwithpdf/
├── backend/
│   ├── app.py             # FastAPI application setup
│   ├── auth.py            # Authentication logic
│   ├── config.py          # Configuration variables
│   ├── database.py        # Database models and setup
│   ├── helpers.py         # Utility functions
│   ├── main.py            # Application entry point
│   ├── models.py          # Database models
│   ├── pdf_processor.py   # PDF processing and RAG implementation
│   ├── requirements.txt   # Python dependencies
│   └── user_models.py     # User-related models
│
├── frontend/
│   ├── public/            # Static assets
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts
│   │   ├── services/      # API services
│   │   ├── types/         # TypeScript type definitions
│   │   ├── utils/         # Utility functions
│   │   ├── App.tsx        # Main application component
│   │   └── main.tsx       # Application entry point
│   ├── package.json       # Node.js dependencies
│   └── vite.config.ts     # Vite configuration
│
└── README.md              # Project documentation
```

## Usage

1. **Sign In**: Use Google Sign-In to authenticate
2. **Upload Documents**: Click the upload button to add PDF documents
3. **Select Documents**: Choose which documents to include in your chat
4. **Ask Questions**: Type your questions in the chat interface
5. **View History**: Access previous conversations from the chat history panel

## How It Works

1. When a PDF is uploaded, the application:

   - Extracts text from the PDF
   - Splits the text into smaller chunks
   - Creates embeddings for each chunk using OpenAI embeddings
   - Stores these embeddings in ChromaDB
   - Generates a summary of the document

2. When a user asks a question:
   - The application finds the most relevant chunks using semantic search
   - The relevant chunks are sent to the OpenAI model along with the question
   - The model generates a response based on the document content
   - The response is formatted and returned to the user

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [OpenAI](https://openai.com/) for providing the AI models
- [LangChain](https://www.langchain.com/) for the RAG framework
- [FastAPI](https://fastapi.tiangolo.com/) for the backend framework
- [React](https://reactjs.org/) for the frontend library
