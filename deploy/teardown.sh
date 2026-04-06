#!/bin/bash
set -euo pipefail

# Load config
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/config.sh"

echo "=== Tearing down Ollama AWS resources ==="

# 1. Delete ECS Service
echo "→ Deleting ECS service"
aws ecs update-service \
  --cluster "$ECS_CLUSTER_NAME" \
  --service "$ECS_SERVICE_NAME" \
  --desired-count 0 \
  --region "$AWS_REGION" --output json > /dev/null 2>&1 || true

aws ecs delete-service \
  --cluster "$ECS_CLUSTER_NAME" \
  --service "$ECS_SERVICE_NAME" \
  --force \
  --region "$AWS_REGION" --output json > /dev/null 2>&1 || true

# 2. Deregister task definitions
echo "→ Deregistering task definitions"
TASK_DEFS=$(aws ecs list-task-definitions \
  --family-prefix "$ECS_TASK_FAMILY" \
  --region "$AWS_REGION" \
  --query 'taskDefinitionArns' \
  --output text 2>/dev/null || echo "")
for td in $TASK_DEFS; do
  aws ecs deregister-task-definition --task-definition "$td" --region "$AWS_REGION" --output json > /dev/null 2>&1 || true
done

# 3. Delete ECS Cluster
echo "→ Deleting ECS cluster"
aws ecs delete-cluster \
  --cluster "$ECS_CLUSTER_NAME" \
  --region "$AWS_REGION" --output json > /dev/null 2>&1 || true

# 4. Delete Security Group
echo "→ Deleting security group"
SG_ID=$(aws ec2 describe-security-groups \
  --filters "Name=group-name,Values=ollama-qwen3-sg" \
  --region "$AWS_REGION" \
  --query 'SecurityGroups[0].GroupId' \
  --output text 2>/dev/null || echo "")
if [ -n "$SG_ID" ] && [ "$SG_ID" != "None" ]; then
  aws ec2 delete-security-group --group-id "$SG_ID" --region "$AWS_REGION" 2>/dev/null || true
fi

# 5. Delete ECR images (optional, keeps repo)
echo "→ Cleaning ECR images"
aws ecr batch-delete-image \
  --repository-name "$ECR_REPO_NAME" \
  --image-ids imageTag="$IMAGE_TAG" \
  --region "$AWS_REGION" --output json > /dev/null 2>&1 || true

# 6. Delete log group
echo "→ Deleting log group"
aws logs delete-log-group \
  --log-group-name "/ecs/ollama-qwen3" \
  --region "$AWS_REGION" 2>/dev/null || true

echo "=== Teardown complete ==="
