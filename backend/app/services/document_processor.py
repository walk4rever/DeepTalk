import os
from typing import List, Dict, Any
import PyPDF2
import docx2txt
from app.models.knowledge_base import Document, DocumentMetadata, TextChunk
from app.services.embedding import get_embeddings
from app.services.vector_store import store_document_chunks
from app.utils.config import get_settings

settings = get_settings()

async def process_document(file_path: str, filename: str, tags: List[str] = None) -> str:
    """Process a document: extract text, split into chunks, embed, and store"""
    # Determine document type from extension
    _, ext = os.path.splitext(filename)
    doc_type = ext[1:].lower()  # Remove the dot
    
    # Extract text from document
    text = extract_text(file_path, doc_type)
    
    # Create document metadata
    metadata = DocumentMetadata(
        title=os.path.basename(filename),
        filename=filename,
        type=doc_type,
        tags=tags or [],
        size_bytes=os.path.getsize(file_path),
        status="processing"
    )
    
    # Split text into chunks
    chunks = split_text(text, metadata.id)
    
    # Create the document object
    document = Document(metadata=metadata, chunks=chunks)
    
    # Get embeddings for chunks
    document = await embed_chunks(document)
    
    # Store in vector database
    document.metadata.status = "processed"
    await store_document_chunks(document)
    
    return document.metadata.id

def extract_text(file_path: str, doc_type: str) -> str:
    """Extract text from different document types"""
    if doc_type == "pdf":
        return extract_from_pdf(file_path)
    elif doc_type in ["docx", "doc"]:
        return extract_from_docx(file_path)
    elif doc_type == "txt":
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    else:
        raise ValueError(f"Unsupported document type: {doc_type}")

def extract_from_pdf(file_path: str) -> str:
    """Extract text from PDF files"""
    text = ""
    with open(file_path, 'rb') as file:
        reader = PyPDF2.PdfReader(file)
        for page in reader.pages:
            text += page.extract_text() + "\n\n"
    return text

def extract_from_docx(file_path: str) -> str:
    """Extract text from DOCX files"""
    return docx2txt.process(file_path)

def split_text(text: str, doc_id: str, chunk_size: int = 1000, overlap: int = 200) -> List[TextChunk]:
    """Split text into overlapping chunks for processing"""
    chunks = []
    
    # Simple splitting by chunk_size with overlap
    start = 0
    chunk_num = 0
    
    while start < len(text):
        end = min(start + chunk_size, len(text))
        
        # Try to find a good break point (newline or space)
        if end < len(text):
            # Look for newline first
            newline_pos = text.rfind('\n', start, end)
            if newline_pos > start + chunk_size // 2:
                end = newline_pos + 1
            else:
                # Look for space
                space_pos = text.rfind(' ', start, end)
                if space_pos > start + chunk_size // 2:
                    end = space_pos + 1
        
        chunk_text = text[start:end]
        
        # Only create a chunk if it has meaningful content
        if chunk_text.strip():
            chunk = TextChunk(
                document_id=doc_id,
                content=chunk_text,
                chunk_num=chunk_num,
                metadata={"start_char": start, "end_char": end}
            )
            chunks.append(chunk)
            chunk_num += 1
        
        # Move start position, accounting for overlap
        start = end - overlap if end < len(text) else len(text)
    
    return chunks

async def embed_chunks(document: Document) -> Document:
    """Generate embeddings for document chunks"""
    # Get all chunk texts
    texts = [chunk.content for chunk in document.chunks]
    
    # Generate embeddings
    embeddings = await get_embeddings(texts)
    
    # Assign embeddings back to chunks
    for i, embedding in enumerate(embeddings):
        document.chunks[i].embedding = embedding
    
    return document
