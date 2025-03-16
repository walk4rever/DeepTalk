# DeepTalk

DeepTalk is a web application that combines a knowledge base with Large Language Models (LLMs) to provide intelligent, context-aware conversations. The application allows users to upload documents and web content to build a custom knowledge base, which is then used to enhance the quality and accuracy of AI-powered chat interactions.

## Overview

DeepTalk consists of:

- **Frontend**: React-based user interface for chat interactions and knowledge base management
- **Backend**: Python-based API server that handles document processing, embedding generation, and LLM interactions
- **Vector Store**: Storage for document embeddings to enable efficient semantic search
- **AWS Bedrock Integration**: Leverages Amazon Bedrock for accessing state-of-the-art LLMs

## Installation

### Prerequisites

- Docker and Docker Compose
- AWS account with Bedrock access (for LLM capabilities)

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd DeepTalk
   ```

2. Configure AWS credentials:
   - Ensure your AWS credentials are properly configured with access to Bedrock services

3. Start the application using Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000

### Environment Variables

Create a `.env` file in the root directory with the following variables:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=your_aws_region
```
