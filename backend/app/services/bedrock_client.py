import boto3
import json
from typing import Dict, Any, List, Generator, Optional

class BedrockClient:
    def __init__(self, model_params: Dict[str, Any]):
        """Initialize Bedrock client with model parameters"""
        # Default model parameters
        self.default_params = {
            "modelId": "anthropic.claude-3-sonnet-20240229-v1:0",
            "temperature": 0.7,
            "maxTokens": 4000,
            "topP": 0.9,
        }
        
        # Update with provided parameters
        self.params = {**self.default_params, **model_params}
        
        # Initialize Bedrock runtime client
        self.bedrock_runtime = boto3.client('bedrock-runtime')
        
    async def generate_response(
        self,
        query: str,
        contexts: List[Dict[str, Any]],
        conversation_id: Optional[str] = None,
    ) -> str:
        """Generate response using AWS Bedrock"""
        
        # Prepare context from retrieved chunks
        context_text = "\n\n".join([f"Context from {ctx['source']['title']}:\n{ctx['content']}" for ctx in contexts]) if contexts else ""
        
        # Construct the prompt with context
        system_message = (
            "You are a helpful AI assistant that provides accurate information based on the provided context. "
            "If the context doesn't contain the answer, say you don't know. "
            "Respond in a professional, helpful tone. When citing information, reference the source document."
        )
        
        # Construct the request based on the model ID
        model_id = self.params.get("modelId")
        
        if model_id.startswith("anthropic.claude"):
            request_body = self._create_claude_request(system_message, context_text, query)
        elif model_id.startswith("amazon.titan"):
            request_body = self._create_titan_request(system_message, context_text, query)
        else:
            raise ValueError(f"Unsupported model: {model_id}")
        
        try:
            # Call Bedrock API
            response = self.bedrock_runtime.invoke_model(
                modelId=model_id,
                body=json.dumps(request_body)
            )
            
            # Parse response
            response_body = json.loads(response.get('body').read())
            
            if model_id.startswith("anthropic.claude"):
                return response_body['content'][0]['text']
            elif model_id.startswith("amazon.titan"):
                return response_body['results'][0]['outputText']
            
        except Exception as e:
            # Log error and return fallback message
            print(f"Error calling Bedrock API: {str(e)}")
            return "I'm sorry, I encountered an error processing your request. Please try again."
    
    def _create_claude_request(self, system_message: str, context_text: str, query: str) -> Dict[str, Any]:
        """Create request body for Claude models"""
        user_message = f"""Please answer the following question based on the provided context.

{context_text if context_text else 'No context provided.'}

Question: {query}"""
        
        return {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": self.params.get("maxTokens"),
            "temperature": self.params.get("temperature"),
            "top_p": self.params.get("topP"),
            "system": system_message,
            "messages": [
                {"role": "user", "content": user_message}
            ]
        }
    
    def _create_titan_request(self, system_message: str, context_text: str, query: str) -> Dict[str, Any]:
        """Create request body for Amazon Titan models"""
        prompt = f"{system_message}\n\nContext:\n{context_text if context_text else 'No context provided.'}\n\nQuestion: {query}\n\nAnswer:"
        
        return {
            "inputText": prompt,
            "textGenerationConfig": {
                "maxTokenCount": self.params.get("maxTokens"),
                "temperature": self.params.get("temperature"),
                "topP": self.params.get("topP")
            }
        }
    
    async def generate_response_stream(
        self,
        query: str,
        contexts: List[Dict[str, Any]],
        conversation_id: Optional[str] = None,
    ) -> Generator[str, None, None]:
        """Stream response from AWS Bedrock"""
        
        # Prepare context from retrieved chunks
        context_text = "\n\n".join([f"Context from {ctx['source']['title']}:\n{ctx['content']}" for ctx in contexts]) if contexts else ""
        
        # Construct the prompt with context
        system_message = (
            "You are a helpful AI assistant that provides accurate information based on the provided context. "
            "If the context doesn't contain the answer, say you don't know. "
            "Respond in a professional, helpful tone. When citing information, reference the source document."
        )
        
        # Construct the request based on the model ID
        model_id = self.params.get("modelId")
        
        if model_id.startswith("anthropic.claude"):
            request_body = self._create_claude_request(system_message, context_text, query)
            # Add streaming parameter
            request_body["stream"] = True
        else:
            # For models that don't support streaming, fall back to non-streaming
            response = await self.generate_response(query, contexts, conversation_id)
            yield response
            return
        
        try:
            # Call Bedrock API with streaming
            response = self.bedrock_runtime.invoke_model_with_response_stream(
                modelId=model_id,
                body=json.dumps(request_body)
            )
            
            # Process the streaming response
            for event in response.get('body'):
                # Check if we have a proper chunk with content
                if 'chunk' in event:
                    chunk_data = json.loads(event['chunk']['bytes'])
                    if 'content' in chunk_data and len(chunk_data['content']) > 0:
                        content_type = chunk_data['content'][0]['type']
                        if content_type == 'text':
                            # Yield the text content
                            yield chunk_data['content'][0]['text']
                
        except Exception as e:
            # Log error and yield fallback message
            print(f"Error calling Bedrock streaming API: {str(e)}")
            yield "I'm sorry, I encountered an error processing your request. Please try again."
