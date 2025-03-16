from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import List, Optional
import os
import shutil
from pydantic import BaseModel
import uuid
from app.services.document_processor import process_document
from app.services.url_processor import extract_from_url
from app.models.knowledge_base import Document, DocumentMetadata
from app.utils.config import get_settings

router = APIRouter()
settings = get_settings()

class UrlRequest(BaseModel):
    url: str
    title: Optional[str] = None
    tags: Optional[List[str]] = None

@router.post("/upload")
async def upload_documents(
    files: List[UploadFile] = File(...),
    tags: Optional[str] = Form(None),
):
    """Upload documents to the knowledge base"""
    results = []
    tags_list = tags.split(",") if tags else []
    
    for file in files:
        # Validate file extension
        ext = os.path.splitext(file.filename)[1][1:].lower()
        if ext not in settings.ALLOWED_EXTENSIONS:
            results.append({"filename": file.filename, "success": False, "error": "File type not allowed"})
            continue
            
        # Generate unique filename
        unique_filename = f"{uuid.uuid4().hex}_{file.filename}"
        file_path = os.path.join(settings.UPLOAD_DIR, unique_filename)
        
        # Save file
        try:
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
        except Exception as e:
            results.append({"filename": file.filename, "success": False, "error": str(e)})
            continue
        
        # Process document
        try:
            doc_id = await process_document(file_path, file.filename, tags_list)
            results.append({"filename": file.filename, "success": True, "id": doc_id})
        except Exception as e:
            # Clean up the file if processing failed
            os.remove(file_path)
            results.append({"filename": file.filename, "success": False, "error": str(e)})
    
    return results

@router.post("/url")
async def add_url(request: UrlRequest):
    """Add content from URL to the knowledge base"""
    try:
        doc_id = await extract_from_url(request.url, request.title, request.tags or [])
        return {"success": True, "id": doc_id, "url": request.url}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/documents")
async def list_documents(
    search: Optional[str] = None,
    tags: Optional[List[str]] = Query(None),
    skip: int = 0,
    limit: int = 100,
):
    """List documents in the knowledge base with optional filtering"""
    # This would be implemented to query the document metadata from the database
    # For now, just return a mock response
    return {
        "items": [
            {"id": "1", "title": "Sample Document", "type": "pdf", "tags": ["sample"], "created_at": "2023-01-01T00:00:00Z"},
        ],
        "total": 1
    }

@router.get("/documents/{doc_id}")
async def get_document(doc_id: str):
    """Get document metadata by ID"""
    # This would query the document from the database
    return {"id": doc_id, "title": "Sample Document", "type": "pdf", "tags": ["sample"], "created_at": "2023-01-01T00:00:00Z"}

@router.delete("/documents/{doc_id}")
async def delete_document(doc_id: str):
    """Delete document from knowledge base"""
    # Delete document implementation
    return {"success": True, "message": f"Document {doc_id} deleted"}

@router.post("/documents/{doc_id}/tags")
async def update_document_tags(doc_id: str, tags: List[str]):
    """Update document tags"""
    # Update tags implementation
    return {"success": True, "id": doc_id, "tags": tags}
