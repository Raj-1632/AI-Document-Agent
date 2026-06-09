import os
from google import genai
from dotenv import load_dotenv

load_dotenv()
api_key = os.getenv("GEMINI_API_KEY")

# In the new SDK, Client takes api_key directly or loads from GEMINI_API_KEY env
client = genai.Client(api_key=api_key)

try:
    print("Listing available models with google-genai SDK:")
    models = client.models.list()
    for m in models:
        print(f"- {m.name} (Actions: {m.supported_actions})")
except Exception as e:
    print(f"Error: {e}")
