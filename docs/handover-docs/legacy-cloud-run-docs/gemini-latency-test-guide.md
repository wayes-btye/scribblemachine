# Gemini API Latency Test - Complete Guide

## 🎯 What Is This Test?

**Purpose:** Definitively prove whether Gemini API is slow from Cloud Run environment vs local machine.

**The Problem:** Job fb81ea57 took 544 seconds on Cloud Run, but local tests take 5 seconds. Is it Cloud Run or Gemini API?

**The Solution:** Run the EXACT SAME test both locally and on Cloud Run, compare results.

---

## 📁 Files Involved

### The Test Code (What Gets Run)
**File:** `services/worker/src/cloud-run-gemini-test.ts`

This is a **standalone HTTP server** that:
1. Listens for HTTP requests
2. When you hit `/test`, it makes ONE Gemini API call
3. Times how long it takes
4. Returns JSON with results

**Key lines from the test:**
```typescript
// Line 32: The EXACT model used in production
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

// Lines 37-41: The EXACT API call (text-to-image, no input image)
const result = await model.generateContent([
  {
    text: testPrompt  // "Create a simple black and white coloring page of a cat..."
  }
]);
```

### Docker Build Configuration
**File:** `services/worker/Dockerfile.test`

This is how the test gets packaged for Cloud Run:
- Uses Node 20
- Compiles TypeScript to JavaScript
- Creates a container with the test server

**Why this matters:** This Dockerfile is ONLY used for the test service, not production worker.

### Deployment Script
**File:** `services/worker/deploy-test-to-cloud-run.sh`

This script:
- Builds Docker image from Dockerfile.test
- Deploys to Cloud Run as `gemini-latency-test` service
- Sets environment variables (GEMINI_API_KEY)

**Note:** You already deployed this manually via GCP UI, so this script is optional.

### Environment Variables
**File:** `services/worker/.env.cloud-run-test`

Contains:
```
GEMINI_API_KEY=AIzaSyBnFcITNFm0i4hk9-u1xCbAd272fzfpJqs
```

This is used for local testing.

---

## 🔬 The Test Details

### What API Call Is Made?

**EXACT SAME as production "Imagine An Idea" feature:**

```typescript
// Model (Line 32)
model: 'gemini-2.5-flash-image-preview'

// Input (Line 29)
const testPrompt = `Create a simple black and white coloring page of a cat for children ages 6-10.
Use medium-weight black lines (2-3px width) on a pure white background.
Remove all colors, shading, and textures.
Make it suitable for printing and coloring with crayons.`;

// Call (Lines 37-41)
await model.generateContent([{ text: testPrompt }]);
```

### Is This The Same As Production?

**YES - 100% identical to production text-to-image generation.**

**Proof - Compare with production code:**
```typescript
// Production: services/worker/src/services/gemini-service.ts:527
private async generateFromTextWithRetry(prompt: string): Promise<string> {
  const model = this.genAI.getGenerativeModel({ model: this.config.model }); // Same model
  const result = await model.generateContent([{ text: prompt }]);           // Same API call
}
```

**The ONLY differences:**
- Test: Runs in standalone HTTP server
- Production: Runs in worker polling loop
- **API call is IDENTICAL**

---

## 🚀 How To Run The Test

### Option 1: Run Locally (Recommended First)

**Quick command:**
```bash
cd services/worker
./run-gemini-test-local.sh
```

**What this does:**
1. Loads GEMINI_API_KEY from `.env.cloud-run-test`
2. Starts the test server on `http://localhost:8080`
3. Calls `/test` endpoint
4. Shows results
5. Saves to `local-test-result.json`

**Manual version (if script doesn't work):**
```bash
cd services/worker

# Install TypeScript executor if needed
npm install -g tsx

# Start test server
export GEMINI_API_KEY=AIzaSyBnFcITNFm0i4hk9-u1xCbAd272fzfpJqs
tsx src/cloud-run-gemini-test.ts &

# Wait 2 seconds for server to start
sleep 2

# Run test
curl http://localhost:8080/test | jq .

# Results saved in terminal
```

**Expected local result:**
```json
{
  "success": true,
  "duration": 5200,
  "durationSeconds": "5.20",
  "imageGenerated": true,
  "slowdownFactor": "1.0",
  "environment": "local",
  "region": "unknown"
}
```

### Option 2: Run On Cloud Run (Already Deployed)

**Quick command:**
```bash
cd services/worker
./run-cloud-run-test.sh
```

**What this does:**
1. Gets your Cloud Run service URL
2. Calls the `/test` endpoint
3. Shows results
4. Saves to `cloud-run-test-result.json`

**Manual version:**
```bash
# Get service URL
SERVICE_URL=$(gcloud run services describe gemini-latency-test \
  --region europe-west1 \
  --project scribblemachine \
  --format='value(status.url)')

echo "Service URL: $SERVICE_URL"

# Run test
curl $SERVICE_URL/test | jq .
```

**Expected Cloud Run result (based on evidence):**
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

---

## 📊 Understanding Results

### Result Fields Explained

```json
{
  "success": true,              // ✅ Test completed (vs error)
  "duration": 540000,           // ⏱️  Time in milliseconds (540000ms = 540s = 9 minutes)
  "durationSeconds": "540.00",  // ⏱️  Human-readable seconds
  "imageGenerated": true,       // 🖼️  Gemini returned an image (not text)
  "slowdownFactor": "108.0",    // 🐢 How much slower than local (540s / 5s = 108x)
  "environment": "gemini-latency-test",  // 📍 Where test ran
  "region": "europe-west1"      // 🌍 Cloud Run region
}
```

### Performance Benchmarks

| Duration | Status | Meaning |
|----------|--------|---------|
| < 10s | ✅ GOOD | Normal Gemini API performance |
| 10-60s | 🐢 SLOW | Should be investigated |
| > 60s | 🚨 CRITICAL | Extremely slow, major issue |

### Comparison

**Local baseline (from previous test):**
- Simple castle: **4.2s**
- Standard dog: **4.8s**
- Detailed butterfly: **6.4s**
- **Average: ~5 seconds**

**Cloud Run (job fb81ea57):**
- Cat coloring page: **544 seconds**
- **Slowdown: 108x**

---

## 🔍 What This Proves

### Scenario 1: Local Fast (~5s), Cloud Run Slow (>60s)
**Conclusion:** Cloud Run environment IS the problem

**Possible causes:**
1. Regional routing (EU Cloud Run → US Gemini API)
2. API throttling from Cloud Run IPs
3. Network configuration issues
4. Google Cloud internal routing problems

**Next steps:**
- Try US region Cloud Run (`us-central1`)
- Contact Google Cloud support
- Check Gemini API quotas
- Investigate VPC/networking

### Scenario 2: Both Fast (~5s)
**Conclusion:** Cloud Run environment is NOT the problem

**Possible causes:**
1. Production worker has different configuration
2. Database polling causing delays
3. Image preprocessing taking time
4. Other bottlenecks in production pipeline

**Next steps:**
- Review production worker logs
- Check database query performance
- Profile the entire job processing pipeline
- Look for race conditions or locking issues

### Scenario 3: Both Slow (>60s)
**Conclusion:** Gemini API itself is slow right now

**Possible causes:**
1. `gemini-2.5-flash-image-preview` model is unstable (it's preview)
2. Google having temporary issues
3. API quota/rate limiting

**Next steps:**
- Wait and retry
- Check Google Cloud Status Dashboard
- Switch to different model (if available)

---

## 🐛 Troubleshooting

### "Service not found" Error
```bash
# Check if service is deployed
gcloud run services list --region europe-west1 | grep gemini-latency-test

# If not found, redeploy
cd services/worker
./deploy-test-to-cloud-run.sh
```

### "API key not found" Error
```bash
# Check environment variable is set in Cloud Run
gcloud run services describe gemini-latency-test \
  --region europe-west1 \
  --format="value(spec.template.spec.containers[0].env)"

# Should show: GEMINI_API_KEY=AIzaSyB...
```

### Local test won't start
```bash
# Make sure .env.cloud-run-test exists
cat services/worker/.env.cloud-run-test

# Should show: GEMINI_API_KEY=AIzaSyB...

# Install tsx if missing
npm install -g tsx
```

### gcloud logging tail not working
The command in the original guide had formatting issues. Use this instead:

```bash
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gemini-latency-test" \
  --project scribblemachine \
  --limit 50 \
  --format json
```

Or use GCP Console:
1. Go to Cloud Run → gemini-latency-test
2. Click "LOGS" tab
3. Watch in real-time

---

## 🎯 Quick Reference Commands

```bash
# ========================================
# LOCAL TEST
# ========================================
cd services/worker
./run-gemini-test-local.sh

# Manual local test
export GEMINI_API_KEY=AIzaSyBnFcITNFm0i4hk9-u1xCbAd272fzfpJqs
tsx src/cloud-run-gemini-test.ts &
sleep 2 && curl http://localhost:8080/test | jq .

# ========================================
# CLOUD RUN TEST
# ========================================
cd services/worker
./run-cloud-run-test.sh

# Manual Cloud Run test
SERVICE_URL=$(gcloud run services describe gemini-latency-test --region europe-west1 --format='value(status.url)')
curl $SERVICE_URL/test | jq .

# ========================================
# CHECK SERVICE STATUS
# ========================================
gcloud run services describe gemini-latency-test --region europe-west1

# ========================================
# VIEW LOGS (CLOUD RUN)
# ========================================
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=gemini-latency-test" \
  --project scribblemachine \
  --limit 20 \
  --format json

# ========================================
# RE-DEPLOY TEST SERVICE
# ========================================
cd services/worker
./deploy-test-to-cloud-run.sh
```

---

## 📝 Testing Your Production Worker API (Bonus)

You asked: **"Is there a way to test the production worker API endpoints directly?"**

### Understanding Production Worker Architecture

Your production worker **does NOT have HTTP endpoints**. It's a **polling-based worker**:

```typescript
// services/worker/src/simple-worker.ts
while (running) {
  const jobs = await boss.fetch<JobData>(['ingest', 'generate', 'pdf']);
  // Process jobs...
}
```

**How it works:**
1. Worker polls `pgboss.job` table in database
2. Picks up jobs with status 'created'
3. Processes them
4. Updates status to 'completed' or 'failed'

**There are NO HTTP endpoints** like `/ingest`, `/generate`, `/pdf` in production worker.

### How To Test Production Worker

**Option 1: Create a test job in database**
```sql
-- Insert a test job
INSERT INTO jobs (
  id, user_id, type, status, input_data, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'your-user-id',
  'generate',
  'created',
  '{"prompt": "A cat", "complexity": "standard"}',
  NOW(),
  NOW()
);

-- Watch it get processed by worker
SELECT id, type, status, updated_at FROM jobs ORDER BY created_at DESC LIMIT 10;
```

**Option 2: Use the web app**
1. Go to http://localhost:3000
2. Upload an image or use "Imagine An Idea"
3. Check Cloud Run logs to see processing

**Option 3: Add HTTP endpoints (if needed)**
If you want HTTP endpoints for testing, you'd need to:
1. Add Express/Fastify to worker
2. Create routes like `POST /test-generate`
3. Manually trigger job processing

**This is NOT currently implemented** - worker only polls database.

---

## 🎯 Summary - What You Need To Know

### Files To Know About

**IMPORTANT:** There is only ONE test script (`cloud-run-gemini-test.ts`) that runs in BOTH environments.

| File | What It Is | When It's Used |
|------|------------|----------------|
| `src/cloud-run-gemini-test.ts` | **THE test script** | **SAME CODE runs locally AND on Cloud Run** |
| `Dockerfile.test` | Docker packaging | Packages the SAME script for Cloud Run deployment |
| `.env.cloud-run-test` | API key for local | Used ONLY when running locally |
| `deploy-test-to-cloud-run.sh` | Deployment helper | Packages + deploys the SAME script to Cloud Run |
| `run-gemini-test-local.sh` | **Local runner wrapper** | Starts cloud-run-gemini-test.ts locally, then curls it |
| `run-cloud-run-test.sh` | **Cloud Run wrapper** | Curls the SAME script running on Cloud Run |

**Key Point:** `cloud-run-gemini-test.ts` is the ONLY test code. The `.sh` scripts are just convenience wrappers that:
- Local: Start the test server locally (`tsx cloud-run-gemini-test.ts`), then curl it
- Cloud Run: Curl the already-deployed test server on Cloud Run

**It's NOT two different scripts** - it's ONE script (`cloud-run-gemini-test.ts`) running in two places.

### Related Documentation

- **[Gemini API Monitoring Guide](./gemini-api-monitoring.md)** - Production worker timing logs added to `gemini-service.ts`
  - See this for details on the `⏱️ [Gemini API]` logs added before context compaction
  - Tracks EVERY Gemini API call in production with duration warnings
  - **Ready to deploy** - just `git push` and it'll auto-deploy to Cloud Run

### Quick Test Workflow

**Step 1: Test Locally**
```bash
cd services/worker
./run-gemini-test-local.sh
# Expect: ~5 seconds
```

**Step 2: Test Cloud Run**
```bash
cd services/worker
./run-cloud-run-test.sh
# Expect: ~540 seconds (if Cloud Run is the problem)
```

**Step 3: Compare Results**
- If local fast + Cloud Run slow = **Cloud Run environment issue**
- If both fast = **Production worker has other issues**
- If both slow = **Gemini API is slow right now**

### The Bottom Line

**One test file** (`cloud-run-gemini-test.ts`) runs in two places:
1. **Local:** `tsx src/cloud-run-gemini-test.ts` → Fast (~5s)
2. **Cloud Run:** Already deployed → Slow? (~540s)

**Same code, same API call, different environments.**

If results are different → **Environment is the problem.**

---

## 🔧 Production Monitoring (Bonus)

**Before context compaction**, timing logs were added to production worker code.

**What was added:**
- `services/worker/src/services/gemini-service.ts` now logs every Gemini API call duration
- Logs show `⏱️ [Gemini API]` with timing and warnings
- See **[gemini-api-monitoring.md](./gemini-api-monitoring.md)** for full details

**To deploy monitoring:**
```bash
git add services/worker/src/services/gemini-service.ts
git commit -m "feat(worker): add Gemini API latency monitoring"
git push origin main
# Cloud Run auto-deploys in 2-3 minutes
```

**After deploy, check logs:**
```bash
gcloud logging tail "resource.type=cloud_run_revision \
  AND resource.labels.service_name=scribblemachine-worker" \
  --project scribblemachine
```

**Look for:**
- `⏱️ [Gemini API] Response received in 544200ms` ← Shows exact duration
- `🐢 [Gemini API] SLOW RESPONSE` ← Warns if >10s
- `🚨 [Gemini API] CRITICAL LATENCY` ← Alerts if >60s

This confirms the bottleneck in production jobs, not just standalone tests.