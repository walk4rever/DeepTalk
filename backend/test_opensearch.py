from opensearchpy import OpenSearch, RequestsHttpConnection
import json
import socket
import boto3
from requests_aws4auth import AWS4Auth
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_opensearch():
    try:
        # Get AWS credentials
        aws_access_key = os.getenv('AWS_ACCESS_KEY_ID')
        aws_secret_key = os.getenv('AWS_SECRET_ACCESS_KEY')
        aws_region = os.getenv('AWS_REGION', 'us-west-2')
        opensearch_host = os.getenv('OPENSEARCH_HOST')
        opensearch_port = int(os.getenv('OPENSEARCH_PORT', '443'))
        
        print(f"Testing connection to AWS OpenSearch Service at {opensearch_host}:{opensearch_port}")
        
        # Create AWS auth for OpenSearch
        credentials = boto3.Session().get_credentials()
        awsauth = AWS4Auth(
            aws_access_key,
            aws_secret_key,
            aws_region,
            'es',
            session_token=credentials.token if hasattr(credentials, 'token') else None
        )
        
        # Connect to AWS OpenSearch Service
        client = OpenSearch(
            hosts=[{'host': opensearch_host, 'port': opensearch_port}],
            http_auth=awsauth,
            use_ssl=True,
            verify_certs=True,
            connection_class=RequestsHttpConnection
        )
        
        # Test connection
        info = client.info()
        print("OpenSearch Info:", json.dumps(info, indent=2))
        
        # List indices
        indices = client.indices.get_alias("*")
        print("Indices:", json.dumps(indices, indent=2))
        
        return "Success"
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return f"Error: {str(e)}"

if __name__ == "__main__":
    result = test_opensearch()
    print(result)
