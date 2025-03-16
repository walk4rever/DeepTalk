from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from app.api import knowledge_base, conversation

app = FastAPI(title="DeepTalk API", description="Knowledge-base powered conversational AI")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with your frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(knowledge_base.router, prefix="/api/kb", tags=["Knowledge Base"])
app.include_router(conversation.router, prefix="/api/conversation", tags=["Conversation"])

# Mount static file directory for uploaded files preview
os.makedirs("../data/uploads", exist_ok=True)
app.mount("/files", StaticFiles(directory="../data/uploads"), name="files")

@app.get("/")
async def root():
    return {"message": "Welcome to DeepTalk API"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
