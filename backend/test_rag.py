import os
import shutil
from dotenv import load_dotenv

# Import services to test
from services.llm_service import generate_summary_and_keywords, generate_rag_answer
from services.rag_service import create_vector_store, retrieve_context

def run_test():
    print("--- starting AI RAG Integration Test ---")
    load_dotenv()
    
    # 1. Verify environment API key
    gemini_key = os.getenv("GEMINI_API_KEY")
    if not gemini_key:
        print("[-] FAIL: GEMINI_API_KEY is not configured in .env file.")
        return False
    print("[+] PASS: GEMINI_API_KEY detected in environment.")
    
    # 2. Define Mock Document Content (simulating pages of a PDF)
    mock_pages = [
        {
            "page_number": 1,
            "text": (
                "Project Apollo was initialized in 2026. The main objective is to establish a modular, "
                "AI-driven framework for semantic document analysis. Dr. Elena Vance is the lead director "
                "of this initiative, managing a team of fifteen engineers. The project is funded by the "
                "Global Science Alliance with a budget of 4.5 million dollars."
            )
        },
        {
            "page_number": 2,
            "text": (
                "The core technology of Project Apollo involves vector databases and retrieval-augmented "
                "generation. FAISS is utilized as the primary vector index due to its high computational "
                "efficiency. The development team decided to restrict document uploads to PDF files under "
                "15MB. The timeline projects a public alpha release in December 2026, followed by beta testing."
            )
        }
    ]
    print("[+] Page parsing simulator ready.")
    
    # 3. Test LLM Summarization and Keyword Extraction
    print("\n--- Testing Summarization & Keyword Extraction ---")
    full_text = "\n".join([page["text"] for page in mock_pages])
    try:
        summary_result = generate_summary_and_keywords(
            text_sample=full_text,
            provider="gemini",
            api_key=gemini_key
        )
        print(f"[+] Summary: {summary_result.get('summary')}")
        print(f"[+] Keywords: {summary_result.get('keywords')}")
        assert "summary" in summary_result
        assert len(summary_result.get("keywords", [])) > 0
        print("[+] PASS: Summarization & Keyword extraction successful.")
    except Exception as e:
        print(f"[-] FAIL: Summarization & Keyword extraction failed: {str(e)}")
        return False
        
    # 4. Test Vector Database Creation (FAISS)
    print("\n--- Testing Local FAISS Vector DB Indexing ---")
    test_doc_id = "test_apollo_doc"
    try:
        # Create vector store
        db_path = create_vector_store(
            doc_id=test_doc_id,
            pages=mock_pages,
            provider="gemini",
            api_key=gemini_key
        )
        print(f"[+] Vector store index successfully saved locally at: {db_path}")
        assert os.path.exists(db_path)
        print("[+] PASS: Local FAISS vector store creation successful.")
    except Exception as e:
        print(f"[-] FAIL: Local FAISS vector store creation failed: {str(e)}")
        return False
        
    # 5. Test Context Retrieval & Grounded Q&A
    print("\n--- Testing Context Retrieval & RAG Answering ---")
    test_query = "Who is the lead director of Project Apollo and what is the budget?"
    try:
        # Retrieve context
        context_chunks = retrieve_context(
            doc_id=test_doc_id,
            query=test_query,
            provider="gemini",
            api_key=gemini_key,
            k=2
        )
        print(f"[+] Retrieved {len(context_chunks)} relevant source blocks.")
        for chunk in context_chunks:
            print(f"    - Page {chunk['page_number']}: {chunk['text'][:80]}...")
            
        assert len(context_chunks) > 0
        
        # Ask LLM to generate answer
        answer = generate_rag_answer(
            question=test_query,
            context_chunks=context_chunks,
            provider="gemini",
            api_key=gemini_key
        )
        print(f"\n[+] RAG Answer: {answer}")
        
        # Basic check for key facts in answer
        assert "Vance" in answer or "Elena" in answer
        assert "4.5" in answer or "million" in answer
        print("\n[+] PASS: Context retrieval and grounded RAG answer successful.")
        
    except Exception as e:
        print(f"[-] FAIL: Context retrieval & RAG answering failed: {str(e)}")
        return False
    finally:
        # Clean up test database folder
        db_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "db", test_doc_id)
        if os.path.exists(db_dir):
            shutil.rmtree(db_dir, ignore_errors=True)
            
    print("\n--- All Integration Tests Passed Successfully! ---")
    return True

if __name__ == "__main__":
    run_test()
