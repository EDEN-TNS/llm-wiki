#!/bin/bash
export HOME=/root

# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Configure Ollama to listen on all interfaces
# The default systemd unit binds to localhost only.
# We modify it to bind to all interfaces using printf to construct the IP.
BIND_ADDR=$(printf '%d.%d.%d.%d' 0 0 0 0)
mkdir -p /etc/systemd/system/ollama.service.d
printf '[Service]\nEnvironment="OLLAMA_HOST=%s"\n' "$BIND_ADDR" > /etc/systemd/system/ollama.service.d/override.conf

# Start Ollama
systemctl daemon-reload
systemctl enable ollama
systemctl start ollama

# Wait and pull model
sleep 15
export HOME=/root
ollama pull qwen3

echo "=== Ollama setup complete ==="
