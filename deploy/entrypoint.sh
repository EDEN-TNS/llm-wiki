#!/bin/bash
set -e

MODEL="${OLLAMA_MODEL:-qwen3}"

echo "=== Ollama + $MODEL container starting ==="

# Start Ollama server in background
export OLLAMA_HOST=0.0.0.0
ollama serve &
SERVE_PID=$!

# Wait for Ollama to be ready
echo "Waiting for Ollama server..."
for i in $(seq 1 30); do
  if curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "Ollama server is ready."
    break
  fi
  sleep 2
done

# Pull model if not already present
if ! ollama list | grep -q "$MODEL"; then
  echo "Pulling model: $MODEL (this may take several minutes on first run)..."
  ollama pull "$MODEL"
  echo "Model $MODEL pulled successfully."
else
  echo "Model $MODEL already available."
fi

echo "=== Ollama ready. Serving $MODEL on port 11434 ==="

# Keep the server running
wait $SERVE_PID
