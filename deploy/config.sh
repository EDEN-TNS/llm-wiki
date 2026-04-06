#!/bin/bash
# Ollama on AWS — Deployment Configuration
# Edit these values for your environment

export AWS_REGION="ap-northeast-2"
export AWS_ACCOUNT_ID="541974874550"
export ECR_REPO_NAME="ollama-qwen3"
export ECS_CLUSTER_NAME="llm-wiki-cluster"
export ECS_SERVICE_NAME="ollama-qwen3-service"
export ECS_TASK_FAMILY="ollama-qwen3"
export VPC_ID="vpc-050cc5e80d526129c"
export SUBNETS="subnet-075f2d9d7aeea522b,subnet-03c7df18b8079e495"  # 2a, 2b
export CONTAINER_PORT=11434
export CONTAINER_CPU=4096      # 4 vCPU
export CONTAINER_MEMORY=16384  # 16 GB (Qwen3 8B needs ~8GB)
export AMPLIFY_APP_ID="d34oqfpd4b9jxi"
export IMAGE_TAG="latest"
