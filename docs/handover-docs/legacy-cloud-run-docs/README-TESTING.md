# Testing & Monitoring - Quick Start

This document explains all the testing and monitoring setup for investigating Gemini API latency.

---

## 📚 Documentation Index

| Document | Purpose | When To Use |
|----------|---------|-------------|
| **[gemini-latency-test-guide.md](./gemini-latency-test-guide.md)** | Complete test guide | Run isolated Gemini API tests locally vs Cloud Run |
| **[gemini-test-results-2025-09-30.md](./gemini-test-results-2025-09-30.md)** | 🔥 **ACTUAL TEST RESULTS** | See the findings: Cloud Run is NOT slow! |
| **[typescript-execution-explained.md](./typescript-execution-explained.md)** | Why tsx? Node versions? | Understand TypeScript execution (local vs Cloud Run) |
| **[gemini-api-monitoring.md](./gemini-api-monitoring.md)** | Production monitoring guide | Deploy timing logs to track production job performance |
| **[CLOUD-RUN-performance-investigation-report.md](./CLOUD-RUN-performance-investigation-report.md)** | Full investigation report | Understand the problem history and evidence |

---

## 🎯 Quick Start - What To Do Now

### Option 1: Deploy Production Monitoring (Recommended)

**What:** Add timing logs to production worker to see Gemini API duration in real jobs

**Why:** See ACTUAL production performance, not just isolated tests

**How:**
```bash
# From project root
git add services/worker/src/services/gemini-service.ts
git commit -m "feat(worker): add Gemini API latency monitoring"
git push origin main

# Wait 2-3 minutes for Cloud Run deployment
# Then trigger a job and check logs
```

**What you'll see:**
```
⏱️  [Gemini API] Starting image generation (attempt 1/3)
⏱️  [Gemini API] Response received in 544200ms (544.2s)
🚨 [Gemini API] CRITICAL LATENCY: 544200ms - This should be investigated
```

**Full guide:** [gemini-api-monitoring.md](./gemini-api-monitoring.md)

---

### Option 2: Run Isolated Tests (For Comparison)

**What:** Run standalone Gemini API test locally AND on Cloud Run

**Why:** Prove whether Cloud Run environment is the problem

**How:**
```bash
cd services/worker

# Test locally (expect ~5s)
./run-gemini-test-local.sh

# Test on Cloud Run (expect ~540s if environment is the issue)
./run-cloud-run-test.sh
```

**Full guide:** [gemini-latency-test-guide.md](./gemini-latency-test-guide.md)

---

## 🔍 What Was Changed

### Production Worker Monitoring
**File:** `services/worker/src/services/gemini-service.ts`

**Changes:** Added timing logs around Gemini API calls
- Lines ~310-336: Image-to-image generation timing
- Lines ~533-555: Text-to-image generation timing

**Impact:** Zero performance overhead, just console.log statements

**Status:** ✅ Ready to deploy (just git push)

---

### Cloud Run Test Service
**Files:**
- `services/worker/src/cloud-run-gemini-test.ts` - Test server code
- `services/worker/Dockerfile.test` - Docker build config
- `services/worker/.env.cloud-run-test` - Local test API key
- `services/worker/run-gemini-test-local.sh` - Local test runner
- `services/worker/run-cloud-run-test.sh` - Cloud Run test runner

**Status:** ✅ Already deployed to Cloud Run as `gemini-latency-test` service

---

## 🎬 Recommended Workflow

### Step 1: Deploy Production Monitoring
```bash
git add services/worker/src/services/gemini-service.ts
git commit -m "feat(worker): add Gemini API latency monitoring"
git push origin main
```

### Step 2: Trigger A Real Job
```bash
# Start web app
pnpm web:dev

# Go to http://localhost:3000
# Upload an image or use "Imagine An Idea"
```

### Step 3: Check Cloud Run Logs
```bash
# Watch logs in real-time
gcloud logging tail "resource.type=cloud_run_revision \
  AND resource.labels.service_name=scribblemachine-worker" \
  --project scribblemachine

# Look for: ⏱️ [Gemini API] Response received in XXXXX ms
```

### Step 4: Compare With Standalone Tests (Optional)
```bash
cd services/worker

# Local test
./run-gemini-test-local.sh
# Expect: ~5 seconds

# Cloud Run test
./run-cloud-run-test.sh
# Expect: ~540 seconds (if Cloud Run is the problem)
```

---

## 📊 Expected Results

### If Production Logs Show >60s
**Conclusion:** Gemini API from Cloud Run is definitely slow

**What to do:**
- Run standalone tests to confirm
- Try US region Cloud Run deployment
- Contact Google Cloud support
- Consider alternative models/services

### If Production Logs Show <10s
**Conclusion:** Gemini API is fine, bottleneck is elsewhere

**What to do:**
- Check database query performance
- Check image preprocessing (Sharp)
- Check Supabase Storage upload times
- Profile entire job pipeline

---

## 💡 Key Files Summary

### Test Files (Isolated Testing)
```
services/worker/
├── src/cloud-run-gemini-test.ts    ← Standalone test server
├── Dockerfile.test                  ← Docker build for test
├── .env.cloud-run-test             ← API key for local test
├── run-gemini-test-local.sh        ← Run test locally
└── run-cloud-run-test.sh           ← Run test on Cloud Run
```

### Production Files (Real Job Monitoring)
```
services/worker/src/
└── services/gemini-service.ts      ← MODIFIED with timing logs
```

### Documentation
```
docs/
├── gemini-latency-test-guide.md                      ← How to run tests
├── gemini-api-monitoring.md                          ← How to read production logs
├── CLOUD-RUN-performance-investigation-report.md     ← Full investigation
└── README-TESTING.md                                 ← This file
```

---

## 🚨 Important Notes

1. **Monitoring has ZERO performance impact** - just console.log statements
2. **Test service is separate** - doesn't affect production worker
3. **Safe to deploy monitoring** - no breaking changes, just additional logs
4. **Cloud Run auto-deploys** - push to main = automatic deployment in ~2-3 minutes

---

## 🎯 Bottom Line

**TL;DR:**
1. **Deploy monitoring** → See real production timing
2. **Run tests** → Compare local vs Cloud Run
3. **Check logs** → Find the bottleneck

**All changes are ready** - just git push to deploy monitoring.