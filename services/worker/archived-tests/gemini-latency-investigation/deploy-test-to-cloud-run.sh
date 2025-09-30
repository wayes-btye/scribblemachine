#!/bin/bash

# Deploy Gemini API Latency Test to Cloud Run
# This script deploys a standalone test service to Cloud Run to measure
# actual Gemini API latency from the production environment

set -e

PROJECT_ID="scribblemachine"
SERVICE_NAME="gemini-latency-test"
REGION="europe-west1"

echo "🚀 Deploying Gemini API Latency Test to Cloud Run..."
echo "   Project: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"
echo ""

# Build and deploy
gcloud run deploy $SERVICE_NAME \
  --source . \
  --dockerfile Dockerfile.test \
  --region $REGION \
  --project $PROJECT_ID \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=${GEMINI_API_KEY}" \
  --memory 512Mi \
  --cpu 1 \
  --timeout 300 \
  --min-instances 0 \
  --max-instances 1

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 To run the test:"
echo "   SERVICE_URL=\$(gcloud run services describe $SERVICE_NAME --region $REGION --format='value(status.url)')"
echo "   curl \${SERVICE_URL}/test"
echo ""
echo "Or run:"
echo "   ./run-cloud-run-test.sh"