#!/bin/bash
set -euo pipefail

# Load config
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
source "$SCRIPT_DIR/config.sh"
source "$SCRIPT_DIR/.infra-output" 2>/dev/null || true

ECR_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$ECR_REPO_NAME"
EXEC_ROLE_ARN="arn:aws:iam::${AWS_ACCOUNT_ID}:role/ecsTaskExecutionRole-llm-wiki"

echo "=== Deploying Ollama + Qwen3 on ECS Fargate ==="

# 1. Register Task Definition
echo "→ Registering ECS task definition"
TASK_DEF=$(cat <<EOF
{
  "family": "$ECS_TASK_FAMILY",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "$CONTAINER_CPU",
  "memory": "$CONTAINER_MEMORY",
  "executionRoleArn": "$EXEC_ROLE_ARN",
  "ephemeralStorage": {"sizeInGiB": 30},
  "containerDefinitions": [
    {
      "name": "ollama",
      "image": "$ECR_URI:$IMAGE_TAG",
      "essential": true,
      "portMappings": [
        {
          "containerPort": $CONTAINER_PORT,
          "protocol": "tcp"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -sf http://localhost:11434/api/tags || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 300
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/ollama-qwen3",
          "awslogs-region": "$AWS_REGION",
          "awslogs-stream-prefix": "ollama"
        }
      },
      "environment": [
        {"name": "OLLAMA_MODEL", "value": "qwen3"}
      ]
    }
  ]
}
EOF
)

aws ecs register-task-definition \
  --cli-input-json "$TASK_DEF" \
  --region "$AWS_REGION" \
  --output json > /dev/null

echo "  Task definition registered: $ECS_TASK_FAMILY"

# 2. Create or update ECS Service
echo "→ Creating/updating ECS service"
SERVICE_EXISTS=$(aws ecs describe-services \
  --cluster "$ECS_CLUSTER_NAME" \
  --services "$ECS_SERVICE_NAME" \
  --region "$AWS_REGION" \
  --query 'services[?status==`ACTIVE`].serviceName' \
  --output text 2>/dev/null || echo "")

IFS=',' read -ra SUBNET_ARRAY <<< "$SUBNETS"
SUBNET_JSON=$(printf '"%s",' "${SUBNET_ARRAY[@]}")
SUBNET_JSON="[${SUBNET_JSON%,}]"

if [ -z "$SERVICE_EXISTS" ]; then
  echo "  Creating new service..."
  aws ecs create-service \
    --cluster "$ECS_CLUSTER_NAME" \
    --service-name "$ECS_SERVICE_NAME" \
    --task-definition "$ECS_TASK_FAMILY" \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=$SUBNET_JSON,securityGroups=[\"$SG_ID\"],assignPublicIp=ENABLED}" \
    --region "$AWS_REGION" \
    --output json > /dev/null
else
  echo "  Updating existing service..."
  aws ecs update-service \
    --cluster "$ECS_CLUSTER_NAME" \
    --service "$ECS_SERVICE_NAME" \
    --task-definition "$ECS_TASK_FAMILY" \
    --force-new-deployment \
    --region "$AWS_REGION" \
    --output json > /dev/null
fi

echo "  Service: $ECS_SERVICE_NAME (desired: 1)"

# 3. Wait for task to start and get its public IP
echo "→ Waiting for task to start (this may take 1-2 minutes)..."
sleep 10

for i in {1..30}; do
  TASK_ARN=$(aws ecs list-tasks \
    --cluster "$ECS_CLUSTER_NAME" \
    --service-name "$ECS_SERVICE_NAME" \
    --desired-status RUNNING \
    --region "$AWS_REGION" \
    --query 'taskArns[0]' \
    --output text 2>/dev/null || echo "None")

  if [ "$TASK_ARN" != "None" ] && [ -n "$TASK_ARN" ]; then
    # Get the ENI attached to the task
    ENI_ID=$(aws ecs describe-tasks \
      --cluster "$ECS_CLUSTER_NAME" \
      --tasks "$TASK_ARN" \
      --region "$AWS_REGION" \
      --query 'tasks[0].attachments[0].details[?name==`networkInterfaceId`].value' \
      --output text 2>/dev/null || echo "")

    if [ -n "$ENI_ID" ] && [ "$ENI_ID" != "None" ]; then
      PUBLIC_IP=$(aws ec2 describe-network-interfaces \
        --network-interface-ids "$ENI_ID" \
        --region "$AWS_REGION" \
        --query 'NetworkInterfaces[0].Association.PublicIp' \
        --output text 2>/dev/null || echo "")

      if [ -n "$PUBLIC_IP" ] && [ "$PUBLIC_IP" != "None" ]; then
        break
      fi
    fi
  fi

  echo "  Waiting... ($i/30)"
  sleep 10
done

if [ -z "$PUBLIC_IP" ] || [ "$PUBLIC_IP" = "None" ]; then
  echo "⚠ Could not get public IP yet. Check ECS console."
  echo "  Run: aws ecs list-tasks --cluster $ECS_CLUSTER_NAME --service $ECS_SERVICE_NAME --region $AWS_REGION"
  exit 1
fi

OLLAMA_URL="http://$PUBLIC_IP:$CONTAINER_PORT/v1"
echo "  Ollama endpoint: $OLLAMA_URL"

# 4. Wait for Ollama to be healthy
echo "→ Waiting for Ollama health check..."
for i in {1..20}; do
  if curl -sf "http://$PUBLIC_IP:$CONTAINER_PORT/api/tags" > /dev/null 2>&1; then
    echo "  ✓ Ollama is healthy!"
    break
  fi
  echo "  Waiting for Ollama to be ready... ($i/20)"
  sleep 15
done

# 5. Update Amplify environment variables
echo "→ Updating Amplify LLM_BASE_URL"
aws amplify update-app \
  --app-id "$AMPLIFY_APP_ID" \
  --environment-variables "{
    \"LLM_PROVIDER\": \"ollama\",
    \"LLM_MODEL\": \"qwen3\",
    \"LLM_BASE_URL\": \"$OLLAMA_URL\"
  }" \
  --region "$AWS_REGION" \
  --output json > /dev/null

echo "  Amplify updated with LLM_BASE_URL=$OLLAMA_URL"

# 6. Trigger Amplify rebuild
echo "→ Triggering Amplify rebuild..."
aws amplify start-job \
  --app-id "$AMPLIFY_APP_ID" \
  --branch-name main \
  --job-type RELEASE \
  --region "$AWS_REGION" \
  --output json > /dev/null 2>&1 || echo "  (build already running)"

# Save output
cat > "$SCRIPT_DIR/.deploy-output" <<EOL
OLLAMA_PUBLIC_IP=$PUBLIC_IP
OLLAMA_URL=$OLLAMA_URL
TASK_ARN=$TASK_ARN
EOL

echo ""
echo "=============================================="
echo "  Deployment complete!"
echo "=============================================="
echo "  Ollama API:  $OLLAMA_URL"
echo "  Model:       qwen3"
echo "  Test:        curl $OLLAMA_URL/models"
echo "  Wiki:        https://wiki.intuaos.com"
echo "=============================================="
