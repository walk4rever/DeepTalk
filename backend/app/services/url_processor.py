import requests
from bs4 import BeautifulSoup
from typing import List, Optional
import uuid
from datetime import datetime

from app.models.knowledge_base import Document, DocumentMetadata, TextChunk
from app.services.document_processor import split_text, embed_chunks
from app.services.vector_store import store_document_chunks

async def extract_from_url(url: str, title: Optional[str] = None, tags: List[str] = None) -> str:
    """Extract content from a URL, process it and store in knowledge base"""
    
    # Fetch URL content
    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
    except Exception as e:
        raise Exception(f"Failed to fetch URL: {str(e)}")
    
    # Parse HTML content
    soup = BeautifulSoup(response.text, 'html.parser')
    
    # Extract title if not provided
    if not title and soup.title:
        title = soup.title.string.strip()
    elif not title:
        title = url
    
    # Extract main content
    # Remove script and style elements
    for script in soup(["script", "style", "header", "footer", "nav"]):
        script.extract()
    
    # Get text content
    text = soup.get_text(separator='\n\n')
    
    # Clean up text: remove excessive newlines and spaces
    lines = [line.strip() for line in text.split('\n')]
    text = '\n'.join(line for line in lines if line)
    
    # Create document metadata
    metadata = DocumentMetadata(
        title=title,
        type="url",
        source_url=url,
        tags=tags or [],
        created_at=datetime.now(),
    )
    
    # Split text into chunks
    chunks = split_text(text, metadata.id)
    
    # Create document
    document = Document(metadata=metadata, chunks=chunks)
    
    # Get embeddings for chunks
    document = await embed_chunks(document)
    
    # Store in vector database
    document.metadata.status = "processed"
    await store_document_chunks(document)
    
    return metadata.id
