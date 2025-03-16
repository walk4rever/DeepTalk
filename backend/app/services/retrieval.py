from typing import List, Dict, Any, Optional
from app.services.embedding import get_embeddings
from app.services.vector_store import vector_search

async def retrieve_relevant_chunks(
    query: str,
    knowledge_base_ids: Optional[List[str]] = None,
    top_k: int = 5,
) -> List[Dict[str, Any]]:
    """Retrieve relevant chunks for a query using semantic search"""
    
    # Generate embedding for the query
    query_embeddings = await get_embeddings([query])
    query_embedding = query_embeddings[0]
    
    # Search for similar chunks in vector store
    results = await vector_search(
        query_embedding=query_embedding,
        k=top_k,
        knowledge_base_ids=knowledge_base_ids
    )
    
    return results
