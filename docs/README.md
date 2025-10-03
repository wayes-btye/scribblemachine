# Documentation Structure

## Root Level - Core Reference Documents

**Master Strategy & Planning:**
- `IMPLEMENTATION_STRATEGY.md` - Master implementation plan and phases
- `DEVELOPMENT_STRATEGY.md` - Critical dev workflow, worker conflicts, safety guidelines
- `UI_DEVELOPMENT_STRATEGY.md` - Consolidated UI dev guide (isolated pages & variants)
- `work_log.md` - Active work log (tasklog format)
- `INCOMPLETE_TASKS_ANALYSIS.md` - Current outstanding tasks tracker

**Review & Cleanup:**
- `CLEANUP-Committed-Junk-Files.md` - Pending review: potential junk files to delete
- `OPENROUTER-FALAI-FALLBACK_STRATEGY_FUTURE.md` - Future cost-saving strategy

---

## Organized Folders

### INFRASTRUCTURE/
**Deployment & Infrastructure Reference**
- `Google-Cloud-Run-Current-Setup.md` - Production Cloud Run setup, PAUSE_WORKER
- `Cloud-Run-Performance-SOLVED-Final-Analysis.md` - CPU throttling fix (58x speedup)
- `github-actions-and-deployment-analysis.md` - CI/CD reference
- `Vercel-Deployment-Analysis.md` - Vercel setup, Node.js version, settings

### TESTING/
**Testing Documentation & Procedures**
- `TESTING_REFERENCE.md` - Consolidated testing guide (backend + frontend + manual)
- `MANUAL_TESTING_INSTRUCTIONS.md` - 10 comprehensive manual test scenarios
- `PLAYWRIGHT_MCP_TESTING_STRATEGY.md` - MCP automated testing strategy
- `TEST_EXECUTION_GUIDE.md` - Step-by-step test execution

### PLANNING/
**Active Phase Plans**
- `PHASE_3B_EXTENDED_PLAN.md` - Has outstanding tasks (AI title suggestions, etc.)
- `PHASE_3B_SESSION_PLAN.md` - Session tracker for Phase 3B

### FEATURES/
**Feature-Specific Documentation**
- `GALLERY_FEATURE_FEASIBILITY_ANALYSIS.md` - Gallery planning analysis
- `GALLERY_IMPLEMENTATION_TRACKER.md` - Gallery Phase 1 tracker
- `GALLERY_IMPLEMENTATION_TRACKER_PART2.md` - Gallery Phase 2 tracker
- `API_GALLERY_ENDPOINT.md` - Gallery API specification

### ANALYSIS/
**Active Analysis & Research**
- `CLAUDE_GITHUB_INTEGRATION_ANALYSIS.md` - GitHub integration (for Claude setup)
- `PORT_DEPENDENCY_ANALYSIS.md` - Port 3000 dependency analysis (worktree flexibility)

### LEGACY/
**Superseded Documentation**
- `TESTING_GUIDE.md` - Old backend testing guide (replaced by TESTING_REFERENCE.md)
- `TESTING_STRATEGY.md` - Old testing strategy (consolidated into TESTING_REFERENCE.md)

---

## Archive Folders

### handover-docs/
**Completed Sessions & Features** (42 files)
- Phase completion documents (Phase 1, 2, 3A, 3B)
- Backend implementation completion
- Feature handovers (PDF export, workspace redesign, etc.)
- Session summaries
- Deployment resolution summaries
- Old UI dev guides (superseded by UI_DEVELOPMENT_STRATEGY.md)

### architecture-decisions/
**ADRs** - Architecture Decision Records

### images/
**Assets & Screenshots**
- Suggested-Assets/ - Brand assets (mascots, logos)
- Screenshots and mockups

### initial_documents/
**Historical Project Documentation**
- Original project setup and planning docs

### log-exports/
**Log Files & Exports**
- Test logs, screenshots, analysis exports

---

## Quick Navigation

**Starting a new feature?**
→ Read: `IMPLEMENTATION_STRATEGY.md` + `DEVELOPMENT_STRATEGY.md`

**Working on UI?**
→ Read: `UI_DEVELOPMENT_STRATEGY.md`

**Deploying changes?**
→ Read: `INFRASTRUCTURE/Google-Cloud-Run-Current-Setup.md`

**Need to test?**
→ Read: `TESTING/TESTING_REFERENCE.md`

**Understanding infrastructure?**
→ Browse: `INFRASTRUCTURE/` folder

**Looking for completed work context?**
→ Browse: `handover-docs/` folder

---

## Document Lifecycle

**Active → Completed → Archived:**

1. **Active Development** - Docs in root or organized folders
2. **Feature Complete** - Move to `handover-docs/`
3. **Superseded** - Move to `LEGACY/`

**When in doubt:**
- Core reference docs → Root level
- Phase/feature complete → `handover-docs/`
- Old/superseded → `LEGACY/`
