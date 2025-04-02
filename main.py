from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import openai
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

# Configure OpenAI API
openai.api_key = OPENAI_API_KEY

# Initialize FastAPI app
app = FastAPI()

# Allow CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this to your frontend domain for security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request model
class ChatRequest(BaseModel):
    message: str

# Chat endpoint
@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        user_input = request.message
        prompt = f"You are a mental health AI companion named Mentality. Provide a supportive, empathetic, and engaging response for this user query: '{user_input}'. Focus on emotional support and well-being."
        
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",  # Change to "gpt-4" if needed
            messages=[{"role": "system", "content": "You are a helpful and supportive AI."},
                      {"role": "user", "content": prompt}]
        )
        
        return {"response": response["choices"][0]["message"]["content"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Root endpoint
@app.get("/")
async def root():
   return {"message": "Mentality AI Backend is Running!"}