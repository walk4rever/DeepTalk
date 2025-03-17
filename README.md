# DeepTalk

DeepTalk is a web application that combines a knowledge base with Large Language Models (LLMs) to provide intelligent, context-aware conversations. The application allows users to upload documents and web content to build a custom knowledge base, which is then used to enhance the quality and accuracy of AI-powered chat interactions.

## Overview

DeepTalk consists of:

- **Frontend**: React-based user interface for chat interactions and knowledge base management
- **Backend**: Python-based API server that handles document processing, embedding generation, and LLM interactions
- **Vector Store**: AWS OpenSearch Service for document embeddings to enable efficient semantic search
- **AWS Bedrock Integration**: Leverages Amazon Bedrock for accessing state-of-the-art LLMs

## Installation

### Prerequisites

- Docker and Docker Compose
- AWS account with:
  - Bedrock access (for LLM capabilities)
  - Permissions to create and manage OpenSearch Service domains

### AWS OpenSearch Service Setup

1. Deploy the OpenSearch domain using the provided CloudFormation template:
   ```bash
   aws cloudformation create-stack \
     --stack-name deeptalk-opensearch \
     --template-body file://opensearch-cfn.yaml \
     --parameters ParameterKey=MasterPassword,ParameterValue=YourSecurePassword
   ```

2. After deployment completes, note the OpenSearch domain endpoint from the CloudFormation outputs:
   ```bash
   aws cloudformation describe-stacks --stack-name deeptalk-opensearch --query "Stacks[0].Outputs[?OutputKey=='DomainEndpoint'].OutputValue" --output text
   ```

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd DeepTalk
   ```

2. Configure environment variables:
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with:
   - Your AWS credentials
   - The OpenSearch domain endpoint from the CloudFormation stack
   - Other configuration options

3. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

## Features

- **Document Upload**: Support for PDF, DOCX, and TXT files
- **Web Content Import**: Extract and index content from web URLs
- **Semantic Search**: Find relevant information using natural language queries
- **Contextual Conversations**: Chat with AI that has access to your knowledge base
- **Document Management**: Organize and manage your knowledge sources

## Architecture

- **Frontend**: React with Tailwind CSS for responsive UI
- **Backend**: FastAPI (Python) for efficient API handling
- **Vector Database**: AWS OpenSearch Service for semantic search capabilities
- **LLM Provider**: Amazon Bedrock (Claude models)
- **Embedding Models**: Local Sentence Transformers or Amazon Bedrock embedding models

## Development

### Backend Development

The backend is built with FastAPI and provides endpoints for:
- Document upload and processing
- Conversation management
- Vector search using AWS OpenSearch Service

### Frontend Development

The frontend is a React application with:
- Document upload interface
- Chat interface
- Document management

## License

This project is licensed under the MIT License - see the LICENSE file for details.
