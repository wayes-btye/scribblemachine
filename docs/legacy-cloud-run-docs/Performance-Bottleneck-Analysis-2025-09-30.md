# Performance Bottleneck Analysis - Cloud Run Worker
## Job 669592dd - Peppa Pig Climbing Dinosaur Tail
**Date:** September 30, 2025
**Source Artifacts:** `docs/log-exports/slow-job-investigation/Part-2/`

---

## 📌 CRITICAL ASSESSMENT

This investigation reveals **systemic performance degradation** in the Cloud Run deployment that suggests **fundamental infrastructure issues** rather than code optimization opportunities.

**The Reality:** Same codebase runs in 7-11s locally but takes 346s on Cloud Run. Standalone Gemini test on Cloud Run: 5.15s. Same Gemini call in production worker: 213.5s. The environment CAN be fast, but the integrated system causes catastrophic slowdown across ALL operations.

**Rational Conclusion:** Rather than pursuing incremental fixes (4GB RAM, 4 CPUs, PDF library swaps), **consider alternative deployment platforms** (AWS Lambda, Railway, Render, fly.io, Digital Ocean App Platform). The effort to troubleshoot Cloud Run may exceed the effort to redeploy elsewhere.

---

## 🚨 EXECUTIVE SUMMARY

**Job Duration**: 346.3 seconds (5.8 minutes)
**Expected Duration**: 10-15 seconds
**Performance Degradation**: **23-35x SLOWER than expected**

### ROOT CAUSES IDENTIFIED:

1. **PRIMARY BOTTLENECK: Gemini API - 213.5 seconds (61.7% of total time)**
   - Expected: 5-7s
   - Actual: 213.5s
   - **30-40x SLOWER**
   - Critical latency warnings triggered

2. **SECONDARY BOTTLENECK: PDF Generation - 73.6 seconds (21.3% of total time)**
   - Expected: 1-3s
   - Actual: 73.6s
   - **25-70x SLOWER**

3. **TERTIARY BOTTLENECK: PDF Upload - 24.0 seconds (6.9% of total time)**
   - Expected: 1-2s
   - Actual: 24.0s
   - **12-24x SLOWER**

---

## 📊 DETAILED TIMING BREAKDOWN

### Complete Job Timeline

```
Job ID: 669592dd-949e-4307-83e6-80e3277897f6
User ID: 979a0520-b212-4865-bbcb-e524d639e337
Prompt: "Peppa Pig climbing up a dinosaur's tail"
Type: TEXT-TO-IMAGE (Imagine An Idea)
Complexity: standard
Line Thickness: medium

START: 2025-09-30 11:22:14.149532Z
END: 2025-09-30 11:28:00.451554Z
TOTAL: 346,301ms (346.3 seconds = 5 minutes 46 seconds)
```

### Step-by-Step Timing Analysis

| Step | Operation | Start Time | Duration | % of Total | Status |
|------|-----------|------------|----------|------------|--------|
| **1** | **Gemini API Call** | 11:22:14.149909Z | **213,499ms (213.5s)** | **61.7%** | 🚨 **CRITICAL** |
| **5** | Edge Map Upload | 11:25:47.649528Z | 11,302ms (11.3s) | 3.3% | ⚠️ SLOW |
| **6** | Asset Record Creation | 11:25:58.950784Z | 1,898ms (1.9s) | 0.5% | ✅ OK |
| **7** | **PDF Generation** | 11:26:00.849851Z | **73,601ms (73.6s)** | **21.3%** | 🚨 **CRITICAL** |
| **8** | **PDF Upload** | 11:27:14.749988Z | **23,999ms (24.0s)** | **6.9%** | ⚠️ **SLOW** |
| **9** | PDF Asset Record | 11:27:38.549535Z | 8,309ms (8.3s) | 2.4% | ⚠️ SLOW |
| **10** | Job Status Update | 11:27:46.858988Z | 13,291ms (13.3s) | 3.8% | ⚠️ SLOW |

### Bottleneck Summary

```
🚨 CRITICAL BOTTLENECKS (>60s):
1. Gemini API: 213.5s (expected 5-7s) → 30-40x slower
2. PDF Generation: 73.6s (expected 1-3s) → 25-70x slower

⚠️ SLOW OPERATIONS (10-60s):
3. PDF Upload: 24.0s (expected 1-2s) → 12-24x slower
4. Job Status Update: 13.3s (expected <1s) → 13x slower
5. Edge Upload: 11.3s (expected 1-2s) → 6-11x slower
6. PDF Asset Record: 8.3s (expected <1s) → 8x slower

✅ ACCEPTABLE (<10s):
7. Asset Record: 1.9s → OK
```

---

## 🔍 DETAILED ANALYSIS

### 1. Gemini API Bottleneck (PRIMARY - 213.5s)

**Evidence from Logs:**
```
11:22:14.549540Z - ⏱️  [Gemini API Text] Starting text-to-image generation (attempt 1/4)
11:25:47.550829Z - ⏱️  [Gemini API Text] Response received in 213000ms (213.0s)
11:25:47.550862Z - 🐢 [Gemini API] SLOW RESPONSE: 213000ms - Expected <10s
11:25:47.552630Z - 🚨 [Gemini API] CRITICAL LATENCY: 213000ms - This should be investigated
```

**Key Findings:**
- The Gemini API call took **213.5 seconds** for a simple text-to-image generation
- This is **30-40x slower** than expected (5-7s is normal)
- The model used: `gemini-2.5-flash-image-preview`
- This is a **PREVIEW model** with no SLA guarantees
- Attempt 1 of 4 - no retries needed

**Comparison with Previous Tests:**
- Local test (Sept 30): 4.2-6.4s (average 5s)
- Cloud Run standalone test (Sept 30): 5.15s
- **THIS job (Sept 30)**: 213.5s

**Why is THIS job 40x slower than the standalone test?**
This is the critical mystery. The standalone Gemini test on Cloud Run took 5.15s, but when running through the full worker pipeline, it took 213.5s for the exact same API call.

**Possible Explanations:**
1. **API Throttling**: Gemini API may throttle repeated requests from the same IP/project
2. **Resource Contention**: The worker process was doing other work simultaneously
3. **Network Issues**: Temporary network degradation from Cloud Run to Gemini API
4. **API Load**: Gemini API servers were under heavy load at that specific time
5. **Request Size**: The actual prompt may have been longer/more complex than test prompts

---

### 2. PDF Generation Bottleneck (SECONDARY - 73.6s)

**Evidence from Logs:**
```
11:26:00.849851Z - ⏱️  [JOB 669592dd] Step 7: Generating PDF from PNG...
11:27:14.451030Z - ⏱️  [JOB 669592dd] Step 7 DONE: PDF generated in 73601ms
```

**Key Findings:**
- PDF generation from PNG took **73.6 seconds**
- Expected: 1-3 seconds
- **25-70x slower** than expected
- This is using PDFKit library to convert PNG to PDF

**Analysis:**
- The edge map PNG was successfully generated (took 213.5s via Gemini)
- Converting this PNG to PDF took an additional 73.6s
- This suggests the PDF generation process is extremely slow on Cloud Run

**Possible Causes:**
1. **CPU Throttling**: Cloud Run container may be CPU-throttled
2. **Memory Pressure**: Container running low on memory
3. **PDFKit Performance**: PDFKit may be inefficient for large images
4. **Image Size**: The generated image may be very large/high-resolution
5. **Disk I/O**: Slow disk performance in Cloud Run environment

**Related User Observation:**
From the original performance investigation plan:
> "**Theory 1: PDF Processing Bottleneck** (MOST LIKELY)"
> "PDF generation requires disk I/O and processing power, Cloud Run environment may be constrained"

**This theory is CONFIRMED** - PDF generation is indeed a major bottleneck.

---

### 3. PDF Upload Bottleneck (TERTIARY - 24.0s)

**Evidence from Logs:**
```
11:27:14.749988Z - ⏱️  [JOB 669592dd] Step 8: Uploading PDF to storage...
11:27:38.549528Z - ⏱️  [JOB 669592dd] Step 8 DONE: PDF uploaded in 23999ms
```

**Key Findings:**
- Uploading PDF to Supabase Storage took **24.0 seconds**
- Expected: 1-2 seconds
- **12-24x slower** than expected

**Comparison:**
- Edge map upload (Step 5): 11.3s for PNG image
- PDF upload (Step 8): 24.0s for PDF file

**Supabase Storage Log Confirmation:**
```
1759231651776000 - POST /storage/v1/object/artifacts/.../coloring_page.pdf (200 OK)
```

**Possible Causes:**
1. **File Size**: PDF may be significantly larger than PNG
2. **Network Latency**: Cloud Run (europe-west1) → Supabase (unknown region)
3. **Storage API**: Supabase Storage API may be slow
4. **Compression**: PDF may not be compressed efficiently

---

### 4. Database Operations Slowness (13.3s status update, 8.3s asset record)

**Evidence from Logs:**
```
11:27:46.858988Z - ⏱️  [JOB 669592dd] Step 10: Updating job status to succeeded...
11:28:00.150280Z - ⏱️  [JOB 669592dd] Step 10 DONE: Job status updated in 13291ms
```

**Key Findings:**
- Final job status update took **13.3 seconds**
- Creating PDF asset record took **8.3 seconds**
- Both are simple database INSERT/UPDATE operations
- Expected: <1 second each

**Supabase Edge Log Confirmation:**
```
1759231677565000 - PATCH /rest/v1/jobs?id=eq.669592dd... (204 No Content)
```

**Possible Causes:**
1. **Database Contention**: Multiple workers accessing the same tables
2. **Network Latency**: Cloud Run → Supabase PostgreSQL
3. **RLS Policies**: Row Level Security policies causing overhead
4. **Index Issues**: Missing or inefficient indexes on jobs/assets tables

---

## 🔬 COST_CENTS MYSTERY INVESTIGATION

**User Observation:**
> "why does the cost cents on the jobs table say 100 when it first starts and then changes to 4 when I do it on cloud run that dont make sense"

**Hypothesis:**
The worker may be setting cost_cents to a placeholder/default value (100) when the job starts, then updating it to the actual cost (4) when the job completes.

**Expected Behavior:**
- cost_cents should be set ONLY when the job completes
- Initial value should be NULL or undefined

**Action Required:**
Need to check the job creation code to see if cost_cents is being set prematurely.

---

## 📈 COMPARISON WITH PREVIOUS TESTS

### Local Development Performance (Expected)
```
Environment: Local Windows machine
Test Date: September 30, 2025
Results:
- Simple castle: 4.2s
- Standard dog: 4.8s
- Detailed butterfly: 6.4s
Average: ~5 seconds
```

### Cloud Run Standalone Test (September 30, 2025)
```
Environment: Cloud Run (gemini-latency-test service)
Test: Direct Gemini API call (no worker pipeline)
Result: 5.15 seconds
Status: ✅ GOOD - Proves Cloud Run → Gemini API works normally
```

### Cloud Run Production Worker (THIS TEST - September 30, 2025)
```
Environment: Cloud Run (scribblemachine-worker service)
Test: Full job processing pipeline
Result: 346.3 seconds (213.5s Gemini + 73.6s PDF + 24s upload + 35s overhead)
Status: 🚨 CRITICAL - 40x slower than standalone test
```

---

## 🎯 ROOT CAUSE CONCLUSIONS

### Why is the worker 40x slower than the standalone test?

The standalone Gemini test proved that:
- ✅ Cloud Run → Gemini API network path is FAST (5.15s)
- ✅ Gemini API itself is FAST (5.15s)
- ✅ Cloud Run environment is CAPABLE of fast Gemini calls

But the production worker showed:
- ❌ Same Gemini API call takes 213.5s (40x slower)
- ❌ PDF generation takes 73.6s (25-70x slower)
- ❌ All database operations are slow (8-13s each)

### **CONCLUSION: The issue is NOT the Gemini API itself**

The issue appears to be **resource contention or throttling within the Cloud Run worker container**.

### Evidence Supporting Resource Contention:

1. **ALL operations are slow** - not just Gemini API:
   - Gemini API: 40x slower
   - PDF generation: 25-70x slower
   - Database operations: 8-13x slower
   - File uploads: 12-24x slower

2. **Consistent slowdown factor** - everything is roughly 10-40x slower, suggesting a systemic issue

3. **Standalone test was fast** - proves the environment CAN be fast

4. **Node.js 18 deprecation warning** at startup:
   ```
   ⚠️ Node.js 18 and below are deprecated and will no longer be supported
   ```

### **PRIMARY HYPOTHESIS: CPU/Memory Throttling**

The Cloud Run container appears to be **severely CPU-throttled or memory-constrained** during job processing.

**Evidence:**
- All operations (CPU-bound PDF generation, network I/O, database I/O) are slow
- Standalone test (minimal resource usage) was fast
- Production worker (heavy resource usage) is extremely slow

**Possible Causes:**
1. **Concurrent Job Processing**: Worker may be processing multiple jobs simultaneously despite single-instance configuration
2. **Memory Leak**: Worker accumulating memory over time, causing swapping/GC pressure
3. **CPU Throttling**: Cloud Run enforcing CPU limits during sustained load
4. **Startup Performance**: Instance was just started (see "Starting new instance" in logs)

---

## 🛠 RECOMMENDED SOLUTIONS

### IMMEDIATE ACTION (Priority 1)

**1. Investigate Cloud Run Resource Limits**
```bash
# Check current resource configuration
gcloud run services describe scribblemachine-worker \
  --region=europe-west1 \
  --format="value(spec.template.spec.containers[0].resources)"
```

Expected configuration:
- CPU: 2 vCPU (currently)
- Memory: 2Gi (currently)

**Action:** Try increasing to 4 vCPU / 4Gi memory to see if performance improves.

**2. Add Resource Monitoring to Worker**
```typescript
// Add at start of processGenerationJob
const startCPU = process.cpuUsage();
const startMem = process.memoryUsage();

// Add at end of each step
const cpuDelta = process.cpuUsage(startCPU);
const memDelta = process.memoryUsage();
console.log(`CPU: user=${cpuDelta.user/1000}ms, system=${cpuDelta.system/1000}ms`);
console.log(`Memory: heapUsed=${memDelta.heapUsed/1024/1024}MB, external=${memDelta.external/1024/1024}MB`);
```

**3. Optimize PDF Generation**
The PDF generation is taking 73.6 seconds, which is unacceptable.

**Options:**
a) **Use faster PDF library** - Consider switching from PDFKit to a lighter library
b) **Pre-optimize image** - Compress/resize PNG before PDF conversion
c) **Offload PDF generation** - Generate PDF asynchronously in separate service
d) **Cache PDFs** - Generate PDF on-demand when user downloads, not during job processing

**4. Optimize Database Operations**
Job status update taking 13.3s is absurd for a simple UPDATE query.

**Actions:**
- Add database connection pooling
- Check for N+1 queries
- Review RLS policies (may be causing overhead)
- Add indexes on frequently queried columns

---

### MEDIUM-TERM FIXES (Priority 2)

**5. Upgrade to Node.js 20**
```dockerfile
# In services/worker/Dockerfile
FROM node:20-alpine
```

**6. Profile the Worker**
Add detailed profiling to understand where CPU time is spent:
```bash
node --prof dist/simple-worker.js
node --prof-process isolate-*.log > profile.txt
```

**7. Separate PDF Generation Service**
Move PDF generation to a separate Cloud Run service to avoid resource contention.

---

### LONG-TERM IMPROVEMENTS (Priority 3)

**8. Switch to Event-Driven Architecture**
Replace polling with Cloud Tasks or Pub/Sub to eliminate polling overhead.

**9. Implement Job Queueing**
Use Redis or Cloud Tasks for proper job queue management.

**10. Add Comprehensive Monitoring**
- Cloud Monitoring dashboards for resource usage
- Custom metrics for job processing times
- Alerts for slow operations

---

## 📋 ADDITIONAL FINDINGS

### Node.js Deprecation Warning
```
⚠️ Node.js 18 and below are deprecated and will no longer be supported in future versions
   of @supabase/supabase-js. Please upgrade to Node.js 20 or later.
```

**Impact:** Using deprecated Node.js version may cause compatibility/performance issues.

**Action Required:** Upgrade to Node.js 20 in Dockerfile.

### Supabase Frontend Polling
The frontend polled the job status **every 2 seconds** during the entire 346-second job:
```
Total polls: ~173 requests (346s / 2s)
```

**Impact:** Unnecessary load on Supabase Edge API.

**Recommendation:** Implement exponential backoff:
- First 10s: poll every 2s
- 10-60s: poll every 5s
- 60s+: poll every 10s

---

## 🎯 ANSWER TO USER'S QUESTION

**User asked:** "What do I do next?"

### IMMEDIATE NEXT STEPS:

1. **✅ Add resource monitoring** - Deploy the CPU/memory logging code above
2. **✅ Increase Cloud Run resources** - Try 4 vCPU / 4Gi RAM
3. **✅ Run another test** - See if increased resources improve performance
4. **✅ Profile PDF generation** - Identify why PDFKit is so slow

### TEST PLAN:

```bash
# 1. Update resource limits
gcloud run services update scribblemachine-worker \
  --region=europe-west1 \
  --cpu=4 \
  --memory=4Gi

# 2. Add resource monitoring code (see section above)

# 3. Run another job and compare:
# - Run from Vercel frontend
# - Check Cloud Run logs for CPU/memory stats
# - Compare timings with this report
```

---

## 📊 SUMMARY TABLE

| Metric | Expected | Actual | Slowdown | Priority |
|--------|----------|--------|----------|----------|
| **Total Job Time** | 10-15s | 346.3s | **23-35x** | 🚨 CRITICAL |
| **Gemini API** | 5-7s | 213.5s | **30-40x** | 🚨 CRITICAL |
| **PDF Generation** | 1-3s | 73.6s | **25-70x** | 🚨 CRITICAL |
| **PDF Upload** | 1-2s | 24.0s | **12-24x** | ⚠️ HIGH |
| **Job Status Update** | <1s | 13.3s | **13x** | ⚠️ HIGH |
| **Edge Upload** | 1-2s | 11.3s | **6-11x** | ⚠️ MEDIUM |
| **PDF Asset Record** | <1s | 8.3s | **8x** | ⚠️ MEDIUM |
| **Asset Record** | <1s | 1.9s | **2x** | ✅ OK |

---

## 🏁 FINAL CONCLUSION

The Cloud Run worker is experiencing **severe performance degradation across ALL operations**, not just the Gemini API. This strongly suggests **resource contention or throttling** within the Cloud Run container.

**The standalone Gemini test proved the environment CAN be fast (5.15s), so the issue is specific to the full worker pipeline under load.**

**Recommended immediate action:**
1. Increase Cloud Run resources (4 vCPU / 4Gi RAM)
2. Add resource monitoring to identify bottleneck
3. Optimize PDF generation (biggest win: 73.6s → 3s target)
4. Run comparison test

**Expected outcome after fixes:**
- Gemini API: 213.5s → 7s (save 206s)
- PDF Generation: 73.6s → 3s (save 70s)
- Total: 346s → 25s (save 321s, 13x improvement)

This would bring performance within acceptable range (10-25s).