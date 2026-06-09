import os
import uuid
import shutil
import json
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Header, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Import our custom services
from services.pdf_service import extract_text_from_pdf
from services.llm_service import generate_summary_and_keywords, generate_rag_answer
from services.rag_service import create_vector_store, retrieve_context

# Load environment variables
load_dotenv()

app = FastAPI(title="AI Document Intelligence API", version="1.0.0")

# Setup CORS to allow Vite frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict this to the frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Constants & Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
DB_DIR = os.path.join(BASE_DIR, "db")
DOCS_INDEX_FILE = os.path.join(DB_DIR, "documents.json")

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(DB_DIR, exist_ok=True)

# Helper to read/write document index
def read_documents_index() -> dict:
    if not os.path.exists(DOCS_INDEX_FILE):
        return {}
    try:
        with open(DOCS_INDEX_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {}

def write_documents_index(data: dict):
    with open(DOCS_INDEX_FILE, "w") as f:
        json.dump(data, f, indent=4)

# Request Models
class ChatRequest(BaseModel):
    doc_id: str
    question: str
    provider: Optional[str] = "gemini"
    api_key: Optional[str] = None

@app.get("/api/health")
def health_check():
    return {"status": "healthy"}

@app.get("/api/documents")
def list_documents():
    """
    Returns a list of all uploaded and processed documents.
    """
    docs = read_documents_index()
    # Return as list of objects sorted by upload time or name
    return list(docs.values())

@app.post("/api/upload")
async def upload_document(
    file: UploadFile = File(...),
    provider: str = Form("gemini"),
    api_key: Optional[str] = Form(None)
):
    """
    Uploads a PDF, extracts text, generates summary and keywords,
    creates FAISS embeddings, and stores document metadata.
    """
    # 1. Validate File Type
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported."
        )
        
    doc_id = str(uuid.uuid4())
    temp_file_path = os.path.join(UPLOADS_DIR, f"{doc_id}_{file.filename}")
    
    # 2. Save file temporarily
    try:
        with open(temp_file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to write uploaded file to disk: {str(e)}"
        )
        
    try:
        # 3. Extract text from PDF
        parsed_data = extract_text_from_pdf(temp_file_path)
        pages = parsed_data["pages"]
        metadata = parsed_data["metadata"]
        
        # Compile all text to generate a summary
        full_text = "\n".join([page["text"] for page in pages])
        if not full_text.strip():
            raise ValueError("No text could be extracted from this PDF. It might be scanned or empty.")
            
        # 4. Generate summary and keywords using selected LLM
        # Determine actual API key (provided via form parameter or environment)
        resolved_api_key = api_key if api_key and api_key.strip() else None
        summary_data = generate_summary_and_keywords(
            text_sample=full_text,
            provider=provider,
            api_key=resolved_api_key
        )
        
        # 5. Create local FAISS vector index
        create_vector_store(
            doc_id=doc_id,
            pages=pages,
            provider=provider,
            api_key=resolved_api_key
        )
        
        # 6. Save metadata to local index JSON
        docs = read_documents_index()
        doc_entry = {
            "id": doc_id,
            "file_name": metadata["file_name"],
            "page_count": metadata["page_count"],
            "file_size_kb": metadata["file_size_kb"],
            "summary": summary_data["summary"],
            "keywords": summary_data["keywords"],
        }
        docs[doc_id] = doc_entry
        write_documents_index(docs)
        
        return doc_entry
        
    except Exception as e:
        # Cleanup vector store subfolder if it was partially created
        db_path = os.path.join(DB_DIR, doc_id)
        if os.path.exists(db_path):
            shutil.rmtree(db_path, ignore_errors=True)
            
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e)
        )
    finally:
        # Always remove temporary raw PDF file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.post("/api/chat")
async def chat_with_document(request: ChatRequest):
    """
    Retrieves relevant document segments using similarity search,
    sends context to LLM, and returns the grounded response with citations.
    """
    docs = read_documents_index()
    if request.doc_id not in docs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found or has been deleted."
        )
        
    try:
        # Resolve API Key
        resolved_api_key = request.api_key if request.api_key and request.api_key.strip() else None
        
        # 1. Retrieve top 5 semantic chunks from FAISS vector store
        context_chunks = retrieve_context(
            doc_id=request.doc_id,
            query=request.question,
            provider=request.provider,
            api_key=resolved_api_key,
            k=5
        )
        
        if not context_chunks:
            return {
                "answer": "I couldn't find any relevant sections in the document to answer your question.",
                "citations": []
            }
            
        # 2. Run LLM Grounded Generation
        answer = generate_rag_answer(
            question=request.question,
            context_chunks=context_chunks,
            provider=request.provider,
            api_key=resolved_api_key
        )
        
        return {
            "answer": answer,
            "citations": context_chunks
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error performing RAG chat: {str(e)}"
        )

@app.delete("/api/documents/{doc_id}")
def delete_document(doc_id: str):
    """
    Deletes the document's local vector index and its metadata index entry.
    """
    docs = read_documents_index()
    if doc_id not in docs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found."
        )
        
    # Remove vector index folder
    db_path = os.path.join(DB_DIR, doc_id)
    if os.path.exists(db_path):
        shutil.rmtree(db_path, ignore_errors=True)
        
    # Delete entry from index json
    del docs[doc_id]
    write_documents_index(docs)
    
    return {"status": "success", "message": f"Document {doc_id} deleted."}
