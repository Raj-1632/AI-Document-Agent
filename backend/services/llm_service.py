import os
import json
from typing import Dict, Any, List, Optional
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage

def get_llm(provider: str, api_key: Optional[str] = None, model_name: Optional[str] = None):
    """
    Helper to instantiate the appropriate LangChain chat model.
    """
    provider = provider.lower()
    
    # 1. Google Gemini Provider
    if provider == "gemini":
        key = api_key or os.getenv("GEMINI_API_KEY")
        if not key:
            raise ValueError("Gemini API Key is missing. Please configure it in Settings or .env")
        
        # Use gemini-2.5-flash as default, or gemini-2.5-pro
        model = model_name or "gemini-2.5-flash"
        return ChatGoogleGenerativeAI(
            model=model,
            google_api_key=key,
            temperature=0.2
        )
        
    # 2. OpenAI Provider
    elif provider == "openai":
        key = api_key or os.getenv("OPENAI_API_KEY")
        if not key:
            raise ValueError("OpenAI API Key is missing. Please configure it in Settings or .env")
            
        model = model_name or "gpt-4o-mini"
        return ChatOpenAI(
            model=model,
            api_key=key,
            temperature=0.2
        )
    else:
        raise ValueError(f"Unsupported provider: {provider}")

def generate_summary_and_keywords(
    text_sample: str, 
    provider: str = "gemini", 
    api_key: Optional[str] = None
) -> Dict[str, Any]:
    """
    Generates a document summary and a list of key topics/keywords based on a text sample.
    """
    llm = get_llm(provider, api_key)
    
    # Restrict text_sample size to avoid overflowing token limits for short analysis
    # Typically 8000 characters is plenty for a representative sample
    sample_limit = 12000
    cleaned_sample = text_sample[:sample_limit]
    
    system_prompt = (
        "You are an expert AI Document Intelligence system. Your task is to analyze the text provided "
        "and return a JSON response containing a summary and a list of key topics or keywords.\n"
        "Your response MUST be valid JSON with exactly two keys:\n"
        '1. "summary": A concise, engaging, and professional paragraph summarizing the core themes of the document.\n'
        '2. "keywords": A list of 5 to 10 key topics, technical terms, or concepts extracted from the text.\n'
        "Do not include any formatting like ```json or ```, just return the raw JSON string."
    )
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=f"Here is the document content sample:\n\n{cleaned_sample}")
    ]
    
    try:
        response = llm.invoke(messages)
        content = response.content.strip()
        
        # Clean response string if LLM includes markdown JSON codeblocks
        if content.startswith("```"):
            lines = content.splitlines()
            if lines[0].startswith("```json") or lines[0].startswith("```"):
                content = "\n".join(lines[1:-1])
            elif lines[-1] == "```":
                content = "\n".join(lines[:-1])
                
        result = json.loads(content)
        # Ensure correct structure
        if "summary" not in result or "keywords" not in result:
            raise ValueError("Missing required keys in JSON")
        return result
        
    except Exception as e:
        # Fallback if LLM output parsing fails
        print(f"Error parsing LLM JSON response: {str(e)}")
        # Construct a simple recovery response from plain text if it failed
        return {
            "summary": "Failed to automatically generate structured summary. Please check your API key and connection.",
            "keywords": ["Error", "Processing", "Document"]
        }

def generate_rag_answer(
    question: str, 
    context_chunks: List[Dict[str, Any]], 
    provider: str = "gemini", 
    api_key: Optional[str] = None
) -> str:
    """
    Answers a question grounded in the retrieved document chunks.
    """
    llm = get_llm(provider, api_key)
    
    # Format the chunks into a clear context section
    formatted_context = ""
    for idx, chunk in enumerate(context_chunks):
        formatted_context += f"--- SOURCE BLOCK {idx + 1} (Page {chunk['page_number']}) ---\n"
        formatted_context += f"{chunk['text']}\n\n"
        
    system_prompt = (
        "You are an expert AI Document Assistant. You are answering questions about an uploaded PDF document.\n"
        "Use ONLY the provided Source Blocks below to answer the user's question. "
        "Keep your answer precise, helpful, and completely grounded in the context. "
        "If the context does not contain the answer, state honestly that the information is not found in the document.\n\n"
        "Reference citations using [Page X] when citing information from a page. "
        "For example: 'The project budget was increased by 10% [Page 3].'\n\n"
        "Context:\n"
        f"{formatted_context}"
    )
    
    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=question)
    ]
    
    response = llm.invoke(messages)
    return response.content.strip()
