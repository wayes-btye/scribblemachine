# Gemini API Latency Test - User Guide

**Purpose:** Definitively prove whether Gemini API is slow from Cloud Run environment vs local machine.

---

## 🎯 What This Test Does

This is a **standalone HTTP service** deployed to Cloud Run that:

1. **Receives an HTTP request** (when you curl it)
2. **Makes a single Gemini API call** (text-to-image generation)
3. **Times how long it takes**
4. **Returns the results** as JSON

### The Exact API Call Being Made

The test generates a simple coloring page using this prompt:

```
"Create a simple black and white coloring page of a cat for children ages 6-10.
Use medium-weight black lines (2-3px width) on a pure white background.
Remove all colors, shading, and textures.
Make it suitable for printing and coloring with crayons."
```

**Model:** `gemini-2.5-flash-image-preview` (same as production)
**Type:** Text-to-image generation (no input image)

This is **identical** to what your production worker does for "Imagine An Idea" feature.

---

## 🚀 How to Run the Test

### Step 1: Get the Service URL

```bash
gcloud run services describe gemini-latency-test \
  --region europe-west1 \
  --project scribblemachine \
  --format='value(status.url)'
```

This will output something like:
```
https://gemini-latency-test-xxxxx-ew.a.run.app
```

### Step 2: Run the Test

#### Simple Test (just see results):
```bash
curl https://gemini-latency-test-xxxxx-ew.a.run.app/test
```

#### Pretty Output (recommended):
```bash
curl https://gemini-latency-test-xxxxx-ew.a.run.app/test | jq .
```

#### Save Results to File:
```bash
curl https://gemini-latency-test-xxxxx-ew.a.run.app/test > cloud-run-test-result.json
cat cloud-run-test-result.json | jq .
```

---

## 📊 Understanding the Results

### Example Output (SLOW):

```json
{
  "success": true,
  "duration": 540000,
  "durationSeconds": "540.00",
  "imageGenerated": true,
  "slowdownFactor": "108.0",
  "environment": "gemini-latency-test",
  "region": "europe-west1"
}
```

**Translation:**
- ✅ Test succeeded
- ⏱️  Took **540 seconds** (9 minutes) - **SLOW!**
- 🖼️  Image was successfully generated
- 🐢 **108x slower** than local (which takes ~5s)
- 📍 Running from Cloud Run in `europe-west1`

### Example Output (GOOD):

```json
{
  "success": true,
  "duration": 5200,
  "durationSeconds": "5.20",
  "imageGenerated": true,
  "slowdownFactor": "1.0",
  "environment": "gemini-latency-test",
  "region": "europe-west1"
}
```

**Translation:**
- ✅ Test succeeded
- ⏱️  Took **5.2 seconds** - **GOOD!**
- 🖼️  Image was successfully generated
- ✅ **Normal speed** (comparable to local)
- 📍 Running from Cloud Run in `europe-west1`

---

## 🔬 What We're Testing

### Local Machine Performance (Baseline)
When you ran `pnpm test:text-to-image` locally, you got:
- Simple castle: **4.2s**
- Standard dog: **4.8s**
- Detailed butterfly: **6.4s**
- **Average: ~5 seconds**

### Cloud Run Performance (What We're Measuring)
The Cloud Run test makes the **exact same API call** but from the production environment.

### The Question We're Answering:
**Is Gemini API slow from Cloud Run specifically, or is it something else?**

If Cloud Run test shows:
- **~5 seconds**: Problem is NOT Cloud Run environment (look elsewhere)
- **>60 seconds**: Problem IS Cloud Run environment (investigate networking/quotas/throttling)

---

## 🎬 Complete Example Run

```bash
# 1. Get service URL
SERVICE_URL=$(gcloud run services describe gemini-latency-test \
  --region europe-west1 \
  --project scribblemachine \
  --format='value(status.url)')

echo "Service URL: $SERVICE_URL"

# 2. Health check (optional - just confirms service is running)
curl $SERVICE_URL/health

# Output:
# {
#   "status": "healthy",
#   "service": "gemini-api-latency-test",
#   "timestamp": "2025-09-30T08:00:00.000Z"
# }

# 3. Run the actual test
echo "Running Gemini API latency test from Cloud Run..."
curl $SERVICE_URL/test | jq .

# Wait ~5-600 seconds (depending on how slow it is)
# Results appear when complete
```

---

## 📝 What You'll See in Cloud Run Logs

While the test runs, you can watch Cloud Run logs:

```bash
gcloud logging tail "resource.type=cloud_run_revision \
  AND resource.labels.service_name=gemini-latency-test" \
  --project scribblemachine
```

You'll see:
```
📥 Request received: GET /test
🚀 Starting Gemini API latency test...
📍 Running from: gemini-latency-test
🌍 Region: europe-west1
⏱️  [START] Gemini API call starting...
⏱️  [END] Gemini API call completed in 540000ms (540.00s)
✅ Image generated successfully (246.0 KB)
📊 Performance Analysis:
   Duration: 540000ms (540.00s)
   Image generated: Yes
   Status: 🐢 SLOW - Should be investigated (>10s)
   Slowdown vs local: 108.0x
```

---

## 🔍 Interpreting Results

### Scenario 1: Test is Fast (~5-10s)
**Conclusion:** Cloud Run environment is **NOT** the problem
**Next steps:**
- Check if your production worker has different configuration
- Verify production worker is using same Gemini model
- Check production worker logs for other bottlenecks

### Scenario 2: Test is Slow (>60s)
**Conclusion:** Cloud Run environment **IS** causing Gemini API slowness
**Possible causes:**
1. **Regional routing** - EU Cloud Run → US Gemini endpoints
2. **API throttling** - Google limiting Cloud Run requests
3. **Quota issues** - Project hitting limits
4. **Network configuration** - VPC/firewall issues

**Next steps:**
- Try deploying to US region (`us-central1`)
- Check Gemini API quotas in Google Cloud Console
- Contact Google Cloud support about Gemini API performance

### Scenario 3: Test Fails
**Error output example:**
```json
{
  "success": false,
  "error": "API key not found",
  "environment": "gemini-latency-test"
}
```

**Solution:** Check Cloud Run environment variables:
```bash
gcloud run services describe gemini-latency-test \
  --region europe-west1 \
  --format="value(spec.template.spec.containers[0].env)"
```

---

## 🎯 Quick Commands Reference

```bash
# Get service URL
gcloud run services describe gemini-latency-test --region europe-west1 --format='value(status.url)'

# Health check
curl $(gcloud run services describe gemini-latency-test --region europe-west1 --format='value(status.url)')/health

# Run test
curl $(gcloud run services describe gemini-latency-test --region europe-west1 --format='value(status.url)')/test | jq .

# Watch logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=gemini-latency-test" --project scribblemachine

# Re-run test multiple times (for average)
for i in {1..3}; do
  echo "Test run $i:"
  curl $(gcloud run services describe gemini-latency-test --region europe-west1 --format='value(status.url)')/test | jq .duration
  echo ""
done
```

---

## 💡 Why This Test is Definitive

1. **Same API** - Uses `@google/generative-ai` library (same as production)
2. **Same Model** - `gemini-2.5-flash-image-preview`
3. **Same Region** - Deployed to `europe-west1` (same as your worker)
4. **Same Prompt Type** - Text-to-image generation (no input image)
5. **Same Environment** - Running in Cloud Run (production environment)

**The ONLY difference is:**
- Local test: Runs from your machine
- Cloud Run test: Runs from Google Cloud infrastructure

If there's a performance difference, it's **definitely** the Cloud Run environment causing it.

---

## 🚨 Expected Outcome Based on Evidence

Based on job `fb81ea57` (544s processing time), we expect:

**Most Likely Result:**
- Duration: **500-600 seconds**
- Status: 🐢 SLOW
- Slowdown: **100-120x**

This would **confirm** that Gemini API is throttling or having network issues from Cloud Run specifically.

**Ideal Result (if Google fixed it):**
- Duration: **5-10 seconds**
- Status: ✅ GOOD
- Slowdown: **1-2x**

This would mean the problem was temporary and is now resolved.