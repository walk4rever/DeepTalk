from typing import List
import boto3
import json
from sentence_transformers import SentenceTransformer
import numpy as np
from app.utils.config import get_settings

settings = get_settings()

# Initialize local embedding model
local_model = None

async def get_embeddings(texts: List[str]) -> List[List[float]]:
    """Generate embeddings for a list of text chunks"""
    if settings.EMBEDDING_PROVIDER == "bedrock":
        return await get_bedrock_embeddings(texts)
    else:
        return await get_local_embeddings(texts)

async def get_bedrock_embeddings(texts: List[str]) -> List[List[float]]:
    """Get embeddings using AWS Bedrock"""
    # Initialize Bedrock client
    bedrock_runtime = boto3.client(
        service_name="bedrock-runtime",
        region_name=settings.AWS_REGION,
    )
    
    embeddings = []
    
    # Process in batches to avoid hitting API limits
    batch_size = 10
    for i in range(0, len(texts), batch_size):
        batch = texts[i:i + batch_size]
        batch_embeddings = []
        
        for text in batch:
            # Call Bedrock embedding model
            response = bedrock_runtime.invoke_model(
                modelId=settings.BEDROCK_EMBEDDING_MODEL,
                body=json.dumps({
                    "inputText": text,
                })
            )
            
            response_body = json.loads(response.get('body').read())
            embedding = response_body.get('embedding')
            batch_embeddings.append(embedding)
            
        embeddings.extend(batch_embeddings)
    
    return embeddings

async def get_local_embeddings(texts: List[str]) -> List[List[float]]:
    """Get embeddings using local model"""
    global local_model
    
    if local_model is None:
        # Load the model on first use
        local_model = SentenceTransformer('all-MiniLM-L6-v2')
    
    # Generate embeddings
    embeddings = local_model.encode(texts)
    
    # Convert numpy arrays to lists for JSON serialization
    return [embedding.tolist() for embedding in embeddings]
