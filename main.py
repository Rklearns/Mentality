from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict, List, Any
import os
import json
import uuid
import logging
from datetime import datetime
import google.generativeai as genai
import asyncio

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(title="Mentality - Mental Health Chatbot API")

# Add CORS middleware to allow requests from your Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your Vercel domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Check for Gemini API key
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY environment variable is not set")

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Data models
class ChatMessage(BaseModel):
    message: str
    chat_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    chat_id: str

# In-memory storage for chat sessions
# In production, use a database
chat_sessions = {}

# Crisis keywords to detect potential mental health emergencies
crisis_keywords = [
    "suicide", "kill myself", "want to die", "end my life", 
    "self-harm", "hurt myself", "cutting myself", 
    "no reason to live", "better off dead", "don't want to be alive"
]

# Mental health resources
crisis_resources = {
    "US": {
        "National Suicide Prevention Lifeline": "1-800-273-8255",
        "Crisis Text Line": "Text HOME to 741741",
    },
    "International": {
        "International Association for Suicide Prevention": "https://www.iasp.info/resources/Crisis_Centres/",
    }
}

# System prompt for mental health guidance
MENTAL_HEALTH_PROMPT = """
You are Mentality, a compassionate mental health chatbot designed to provide support and guidance.

IMPORTANT GUIDELINES:
1. You are NOT a replacement for professional mental health care. Always clarify this when appropriate.
2. For crisis situations (mentions of suicide, self-harm), prioritize safety and direct to crisis resources.
3. Use evidence-based approaches like CBT, mindfulness, and behavioral activation.
4. Respond with empathy, validation, and without judgment.
5. Focus on practical, actionable strategies the person can implement.
6. Maintain appropriate boundaries - you are a supportive tool, not a friend or therapist.
7. Keep responses concise (2-3 paragraphs maximum) and focused on the user's needs.

MENTAL HEALTH KNOWLEDGE:
- Anxiety: Deep breathing, grounding techniques (5-4-3-2-1), challenging catastrophic thinking, gradual exposure
- Depression: Behavioral activation (small steps), challenging negative thoughts, maintaining connections, routine
- Stress: Identifying stressors, setting boundaries, time management, relaxation techniques
- Sleep: Consistent schedule, bedtime routine, limiting screen time, sleep environment optimization
- Mindfulness: Present moment awareness, body scan, mindful breathing, non-judgmental observation

Remember to be warm, empathetic, and supportive in your responses.
"""

# Helper functions
def detect_crisis(message: str) -> bool:
    """Check if the message contains crisis keywords"""
    message_lower = message.lower()
    for keyword in crisis_keywords:
        if keyword in message_lower:
            return True
    return False

def get_crisis_response() -> str:
    """Generate a response for crisis situations"""
    response = (
        "I'm concerned about what you've shared. If you're having thoughts of harming yourself, "
        "please reach out to a crisis helpline immediately:\n\n"
        "🇺🇸 US: National Suicide Prevention Lifeline: 1-800-273-8255\n"
        "🇺🇸 US: Crisis Text Line: Text HOME to 741741\n\n"
        "These services are confidential and available 24/7. You deserve support, and trained counselors "
        "are ready to help you through this difficult time."
    )
    return response

async def generate_gemini_response(message: str, chat_history: List[Dict[str, Any]]) -> str:
    """Generate a response using Gemini API"""
    try:
        # Create a conversation history for context
        conversation_history = ""
        for entry in chat_history[-5:]:  # Use last 5 messages for context
            role = "User" if entry["role"] == "user" else "Mentality"
            conversation_history += f"{role}: {entry['content']}\n"
        
        # Set up the model
        model = genai.GenerativeModel(
            model_name="gemini-1.5-pro",
            generation_config={
                "temperature": 0.7,
                "top_p": 0.95,
                "top_k": 40,
                "max_output_tokens": 1024,
            },
            safety_settings=[
                {
                    "category": "HARM_CATEGORY_HARASSMENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_HATE_SPEECH",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                },
                {
                    "category": "HARM_CATEGORY_DANGEROUS_CONTENT",
                    "threshold": "BLOCK_MEDIUM_AND_ABOVE"
                }
            ]
        )
        
        # Prepare the prompt with context
        full_prompt = f"{MENTAL_HEALTH_PROMPT}\n\nPrevious conversation:\n{conversation_history}\n\nUser: {message}\nMentality:"
        
        # Generate response
        response = await asyncio.to_thread(
            lambda: model.generate_content(full_prompt).text
        )
        
        return response
    except Exception as e:
        logger.error(f"Error generating Gemini response: {e}")
        return "I'm having trouble connecting to my knowledge base. Could we try again in a moment?"

# API endpoints
@app.get("/")
async def root():
    return {"message": "Welcome to the Mentality Mental Health Chatbot API"}

@app.post("/", response_model=ChatResponse)
async def chat(request: ChatMessage):
    try:
        # Get or create chat session
        chat_id = request.chat_id or str(uuid.uuid4())
        
        if chat_id not in chat_sessions:
            chat_sessions[chat_id] = {
                "messages": [],
                "created_at": datetime.now().isoformat()
            }
        
        # Add user message to session
        chat_sessions[chat_id]["messages"].append({
            "role": "user",
            "content": request.message,
            "timestamp": datetime.now().isoformat()
        })
        
        # Check for crisis keywords
        if detect_crisis(request.message):
            response_text = get_crisis_response()
        else:
            # Generate response with Gemini
            response_text = await generate_gemini_response(
                request.message, 
                chat_sessions[chat_id]["messages"]
            )
        
        # Add bot response to session
        chat_sessions[chat_id]["messages"].append({
            "role": "assistant",
            "content": response_text,
            "timestamp": datetime.now().isoformat()
        })
        
        return ChatResponse(
            response=response_text,
            chat_id=chat_id
        )
    
    except Exception as e:
        logger.error(f"Error in chat endpoint: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/chat/{chat_id}/history")
async def get_chat_history(chat_id: str):
    if chat_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    return {
        "chat_id": chat_id,
        "messages": chat_sessions[chat_id]["messages"]
    }

@app.delete("/chat/{chat_id}")
async def delete_chat(chat_id: str):
    if chat_id not in chat_sessions:
        raise HTTPException(status_code=404, detail="Chat session not found")
    
    del chat_sessions[chat_id]
    return {"message": "Chat session deleted successfully"}

@app.get("/resources")
async def get_resources():
    return crisis_resources

# Error handling
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "An unexpected error occurred. Please try again later."}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)