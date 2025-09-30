# Cleanup Task: Committed Junk Files

**Date:** September 30, 2025
**Status:** PENDING - Awaiting approval for cleanup
**Risk Level:** Low (all files analyzed for dependencies)

---

## Overview

During the Vercel deployment attempts and Google Cloud Run troubleshooting phases (September 2025), various temporary files, test artifacts, and documentation were created and committed. This document catalogs these files and provides recommendations for cleanup.

---

## Files to Delete (High Confidence)

### Category 1: Duplicate/Superseded Documentation (95-100% confidence)

**Already Moved to Archive (Safe to Keep Deleted):**
- ✅ `docs/Cloud-Build-Context-Issue-Resolution.md` - Moved to `legacy-cloud-run-docs/`
- ✅ `docs/Deployment-Crisis-Investigation-Report.md` - Moved to `legacy-vercel-docs/`
- ✅ `docs/Deployment-Next-Steps.md` - Superseded by current docs
- ✅ `docs/FALLBACK_STRATEGY_FUTURE.md` - Moved to `OPENROUTER-FALAI-FALLBACK_STRATEGY_FUTURE.md`
- ✅ `docs/Final-Deployment-Status-Report.md` - Moved to `legacy-vercel-docs/`
- ✅ `docs/GOOGLE_CLOUD_RUN_MIGRATION_PLAN-LEGACY.md` - Moved to `legacy-cloud-run-docs/`
- ✅ `docs/Google-Cloud-Run-Migration-Plan.md` - Moved to `legacy-cloud-run-docs/`
- ✅ `docs/Performance-Investigation-Plan.md` - Superseded by `Cloud-Run-Performance-SOLVED-Final-Analysis.md`
- ✅ `docs/Single-Repository-Migration-Plan.md` - Historical, migration complete
- ✅ `docs/Vercel-Deployment-Progress.md` - Moved to `legacy-vercel-docs/`
- ✅ `docs/Vercel-Migration-Feasibility-Analysis.md` - Moved to `legacy-vercel-docs/`
- ✅ `docs/Vercel-Monorepo-Deployment-Analysis.md` - Moved to `legacy-vercel-docs/`
- ✅ `docs/performance-investigation-report.md` - Superseded by `Performance-Bottleneck-Analysis-2025-09-30.md`

**Confidence:** 100% - These are already moved/archived or superseded. Safe to confirm deletion.

---

### Category 2: Test Infrastructure (Archived, 90% confidence)

**Gemini Latency Test Files:**
- ✅ `services/worker/src/cloud-run-gemini-test.ts` - Moved to `archived-tests/gemini-latency-investigation/`
- ✅ `services/worker/Dockerfile.test` - Moved to `archived-tests/gemini-latency-investigation/`
- ✅ `services/worker/deploy-test-to-cloud-run.sh` - Moved to `archived-tests/gemini-latency-investigation/`
- ✅ `services/worker/run-cloud-run-test.sh` - Moved to `archived-tests/gemini-latency-investigation/`
- ✅ `services/worker/run-gemini-test-local.sh` - Moved to `archived-tests/gemini-latency-investigation/`
- ✅ `services/worker/package.test.json` - Moved to `archived-tests/gemini-latency-investigation/`

**Cloud Run Service:**
- ✅ `gemini-latency-test` (Cloud Run service) - **DELETED** (no longer needed)

**Rationale:** Problem solved, tests proven the hypothesis. Archived for reference but no longer needed in active codebase.

**Confidence:** 90% - Could delete entirely, but keeping in `archived-tests/` for historical reference is safer.

---

### Category 3: Build Configuration (KEEP, 0% confidence to delete)

**Keep These:**
- ❌ `cloudbuild.yaml` - **DELETED** but might be needed if re-enabling GitHub trigger auto-deploy
  - **Status:** Currently deleted in git diff
  - **Recommendation:** Keep deleted unless re-implementing automated Cloud Build deployment
  - **Risk:** LOW - Manual deployment workflow is working fine

**Confidence:** 95% - Only needed if you want GitHub push → auto-deploy. Current manual deployment works fine.

---

## Files to Review (Medium Confidence)

### Category 4: Log Exports (KEEP, organized)

**Already Organized:**
- ✅ `docs/log-exports/cloud-run-setup-screenshot.png`
- ✅ `docs/log-exports/slow-job-investigation/1020s-processing-cloud-run-logs.json`
- ✅ `docs/log-exports/slow-job-investigation/1020s-processing.png`
- ✅ `docs/log-exports/slow-job-investigation/170s-processing-cloud-run-logs.json`
- ✅ `docs/log-exports/slow-job-investigation/Part-2/` (entire directory)
- ✅ `docs/log-exports/slow-job-investigation/fb81ea57-analysis.md`
- ✅ `docs/log-exports/slow-job-investigation/supabase-edge-logs-*.csv`
- ✅ `docs/log-exports/slow-job-investigation/supabase-storage-logs-*.csv`

**Moved to Organized Location:**
- ✅ `cloud-run-recent-logs.json` → `docs/log-exports/slow-job-investigation/Part-2/`
- ✅ `job-fb81ea57-detailed.json` → `docs/log-exports/slow-job-investigation/Part-2/`

**Rationale:** These are evidence for the performance investigation. Referenced in documentation. Keep organized in `docs/log-exports/`.

**Confidence:** 100% KEEP - These are valuable historical evidence and investigation artifacts.

---

### Category 5: Worker Source Changes (KEEP, 100% confidence)

**Modified Files (Essential):**
- ✅ `.mcp.json` - MCP server configuration changes
- ✅ `services/worker/src/index.ts` - Timing logs for performance investigation
- ✅ `services/worker/src/env.ts` - Environment variable handling (untracked but should be added)
- ✅ `services/worker/test-output-text-to-image/*.png` - Test output artifacts (keep for reference)
- ✅ `services/worker/test-output-text-to-image/*.txt` - Test response logs (keep for reference)

**Rationale:** These are actual code improvements and test artifacts. Essential to keep.

**Confidence:** 100% KEEP

---

## Cleanup Actions Taken

### ✅ Completed Actions

1. **Moved root JSON files** to organized location:
   - `cloud-run-recent-logs.json` → `docs/log-exports/slow-job-investigation/Part-2/`
   - `job-fb81ea57-detailed.json` → `docs/log-exports/slow-job-investigation/Part-2/`

2. **Archived Gemini test infrastructure**:
   - Created `services/worker/archived-tests/gemini-latency-investigation/`
   - Moved all test files there for historical reference

3. **Deleted Cloud Run test service**:
   - Removed `gemini-latency-test` service from Cloud Run
   - Saves cost, no longer needed

4. **Confirmed deletions** (already staged in git):
   - All legacy docs moved to appropriate archive folders
   - Superseded performance docs removed

---

## Recommended Cleanup Operations

### Phase 1: Safe Deletions (Immediate, 100% safe)

These are already in git staging as deletions - just commit them:

```bash
# Already deleted, just confirm:
git status | grep deleted:
# - cloudbuild.yaml
# - docs/Cloud-Build-Context-Issue-Resolution.md
# - docs/Deployment-Crisis-Investigation-Report.md
# - [etc... all the moved docs]
```

**Action:** Commit these deletions as-is.

**Risk:** ZERO - Files are moved/superseded.

---

### Phase 2: Archive Old Test Artifacts (Optional, Low priority)

**Files to Consider:**
- `services/worker/test-output-text-to-image/*.png` (test artifacts)
- `services/worker/test-output-text-to-image/*.txt` (test logs)

**Options:**
1. **Keep as-is** (no cleanup needed, organized in test folder)
2. **Move to** `archived-tests/gemini-generation-tests/` (if you want them out of main source)
3. **Delete** (if you don't need test artifacts anymore)

**Recommendation:** Keep as-is. They're organized and don't clutter the main source.

**Risk:** ZERO either way.

---

### Phase 3: Deep Clean (Future, when needed)

**Legacy Docs to Review (later):**
- `docs/legacy-cloud-run-docs/` - Historical Cloud Run migration docs
- `docs/legacy-vercel-docs/` - Historical Vercel deployment attempts
- `docs/handover-docs/` - Session handover summaries (old context)

**When to Clean:** When you're confident you'll never need this historical context (6-12 months from now).

**Recommendation:** Keep for now. Storage is cheap, historical context is valuable.

---

## Files NOT to Delete (Ever)

### Critical Files

**Architecture Decisions:**
- `docs/architecture-decisions/ADR-001-database-polling-vs-pgboss.md` ✅
- `docs/architecture-decisions/ADR-002-simplified-worker-architecture.md` ✅

**Current Documentation:**
- `docs/Cloud-Run-Performance-SOLVED-Final-Analysis.md` ✅
- `docs/Performance-Bottleneck-Analysis-2025-09-30.md` ✅
- `docs/Google-Cloud-Run-Current-Setup.md` ✅
- `docs/gemini-api-monitoring.md` ✅
- `docs/README-TESTING.md` ✅

**Log Evidence:**
- Everything in `docs/log-exports/` ✅

---

## Summary

### What Was Cleaned Up:
- ✅ Root JSON files → Organized in `docs/log-exports/`
- ✅ Gemini test files → Archived in `services/worker/archived-tests/`
- ✅ Cloud Run test service → Deleted (saves cost)
- ✅ Legacy docs → Confirmed deletions (already moved to archives)

### What to Commit:
- Modified files (index.ts with timing logs, MCP config)
- New files (solved analysis doc, archived tests, organized logs)
- Deleted files (legacy docs, superseded reports)

### What NOT to Delete:
- Architecture decision records (ADRs)
- Current performance investigation docs
- Log evidence files
- Test artifacts (organized)

---

## Confidence Summary

| Category | Files | Delete? | Confidence |
|----------|-------|---------|------------|
| **Legacy docs** (moved to archives) | 13 files | ✅ YES | 100% |
| **Gemini test infrastructure** | 6 files | ✅ ARCHIVED | 90% |
| **cloudbuild.yaml** | 1 file | ✅ YES (for now) | 95% |
| **Log exports** | ~15 files | ❌ KEEP | 100% |
| **Test artifacts** | ~6 files | ❌ KEEP | 100% |
| **Worker source changes** | 3 files | ❌ KEEP | 100% |

---

## Next Steps

1. **Review this document**
2. **Approve cleanup actions** (or request changes)
3. **Commit changes** to git
4. **Optional:** Deep clean legacy docs (later)

---

**Document Status:** READY FOR REVIEW
**Risk Assessment:** LOW - All proposed deletions are safe
**Storage Impact:** Minimal (mostly docs, ~2MB total)