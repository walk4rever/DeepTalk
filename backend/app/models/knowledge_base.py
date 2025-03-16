from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

class DocumentMetadata(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    filename: Optional[str] = None
    type: str  # pdf, docx, txt, url, etc.
    tags: List[str] = []
    source_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.now)
    updated_at: datetime = Field(default_factory=datetime.now)
    size_bytes: Optional[int] = None
    page_count: Optional[int] = None
    status: str = "processed"  # processing, processed, failed
    error: Optional[str] = None
    
class TextChunk(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    document_id: str
    content: str
    page_num: Optional[int] = None
    chunk_num: int
    embedding: Optional[List[float]] = None
    metadata: Dict[str, Any] = {}

class Document(BaseModel):
    metadata: DocumentMetadata
    chunks: List[TextChunk] = []
