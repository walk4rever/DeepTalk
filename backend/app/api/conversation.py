from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks, WebSocket, WebSocketDisconnect
from typing import List, Optional, Dict, Any
from pydantic import BaseModel
import uuid
import json

from app.services.bedrock_client import BedrockClient
from app.services.retrieval import retrieve_relevant_chunks
from app.models.conversation import Message, Conversation

router = APIRouter()

class QueryRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    knowledge_base_ids: Optional[List[str]] = None
    model_params: Optional[Dict[str, Any]] = None

class ConversationRequest(BaseModel):
    title: Optional[str] = None
    knowledge_base_ids: Optional[List[str]] = None

@router.post("/query")
async def query(
    request: QueryRequest,
    background_tasks: BackgroundTasks,
):
    """Process a query using RAG approach"""
    # Generate a new conversation ID if not provided
    conversation_id = request.conversation_id or str(uuid.uuid4())
    
    try:
        # Retrieve relevant context from knowledge base(s)
        contexts = await retrieve_relevant_chunks(
            query=request.query,
            knowledge_base_ids=request.knowledge_base_ids,
        )
        
        # Initialize Bedrock client with model parameters
        client = BedrockClient(request.model_params or {})
        
        # Generate response using the context and query
        response = await client.generate_response(
            query=request.query,
            contexts=contexts,
            conversation_id=conversation_id,
        )
        
        # Store messages in the background
        background_tasks.add_task(
            store_messages,
            conversation_id,
            request.query,
            response,
            contexts,
        )
        
        return {
            "conversation_id": conversation_id,
            "response": response,
            "sources": [ctx["source"] for ctx in contexts] if contexts else [],
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/conversations")
async def create_conversation(request: ConversationRequest):
    """Create a new conversation"""
    conversation_id = str(uuid.uuid4())
    # Store in database (implementation omitted)
    return {"id": conversation_id, "title": request.title or "New Conversation"}

@router.get("/conversations")
async def list_conversations(skip: int = 0, limit: int = 20):
    """List user's conversations"""
    # This would query the database for the user's conversations
    return {
        "items": [
            {"id": "1", "title": "Sample Conversation", "last_message": "Hello, how can I help?", "updated_at": "2023-01-01T00:00:00Z"},
        ],
        "total": 1
    }

@router.get("/conversations/{conversation_id}")
async def get_conversation(conversation_id: str):
    """Get conversation by ID including messages"""
    # Query conversation from database
    return {
        "id": conversation_id,
        "title": "Sample Conversation",
        "messages": [
            {"role": "user", "content": "Hello", "timestamp": "2023-01-01T00:00:00Z"},
            {"role": "assistant", "content": "Hello, how can I help?", "timestamp": "2023-01-01T00:00:01Z"},
        ],
    }

@router.delete("/conversations/{conversation_id}")
async def delete_conversation(conversation_id: str):
    """Delete a conversation"""
    # Delete implementation
    return {"success": True, "message": f"Conversation {conversation_id} deleted"}

async def store_messages(conversation_id: str, query: str, response: str, contexts: List[dict]):
    """Background task to store messages in the database"""
    # Store user message, system response, and context references in the database
    # Implementation would depend on your database choice
    pass

# WebSocket endpoint for real-time conversation
@router.websocket("/ws/{conversation_id}")
async def websocket_endpoint(websocket: WebSocket, conversation_id: str):
    await websocket.accept()
    try:
        # Set up Bedrock client
        client = BedrockClient({})
        
        while True:
            # Receive message from client
            data = await websocket.receive_text()
            request_data = json.loads(data)
            
            # Process the query with RAG
            contexts = await retrieve_relevant_chunks(
                query=request_data["query"],
                knowledge_base_ids=request_data.get("knowledge_base_ids"),
            )
            
            # Stream responses if supported
            for chunk in await client.generate_response_stream(
                query=request_data["query"],
                contexts=contexts,
                conversation_id=conversation_id,
            ):
                await websocket.send_text(json.dumps({"chunk": chunk}))
            
            # Send completion message
            await websocket.send_text(json.dumps({"complete": True}))
            
    except WebSocketDisconnect:
        # Handle disconnect
        pass
