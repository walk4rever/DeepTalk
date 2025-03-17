from opensearchpy import OpenSearch
import json
import socket

def test_opensearch():
    try:
        # First check if opensearch is reachable
        print(f"Trying to resolve opensearch hostname...")
        try:
            print(f"IP address: {socket.gethostbyname('opensearch')}")
        except socket.gaierror as e:
            print(f"Could not resolve opensearch: {e}")
        
        # Connect to OpenSearch
        print("Connecting to OpenSearch...")
        client = OpenSearch(
            hosts=[{"host": "opensearch", "port": 9200}],
            use_ssl=False,
            verify_certs=False,
            http_auth=None,
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
