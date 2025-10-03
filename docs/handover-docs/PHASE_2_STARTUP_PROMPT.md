# Phase 2 Startup Prompt

## Copy-Paste for Next Chat Session

```
I'm ready to begin Phase 2: Foundation & Infrastructure for the Coloring Page Generator project.

IMPORTANT CONTEXT: Phase 1 (Critical Path Validation) is complete. The backend Gemini API service has been successfully implemented and tested. All details are in the repository.

Please read and understand the current project state from these documents:
1. @docs/BACKEND_API_IMPLEMENTATION_COMPLETE.md - Complete backend implementation details
2. @docs/IMPLEMENTATION_STRATEGY.md - Updated strategy with Phase 2 priorities
3. @docs/PHASE_1_ASSESSMENT.md - Phase 1 completion status
4. @docs/initial_documents/prd.md - PRD requirements for context
5. @docs/initial_documents/architecture.md - Architecture specifications

KEY FACTS FROM PHASE 1:
- ✅ Backend Gemini API service is production-ready and tested
- ✅ All 6 parameter combinations (Simple/Standard/Detailed × Thin/Medium/Thick) validated
- ✅ Cost tracking accurate ($0.039/generation, within $0.05 budget)
- ✅ Response times 6-12 seconds (within targets)
- ✅ Job processor with pg-boss queue integration complete
- ⚠️ One known issue: Simple+Thick combination needs prompt refinement

PHASE 2 PRIORITIES (from updated Implementation Strategy):
1. Database Schema & Storage (users, jobs, assets, credits)
2. Authentication System (Supabase Auth with magic links)
3. File Upload/Storage (Supabase Storage buckets with TTL policies)
4. Rate Limiting & User Management

CRITICAL UI NOTE: We need a Parameter Examples Gallery component that shows users visual examples of what Simple/Standard/Detailed complexity and Thin/Medium/Thick line thickness look like before they generate. This prevents surprises for paid users.

Please create a detailed Phase 2 implementation plan and let's begin with the database schema setup.
```

## Alternative Shorter Version

```
Ready for Phase 2: Foundation & Infrastructure. Phase 1 backend Gemini API service is complete and tested.

Read: @docs/BACKEND_API_IMPLEMENTATION_COMPLETE.md and @docs/IMPLEMENTATION_STRATEGY.md

Phase 2 focus: Database schema, Supabase Auth, file uploads, user management. Also need Parameter Examples Gallery UI component for user preview before generation.

Create Phase 2 plan and start with database setup.
```

## Reference Documents for Context

The following documents contain all necessary context for the next chat:

**Primary Context:**
- `docs/BACKEND_API_IMPLEMENTATION_COMPLETE.md` - Complete backend status
- `docs/IMPLEMENTATION_STRATEGY.md` - Updated Phase 2 priorities
- `docs/PHASE_1_ASSESSMENT.md` - Phase 1 completion details

**Supporting Context:**
- `docs/initial_documents/prd.md` - Product requirements
- `docs/initial_documents/architecture.md` - Technical architecture
- `docs/TESTING_GUIDE.md` - Testing methodology
- `CLAUDE.md` - Project setup and conventions

**Code References:**
- `services/worker/src/services/gemini-service.ts` - Production API service
- `services/worker/src/workers/generation-worker.ts` - Job processor
- `packages/types/src/index.ts` - Shared type definitions

## What's Ready for Phase 2

✅ **Backend API Service**: Production-ready Gemini integration
✅ **Job Processing**: pg-boss queue system implemented
✅ **Cost Tracking**: Accurate billing integration points
✅ **Error Handling**: Comprehensive error categorization
✅ **Testing**: Full test suite for backend validation
✅ **Architecture**: Monorepo structure and shared packages

## Phase 2 Success Criteria

- Database schema with RLS policies
- Magic link authentication working
- File upload with signed URLs
- User credit system functional
- Basic UI for upload/controls/preview
- Integration with existing backend API service