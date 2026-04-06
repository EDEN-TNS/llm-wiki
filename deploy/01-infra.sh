#!/bin/bash
set -euo pipefail

# Load config
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/config.sh"

echo "=== Creating AWS infrastructure for Ollama + Qwen3 ==="

# 1. ECR Repository
echo "→ Creating ECR repository: $ECR_REPO_NAME"
aws ecr create-repository \
  --repository-name "$ECR_REPO_NAME" \
  --region "$AWS_REGION" \
  --image-scanning-configuration scanOnPush=true \
  --output json 2>/dev/null || echo "  (already exists)"

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"
echo "  ECR URI: $ECR_URI"

# 2. Security Group for Ollama
echo "→ Creating security group: ollama-qwen3-sg"
SG_ID=$(aws ec2 create-security-group \
  --group-name "ollama-qwen3-sg" \
  --description "Security group for Ollama Qwen3 ECS service" \
  --vpc-id "$VPC_ID" \
  --region "$AWS_REGION" \
  --query 'GroupId' \
  --output text 2>/dev/null || \
  aws ec2 describe-security-groups \
    --filters "Name=group-name,Values=ollama-qwen3-sg" \
    --region "$AWS_REGION" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)

echo "  Security Group: $SG_ID"

# Allow inbound on 11434 from the VPC CIDR (internal only)
VPC_CIDR=$(aws ec2 describe-vpcs --vpc-ids "$VPC_ID" --region "$AWS_REGION" \
  --query 'Vpcs[0].CidrBlock' --output text)
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port "$CONTAINER_PORT" \
  --cidr "$VPC_CIDR" \
  --region "$AWS_REGION" 2>/dev/null || echo "  (rule already exists)"

# Also allow from anywhere for Amplify connectivity (Amplify doesn't have fixed IPs)
aws ec2 authorize-security-group-ingress \
  --group-id "$SG_ID" \
  --protocol tcp \
  --port "$CONTAINER_PORT" \
  --cidr "0.0.0.0/0" \
  --region "$AWS_REGION" 2>/dev/null || echo "  (rule already exists)"

echo "  SG_ID=$SG_ID" > "$SCRIPT_DIR/.infra-output"

# 3. ECS Cluster
echo "→ Creating ECS cluster: $ECS_CLUSTER_NAME"
aws ecs create-cluster \
  --cluster-name "$ECS_CLUSTER_NAME" \
  --capacity-providers FARGATE \
  --default-capacity-provider-strategy capacityProvider=FARGATE,weight=1 \
  --region "$AWS_REGION" \
  --output json > /dev/null 2>&1 || echo "  (already exists)"

# 4. IAM Role for ECS Task Execution
echo "→ Creating ECS task execution role"
TRUST_POLICY='{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
    "Action": "sts:AssumeRole"
  }]
}'

aws iam create-role \
  --role-name "ecsTaskExecutionRole-llm-wiki" \
  --assume-role-policy-document "$TRUST_POLICY" \
  --region "$AWS_REGION" 2>/dev/null || echo "  (role already exists)"

aws iam attach-role-policy \
  --role-name "ecsTaskExecutionRole-llm-wiki" \
  --policy-arn "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy" 2>/dev/null || true

# 5. CloudWatch Log Group
echo "→ Creating CloudWatch log group"
aws logs create-log-group \
  --log-group-name "/ecs/ollama-qwen3" \
  --region "$AWS_REGION" 2>/dev/null || echo "  (already exists)"

echo ""
echo "=== Infrastructure ready ==="
echo "  ECR:      $ECR_URI"
echo "  SG:       $SG_ID"
echo "  Cluster:  $ECS_CLUSTER_NAME"
echo "  Next: run 02-build-push.sh"
