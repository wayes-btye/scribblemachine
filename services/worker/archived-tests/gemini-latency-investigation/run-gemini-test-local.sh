#!/bin/bash

# Run the Gemini latency test LOCALLY
# This runs the EXACT SAME test that's deployed to Cloud Run

set -e

echo "🧪 Running Gemini API Latency Test LOCALLY..."
echo ""
echo "📍 This is the SAME test deployed to Cloud Run"
echo "   File: services/worker/src/cloud-run-gemini-test.ts"
echo ""

# Check if .env.cloud-run-test exists
if [ ! -f ".env.cloud-run-test" ]; then
  echo "❌ .env.cloud-run-test not found"
  echo "   Create it with: GEMINI_API_KEY=your_key"
  exit 1
fi

# Load environment variables
export $(cat .env.cloud-run-test | xargs)

# Check if TypeScript is available
if ! command -v tsx &> /dev/null; then
  echo "📦 Installing tsx (TypeScript executor)..."
  npm install -g tsx
fi

echo "⏱️  Starting local test..."
echo ""

# Run the test server in background
tsx src/cloud-run-gemini-test.ts &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Run the test
echo "📡 Calling /test endpoint..."
curl -s http://localhost:8080/test | tee local-test-result.json

echo ""
echo ""
echo "✅ Local test complete"
echo "📊 Results saved to: local-test-result.json"
echo ""

# Kill the server
kill $SERVER_PID 2>/dev/null || true

echo "💡 Compare with Cloud Run test:"
echo "   Cloud Run: curl \$(gcloud run services describe gemini-latency-test --region europe-west1 --format='value(status.url)')/test"