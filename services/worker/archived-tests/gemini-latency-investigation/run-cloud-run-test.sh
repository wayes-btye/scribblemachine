#!/bin/bash

# Run the Gemini API latency test on Cloud Run

SERVICE_NAME="gemini-latency-test"
REGION="europe-west1"
PROJECT_ID="scribblemachine"

echo "🧪 Running Gemini API Latency Test from Cloud Run..."
echo ""

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region $REGION --project $PROJECT_ID --format='value(status.url)' 2>/dev/null)

if [ -z "$SERVICE_URL" ]; then
  echo "❌ Service not found. Deploy it first with:"
  echo "   ./deploy-test-to-cloud-run.sh"
  exit 1
fi

echo "📍 Service URL: $SERVICE_URL"
echo "⏱️  Starting test..."
echo ""

# Run the test and capture output
curl -s "${SERVICE_URL}/test" | tee cloud-run-test-result.json | jq .

echo ""
echo "📊 Test complete. Full results saved to: cloud-run-test-result.json"