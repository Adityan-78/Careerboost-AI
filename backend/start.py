import os
from dotenv import load_dotenv
from pathlib import Path

# Load .env file
env_path = Path(__file__).parent / '.env'
print(f"Loading .env from: {env_path}")

if env_path.exists():
    load_dotenv(dotenv_path=env_path, override=True)
    print(f"✅ .env file loaded")
    api_key = os.getenv("OPENROUTER_API_KEY")
    if api_key:
        print(f"✅ API key found: {api_key[:20]}...")
    else:
        print("❌ API key NOT found in environment")
else:
    print(f"❌ .env file not found at: {env_path}")

# Now import and run main
if __name__ == "__main__":
    import uvicorn
    from main import app
    
    port = int(os.getenv("PORT", 8000))
    print(f"\n🚀 Starting server on port {port}...")
    uvicorn.run(app, host="0.0.0.0", port=port)