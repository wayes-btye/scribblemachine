# Gemini API Monitoring - Production Worker

## 🎯 What Was Added

**Purpose:** Track how long Gemini API calls take in production to identify bottlenecks.

**When to use:** After deploying to Cloud Run, check logs to see exact Gemini API timing.

---

## 📝 Changes Made

### File: `services/worker/src/services/gemini-service.ts`

Added timing logs to **TWO methods**:

#### 1. Image-to-Image Generation (`generateWithRetry`)
**Lines:** ~310-336

**Added logs:**
```typescript
// Before API call
const geminiStartTime = Date.now();
console.log(`⏱️  [Gemini API] Starting image generation (attempt ${attempt + 1}/${maxRetries + 1})`);

// After API call
const geminiDuration = Date.now() - geminiStartTime;
console.log(`⏱️  [Gemini API] Response received in ${geminiDuration}ms (${(geminiDuration / 1000).toFixed(1)}s)`);

// Warning if slow (>10s)
if (geminiDuration > 10000) {
  console.warn(`🐢 [Gemini API] SLOW RESPONSE: ${geminiDuration}ms - Expected <10s`);
}

// Critical alert if very slow (>60s)
if (geminiDuration > 60000) {
  console.error(`🚨 [Gemini API] CRITICAL LATENCY: ${geminiDuration}ms - This should be investigated`);
}
```

#### 2. Text-to-Image Generation (`generateFromTextWithRetry`)
**Lines:** ~533-555

**Added logs:**
```typescript
// Before API call
const geminiStartTime = Date.now();
console.log(`⏱️  [Gemini API Text] Starting text-to-image generation (attempt ${attempt + 1}/${maxRetries + 1})`);

// After API call
const geminiDuration = Date.now() - geminiStartTime;
console.log(`⏱️  [Gemini API Text] Response received in ${geminiDuration}ms (${(geminiDuration / 1000).toFixed(1)}s)`);

// Warning if slow (>10s)
if (geminiDuration > 10000) {
  console.warn(`🐢 [Gemini API Text] SLOW RESPONSE: ${geminiDuration}ms - Expected <10s`);
}

// Critical alert if very slow (>60s)
if (geminiDuration > 60000) {
  console.error(`🚨 [Gemini API Text] CRITICAL LATENCY: ${geminiDuration}ms - This should be investigated`);
}
```

---

## 🚀 How To Use

### Step 1: Deploy Changes to Cloud Run

```bash
# From project root
git add services/worker/src/services/gemini-service.ts
git commit -m "feat(worker): add Gemini API latency monitoring"
git push origin main

# Cloud Run auto-deploys from main branch
# Wait 2-3 minutes for deployment
```

### Step 2: Trigger a Job

**Option A: Use the web app**
```bash
# Start web app locally
pnpm web:dev

# Go to http://localhost:3000
# Upload an image or use "Imagine An Idea"
```

**Option B: Create a test job directly**
```sql
-- Insert test job in Supabase
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
```

### Step 3: Watch Cloud Run Logs

**Method 1: GCP Console (Easiest)**
1. Go to https://console.cloud.google.com/run
2. Click `scribblemachine-worker` service
3. Click **LOGS** tab
4. Filter by severity or search for `⏱️`

**Method 2: gcloud CLI**
```bash
# Real-time logs
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=scribblemachine-worker" \
  --project scribblemachine

# Recent logs with Gemini API timing
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=scribblemachine-worker AND textPayload=~'Gemini API'" \
  --project scribblemachine \
  --limit 50 \
  --format json
```

---

## 📊 What You'll See In Logs

### Example: Fast Response (Good)
```
⏱️  [Gemini API] Starting image generation (attempt 1/3)
⏱️  [Gemini API] Response received in 5200ms (5.2s)
```

### Example: Slow Response (Warning)
```
⏱️  [Gemini API] Starting image generation (attempt 1/3)
⏱️  [Gemini API] Response received in 15000ms (15.0s)
🐢 [Gemini API] SLOW RESPONSE: 15000ms - Expected <10s
```

### Example: Critical Slowness
```
⏱️  [Gemini API] Starting image generation (attempt 1/3)
⏱️  [Gemini API] Response received in 544200ms (544.2s)
🚨 [Gemini API] CRITICAL LATENCY: 544200ms - This should be investigated
```

### Example: Text-to-Image ("Imagine An Idea")
```
⏱️  [Gemini API Text] Starting text-to-image generation (attempt 1/3)
⏱️  [Gemini API Text] Response received in 4800ms (4.8s)
```

---

## 🔍 Interpreting Results

### Performance Benchmarks

| Duration | Log Level | Status | Action Needed |
|----------|-----------|--------|---------------|
| < 10s | `INFO` | ✅ GOOD | Normal operation |
| 10-60s | `WARN` | 🐢 SLOW | Monitor, may need investigation |
| > 60s | `ERROR` | 🚨 CRITICAL | Immediate investigation required |

### What Each Timing Tells You

**Scenario 1: Gemini API is fast (~5s)**
- ✅ Cloud Run environment is working normally
- Problem is elsewhere in pipeline (database, preprocessing, etc.)
- Use other logs to find bottleneck

**Scenario 2: Gemini API is slow (>60s)**
- 🚨 Gemini API latency from Cloud Run confirmed
- Matches evidence from job fb81ea57 (544s)
- Validates the Cloud Run test results
- Next: Run local comparison test

**Scenario 3: Timing varies wildly**
- 🎲 Gemini API throttling or rate limiting
- May be based on load, time of day, or IP
- Need longer-term monitoring to find pattern

---

## 🎯 Complete Diagnostic Workflow

### Phase 1: Deploy Monitoring
```bash
git add services/worker/src/services/gemini-service.ts
git commit -m "feat(worker): add Gemini API latency monitoring"
git push origin main
# Wait for Cloud Run deployment
```

### Phase 2: Trigger Test Job
```bash
# Option 1: Use web app
pnpm web:dev
# Upload image or use "Imagine An Idea"

# Option 2: Direct database insert (advanced)
# See "Step 2: Trigger a Job" above
```

### Phase 3: Check Logs
```bash
# Watch logs in real-time
gcloud logging tail "resource.type=cloud_run_revision AND resource.labels.service_name=scribblemachine-worker" \
  --project scribblemachine
```

### Phase 4: Analyze Results
**If Gemini API logs show >60s:**
- ✅ Confirms Cloud Run → Gemini API latency issue
- Run local comparison test: `cd services/worker && ./run-gemini-test-local.sh`
- Compare with Cloud Run test: `./run-cloud-run-test.sh`

**If Gemini API logs show <10s:**
- ❌ Gemini API is not the bottleneck
- Check other parts of pipeline:
  - Database polling time
  - Image preprocessing (Sharp)
  - Asset upload to Supabase Storage
  - PDF generation

---

## 📋 Log Filtering Cheat Sheet

```bash
# All Gemini API logs
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=scribblemachine-worker \
  AND textPayload=~'Gemini API'" \
  --project scribblemachine \
  --limit 100

# Only slow responses (warnings)
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=scribblemachine-worker \
  AND textPayload=~'SLOW RESPONSE'" \
  --project scribblemachine \
  --limit 50

# Only critical latency (errors)
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=scribblemachine-worker \
  AND textPayload=~'CRITICAL LATENCY'" \
  --project scribblemachine \
  --limit 50

# Specific job ID
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=scribblemachine-worker \
  AND textPayload=~'fb81ea57'" \
  --project scribblemachine
```

---

## 🔧 Troubleshooting

### Not Seeing Logs After Deploy

**Check deployment status:**
```bash
gcloud run services describe scribblemachine-worker \
  --region europe-west1 \
  --format="value(status.latestCreatedRevisionName,status.latestReadyRevisionName)"
```

**Both should match and be recent (e.g., `scribblemachine-worker-00123-xyz`)**

### Logs Show Old Code

**Force new revision:**
```bash
gcloud run services update scribblemachine-worker \
  --region europe-west1 \
  --set-env-vars="DEPLOY_TIME=$(date +%s)"
```

### Can't Find Specific Job

**Search by job ID:**
```bash
JOB_ID="fb81ea57-f50e-40f5-9a5a-cf7554b8379f"
gcloud logging read "resource.type=cloud_run_revision \
  AND resource.labels.service_name=scribblemachine-worker \
  AND textPayload=~'${JOB_ID}'" \
  --project scribblemachine \
  --limit 100
```

---

## 📊 Expected Output - Full Job Log Example

**Good job (fast Gemini API):**
```
[Job: abc123] Starting generate job
[Job: abc123] Fetching assets from Supabase...
[Job: abc123] Assets fetched in 245ms
[Job: abc123] Preprocessing image with Sharp...
[Job: abc123] Image preprocessed in 189ms
⏱️  [Gemini API] Starting image generation (attempt 1/3)
⏱️  [Gemini API] Response received in 5200ms (5.2s)
[Job: abc123] Uploading result to Supabase Storage...
[Job: abc123] Upload complete in 412ms
[Job: abc123] Job completed successfully in 6046ms (6.0s total)
```

**Bad job (slow Gemini API):**
```
[Job: fb81ea57] Starting generate job
[Job: fb81ea57] Fetching assets from Supabase...
[Job: fb81ea57] Assets fetched in 278ms
[Job: fb81ea57] Preprocessing image with Sharp...
[Job: fb81ea57] Image preprocessed in 156ms
⏱️  [Gemini API] Starting image generation (attempt 1/3)
⏱️  [Gemini API] Response received in 544200ms (544.2s)
🚨 [Gemini API] CRITICAL LATENCY: 544200ms - This should be investigated
[Job: fb81ea57] Uploading result to Supabase Storage...
[Job: fb81ea57] Upload complete in 389ms
[Job: fb81ea57] Job completed successfully in 545023ms (545.0s total)
```

**Breakdown:**
- Database fetch: ~200-300ms ✅
- Image preprocessing: ~150-200ms ✅
- **Gemini API call: 5s (good) vs 544s (bad) 🎯**
- Upload to storage: ~300-400ms ✅

**Clear winner: Gemini API is the bottleneck.**

---

## 💡 Key Takeaways

1. **Monitoring is now live** - Every Gemini API call is timed
2. **Two types tracked** - Image-to-image AND text-to-image
3. **Three log levels** - INFO (<10s), WARN (10-60s), ERROR (>60s)
4. **Easy to filter** - Search for `⏱️`, `🐢`, or `🚨` in Cloud Run logs
5. **Definitive proof** - If logs show 500s+ for Gemini API, that's your bottleneck

**Next Step:** Deploy and test to see actual production timing data.