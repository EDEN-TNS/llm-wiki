#!/bin/bash
set -euo pipefail

# Load config
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/config.sh"

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=== Building and pushing Ollama + Qwen3 image ==="

# 1. Login to ECR
echo "→ Logging in to ECR"
aws ecr get-login-password --region "$AWS_REGION" | \
  docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# 2. Build image (this will take a while — downloads Qwen3 5.2GB during build)
echo "→ Building Docker image (this downloads Qwen3 ~5.2GB, be patient...)"
docker build \
  -f "$PROJECT_ROOT/deploy/Dockerfile.ollama" \
  -t "$ECR_REPO_NAME:$IMAGE_TAG" \
  --platform linux/amd64 \
  "$PROJECT_ROOT"

# 3. Tag for ECR
echo "→ Tagging image"
docker tag "$ECR_REPO_NAME:$IMAGE_TAG" "$ECR_URI:$IMAGE_TAG"

# 4. Push to ECR
echo "→ Pushing to ECR (large image, may take several minutes...)"
docker push "$ECR_URI:$IMAGE_TAG"

echo ""
echo "=== Image pushed successfully ==="
echo "  Image: $ECR_URI:$IMAGE_TAG"
echo "  Next: run 03-deploy.sh"
