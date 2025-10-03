#!/bin/bash

# Deploy Worker to Cloud Run
# This script updates Cloud Run to use the latest built image

set -e

echo "🚀 Deploying worker to Cloud Run..."

# Get the latest commit SHA
COMMIT_SHA=$(git rev-parse HEAD)
echo "📝 Using commit: $COMMIT_SHA"

# Construct the image name
IMAGE_NAME="gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:$COMMIT_SHA"
echo "🐳 Image: $IMAGE_NAME"

# Check if image exists
echo "🔍 Checking if image exists..."
if ! gcloud container images describe "$IMAGE_NAME" >/dev/null 2>&1; then
    echo "❌ Image $IMAGE_NAME not found!"
    echo "💡 Make sure you've pushed to GitHub and Cloud Build has completed."
    echo "🔗 Check build status: https://console.cloud.google.com/cloud-build/builds"
    exit 1
fi

echo "✅ Image found, deploying to Cloud Run..."

# Deploy to Cloud Run
gcloud run services update scribblemachine-worker \
    --region=europe-west1 \
    --image="$IMAGE_NAME" \
    --platform=managed

echo "🎉 Deployment complete!"
echo "🌐 Service URL: https://scribblemachine-worker-1001132689979.europe-west1.run.app"
echo "💚 Health check: curl https://scribblemachine-worker-1001132689979.europe-west1.run.app/health"
