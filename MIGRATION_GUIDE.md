# Migration Guide: From Local OpenSearch to AWS OpenSearch Service

This guide explains how to migrate from using a local OpenSearch Docker container to AWS OpenSearch Service in the DeepTalk application.

## 1. Create AWS OpenSearch Service Domain

### Using CloudFormation (Recommended)

1. Deploy the CloudFormation template:
   ```bash
   aws cloudformation create-stack \
     --stack-name deeptalk-opensearch \
     --template-body file://opensearch-cfn.yaml \
     --parameters ParameterKey=MasterPassword,ParameterValue=YourSecurePassword
   ```

2. Wait for the stack to complete:
   ```bash
   aws cloudformation wait stack-create-complete --stack-name deeptalk-opensearch
   ```

3. Get the domain endpoint:
   ```bash
   aws cloudformation describe-stacks --stack-name deeptalk-opensearch --query "Stacks[0].Outputs[?OutputKey=='DomainEndpoint'].OutputValue" --output text
   ```

### Using AWS Console

1. Go to the AWS OpenSearch Service console
2. Click "Create domain"
3. Choose "Production" or "Development" based on your needs
4. Enter "deeptalk" as the domain name
5. Select OpenSearch 2.9 as the version
6. Choose instance type (t3.small.search is good for development)
7. Configure network settings (VPC or public access)
8. Set up fine-grained access control with a master user
9. Review and create the domain

## 2. Update Environment Variables

Update your `.env` file with the following variables:

```
# OpenSearch Service Configuration
OPENSEARCH_SERVICE_ENABLED=true
OPENSEARCH_HOST=your-domain-endpoint.region.es.amazonaws.com
OPENSEARCH_PORT=443
```

## 3. Data Migration (If Needed)

If you have existing data in your local OpenSearch that needs to be migrated:

1. Export data from local OpenSearch:
   ```bash
   # Install elasticdump
   npm install -g elasticdump

   # Export index mappings
   elasticdump \
     --input=http://localhost:9200/knowledge_chunks \
     --output=knowledge_chunks_mapping.json \
     --type=mapping

   # Export index data
   elasticdump \
     --input=http://localhost:9200/knowledge_chunks \
     --output=knowledge_chunks_data.json \
     --type=data
   ```

2. Import data to AWS OpenSearch Service:
   ```bash
   # Import index mappings
   elasticdump \
     --input=knowledge_chunks_mapping.json \
     --output=https://your-domain-endpoint.region.es.amazonaws.com/knowledge_chunks \
     --type=mapping \
     --awsConfig="{\"accessKeyId\":\"YOUR_ACCESS_KEY\",\"secretAccessKey\":\"YOUR_SECRET_KEY\",\"region\":\"YOUR_REGION\"}"

   # Import index data
   elasticdump \
     --input=knowledge_chunks_data.json \
     --output=https://your-domain-endpoint.region.es.amazonaws.com/knowledge_chunks \
     --type=data \
     --awsConfig="{\"accessKeyId\":\"YOUR_ACCESS_KEY\",\"secretAccessKey\":\"YOUR_SECRET_KEY\",\"region\":\"YOUR_REGION\"}"
   ```

## 4. Testing the Connection

Run the test script to verify your connection to AWS OpenSearch Service:

```bash
python backend/test_opensearch.py
```

## 5. Troubleshooting

### Common Issues

1. **Connection Refused**: Ensure your security group allows inbound traffic on port 443 from your IP address.

2. **Authentication Errors**: Verify your AWS credentials have the necessary permissions to access the OpenSearch domain.

3. **SSL Certificate Errors**: Make sure you're using HTTPS and verify_certs=True for AWS OpenSearch Service.

4. **IAM Permissions**: Ensure your IAM user or role has the following permissions:
   - es:ESHttpGet
   - es:ESHttpPut
   - es:ESHttpPost
   - es:ESHttpDelete

5. **VPC Access Issues**: If your OpenSearch domain is in a VPC, ensure your application has network connectivity to that VPC.

## 6. Benefits of AWS OpenSearch Service

- **Managed Infrastructure**: AWS handles patching, updates, and maintenance
- **High Availability**: Multi-AZ deployment options
- **Scalability**: Easy to scale up or down based on needs
- **Security**: Integration with AWS IAM, KMS, and VPC
- **Monitoring**: CloudWatch integration for metrics and logs
- **Backup and Recovery**: Automated snapshots
