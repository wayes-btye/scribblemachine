#!/bin/bash
# Docker Build Script for Worker Service
# Run this from the repository root directory

echo "Starting worker service Docker build..."
echo

# Check if Docker is running
if ! docker version >/dev/null 2>&1; then
    echo "ERROR: Docker is not running or not accessible."
    echo "Please start Docker Desktop and try again."
    echo
    exit 1
fi

echo "Docker is running. Building worker image..."
echo

# Build Docker image from repository root
docker build -f services/worker/Dockerfile -t coloringpage-worker:latest .

if [ $? -eq 0 ]; then
    echo
    echo "✅ Docker image built successfully!"
    echo "Image name: coloringpage-worker:latest"
    echo
    echo "To test the container locally:"
    echo "  docker run --env-file services/worker/.env coloringpage-worker:latest"
    echo
else
    echo
    echo "❌ Docker build failed!"
    echo "Check the error messages above."
    echo
fi