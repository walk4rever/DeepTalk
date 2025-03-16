from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from typing import List
import os

# Load environment variables from .env file
load_dotenv()

class Settings(BaseSettings):
    # AWS Configuration
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_REGION: str = "us-east-1"
    
    # Bedrock Configuration
    BEDROCK_MODEL_ID: str = "anthropic.claude-3-sonnet-20240229-v1:0"
    BEDROCK_EMBEDDING_MODEL: str = "amazon.titan-embed-text-v1"
    
    # OpenSearch Configuration
    OPENSEARCH_HOST: str = "localhost"
    OPENSEARCH_PORT: int = 9200
    OPENSEARCH_USE_SSL: bool = False
    OPENSEARCH_USERNAME: str = ""
    OPENSEARCH_PASSWORD: str = ""
    
    # Embedding Configuration
    EMBEDDING_PROVIDER: str = "local"  # "bedrock" or "local"
    
    # Application Settings
    UPLOAD_DIR: str = "../data/uploads"
    MAX_UPLOAD_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_EXTENSIONS: List[str] = ["pdf", "docx", "doc", "txt"]
    
    class Config:
        env_file = ".env"

_settings = None

def get_settings():
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings
