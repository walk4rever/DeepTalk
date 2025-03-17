import boto3
import json

def test_bedrock():
    try:
        # Initialize Bedrock client
        client = boto3.client('bedrock-runtime', region_name='us-east-1')
        
        # Create request body
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 100,
            "messages": [
                {"role": "user", "content": "Hello"}
            ]
        }
        
        # Call Bedrock API
        response = client.invoke_model(
            modelId="anthropic.claude-3-sonnet-20240229-v1:0",
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response.get('body').read())
        print("Response:", response_body)
        return "Success"
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return f"Error: {str(e)}"

if __name__ == "__main__":
    result = test_bedrock()
    print(result)
