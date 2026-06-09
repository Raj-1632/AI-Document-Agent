import os
from typing import List, Dict, Any
from pypdf import PdfReader

def extract_text_from_pdf(file_path: str) -> Dict[str, Any]:
    """
    Parses a PDF file and extracts text page-by-page.
    
    Returns:
        dict: A dictionary containing:
            - pages: List[dict] with 'text' and 'page_number' (1-indexed)
            - metadata: dict with page_count, file_name, file_size
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"PDF file not found at {file_path}")
        
    reader = PdfReader(file_path)
    pages = []
    
    for idx, page in enumerate(reader.pages):
        text = page.extract_text() or ""
        # Clean up text encoding issues if any, strip whitespace
        cleaned_text = text.strip()
        pages.append({
            "text": cleaned_text,
            "page_number": idx + 1
        })
        
    file_size_bytes = os.path.getsize(file_path)
    file_size_kb = round(file_size_bytes / 1024, 2)
    
    metadata = {
        "file_name": os.path.basename(file_path),
        "page_count": len(reader.pages),
        "file_size_kb": file_size_kb
    }
    
    return {
        "pages": pages,
        "metadata": metadata
    }
