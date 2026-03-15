import os
from dotenv import load_dotenv

# Test loading from backend/.env
print("--- ENV DEBUG ---")
load_dotenv("/home/saran/Desktop/trace/backend/.env")
print(f"GROQ_API_KEY present: {bool(os.getenv('GROQ_API_KEY'))}")
print(f"OPENAI_API_KEY present: {bool(os.getenv('OPENAI_API_KEY'))}")

# Check current env
print(f"Current GROQ: {os.getenv('GROQ_API_KEY')[:10] if os.getenv('GROQ_API_KEY') else 'None'}")
