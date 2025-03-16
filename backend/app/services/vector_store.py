from typing import List, Dict, Any
from opensearchpy import OpenSearch
import json
from app.models.knowledge_base import Document, TextChunk
from app.utils.config import get_settings

settings = get_settings()

async def get_opensearch_client():
    """Get OpenSearch client"""
    return OpenSearch(
        hosts=[{"host": settings.OPENSEARCH_HOST, "port": settings.OPENSEARCH_PORT}],
        use_ssl=settings.OPENSEARCH_USE_SSL,
        verify_certs=False,  # Not for production
        http_auth=(settings.OPENSEARCH_USERNAME, settings.OPENSEARCH_PASSWORD) if settings.OPENSEARCH_USERNAME else None,
    )

async def create_index_if_not_exists(index_name: str):
    """Create vector index if it doesn't exist"""
    client = await get_opensearch_client()
    
    if not client.indices.exists(index=index_name):
        # Create the index with appropriate mapping for vectors
        index_body = {
            "settings": {
                "index": {
                    "knn": True,
                }
            },
            "mappings": {
                "properties": {
                    "embedding": {
                        "type": "knn_vector",
                        "dimension": 384  # Adjust based on your embedding model
                    },
                    "content": {"type": "text"},
                    "document_id": {"type": "keyword"},
                    "chunk_num": {"type": "integer"},
                    "metadata": {"type": "object"},
                }
            }
        }
        
        client.indices.create(index=index_name, body=index_body)

async def store_document_chunks(document: Document):
    """Store document chunks in OpenSearch"""
    client = await get_opensearch_client()
    
    # Ensure index exists
    await create_index_if_not_exists("knowledge_chunks")
    
    # Store document metadata
    client.index(
        index="document_metadata",
        id=document.metadata.id,
        body=document.metadata.model_dump(),
    )
    
    # Store chunks
    for chunk in document.chunks:
        client.index(
            index="knowledge_chunks",
            id=chunk.id,
            body={
                "document_id": chunk.document_id,
                "content": chunk.content,
                "chunk_num": chunk.chunk_num,
                "embedding": chunk.embedding,
                "metadata": chunk.metadata
            }
        )

async def vector_search(query_embedding: List[float], k: int = 5, knowledge_base_ids: List[str] = None) -> List[Dict[str, Any]]:
    """Search for relevant chunks using vector similarity"""
    client = await get_opensearch_client()
    
    # Prepare search query
    knn_query = {
        "size": k,
        "query": {
            "knn": {
                "embedding": {
                    "vector": query_embedding,
                    "k": k
                }
            }
        }
    }
    
    # Add filter if knowledge base IDs are specified
    if knowledge_base_ids:
        knn_query["query"] = {
            "bool": {
                "must": [
                    {"terms": {"document_id": knowledge_base_ids}},
                    knn_query["query"]
                ]
            }
        }
    
    # Execute search
    response = client.search(index="knowledge_chunks", body=knn_query)
    
    # Process results
    results = []
    
    for hit in response["hits"]["hits"]:
        # Get document metadata for each hit
        try:
            doc_metadata = client.get(index="document_metadata", id=hit["_source"]["document_id"])
            source_title = doc_metadata["_source"]["title"]
            source_type = doc_metadata["_source"]["type"]
        except:
            source_title = "Unknown document"
            source_type = "unknown"
            
        results.append({
            "content": hit["_source"]["content"],
            "document_id": hit["_source"]["document_id"],
            "chunk_num": hit["_source"]["chunk_num"],
            "score": hit["_score"],
            "source": {
                "id": hit["_source"]["document_id"],
                "title": source_title,
                "type": source_type
            }
        })
    
    return results
