# Development Strategy & Environment Management

## Current Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Vercel)     │  Backend (Cloud Run)              │
│  - Next.js App         │  - Worker Service                 │
│  - Static Hosting      │  - API Endpoints                  │
│  - CDN Distribution    │  - Job Processing                 │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                   DEVELOPMENT ENVIRONMENT                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Local)      │  Backend (Cloud Run)              │
│  - localhost:3000      │  - Production API                 │
│  - Hot Reload          │  - Shared Database                │
│  - Development Tools   │  - Shared Storage                 │
└─────────────────────────────────────────────────────────────┘
```

## 🚨 Critical Problem Identified

**Current Issue**: No safe way to test backend changes without affecting production.

**Root Cause**: Backend runs on Cloud Run (production), making it impossible to test local backend changes safely.

## 🎯 Proposed Development Strategy

### Phase 1: Immediate Solution (Current)

#### **Mode 1: Frontend-Only Development (DEFAULT)**
```bash
# Safe for UI/UX work
pnpm web:dev
```
- ✅ **Safe**: No backend conflicts
- ✅ **Fast**: Hot reload for frontend changes
- ❌ **Limited**: Cannot test backend changes

#### **Mode 2: Full-Stack Testing (TEMPORARY)**
```bash
# 1. Scale down production backend
gcloud run services update worker --region=europe-west1 --min-instances=0 --max-instances=0

# 2. Start local full-stack
pnpm dev

# 3. Test backend changes
# ... make changes and test ...

# 4. Scale production back up
gcloud run services update worker --region=europe-west1 --min-instances=1 --max-instances=10
```
- ✅ **Complete**: Full-stack testing possible
- ❌ **Risky**: Production downtime during testing
- ❌ **Slow**: Manual scaling required

### Phase 2: Recommended Long-term Solution

#### **Option A: Separate Development Backend Environment**

```
┌─────────────────────────────────────────────────────────────┐
│                DEVELOPMENT ENVIRONMENT (PROPOSED)           │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Local)      │  Backend (Cloud Run Dev)          │
│  - localhost:3000      │  - dev-worker-service             │
│  - Hot Reload          │  - Separate Database               │
│  - Development Tools   │  - Test Data Only                  │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ **Safe**: No production impact
- ✅ **Fast**: No manual scaling required
- ✅ **Isolated**: Separate database and storage
- ✅ **Parallel**: Multiple developers can work simultaneously

**Implementation:**
1. Create separate Cloud Run service: `dev-worker-service`
2. Create separate Supabase project: `scribblemachine-dev`
3. Update environment variables for dev mode
4. Add deployment scripts for dev environment

#### **Option B: Local Docker Development**

```
┌─────────────────────────────────────────────────────────────┐
│                LOCAL DEVELOPMENT ENVIRONMENT               │
├─────────────────────────────────────────────────────────────┤
│  Frontend (Local)      │  Backend (Docker)                 │
│  - localhost:3000      │  - localhost:3001                 │
│  - Hot Reload          │  - Local Database                 │
│  - Development Tools   │  - Test Data Only                 │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- ✅ **Offline**: No cloud dependencies
- ✅ **Fast**: Local development
- ✅ **Isolated**: Complete separation from production
- ❌ **Complex**: Requires Docker setup

## 📋 Implementation Plan

### Immediate Actions (This Week)
1. ✅ **Document current workflow** in CLAUDE.md
2. ✅ **Add Cloud Run scaling commands** for safe backend testing
3. 🔄 **Create development strategy document** (this document)
4. 📝 **Add safety checks** to prevent accidental production impact

### Short-term (Next 2 Weeks)
1. **Evaluate Option A vs Option B** based on team needs
2. **Create separate development backend** (Cloud Run dev service)
3. **Set up development database** (Supabase dev project)
4. **Update deployment scripts** for dev environment
5. **Add environment switching** (dev/staging/prod)

### Long-term (Next Month)
1. **Implement CI/CD pipeline** for dev environment
2. **Add automated testing** for backend changes
3. **Create development data seeding** scripts
4. **Add monitoring** for dev environment
5. **Document best practices** for team development

## 🛠️ Current Workflow Commands

### Frontend Development
```bash
# Start frontend only (safe)
pnpm web:dev

# Build frontend
pnpm web:build

# Lint frontend
pnpm web:lint
```

### Backend Testing (Use with caution)
```bash
# Scale down production
gcloud run services update worker --region=europe-west1 --min-instances=0 --max-instances=0

# Start full-stack locally
pnpm dev

# Scale production back up
gcloud run services update worker --region=europe-west1 --min-instances=1 --max-instances=10
```

### Production Management
```bash
# Check Cloud Run status
gcloud run services describe worker --region=europe-west1

# View logs
gcloud run services logs read worker --region=europe-west1

# Deploy to production
pnpm run deploy:worker
```

## 🚨 Safety Guidelines

### Before Backend Testing
1. **ALWAYS** check if anyone else is using the system
2. **ALWAYS** scale Cloud Run to 0 instances first
3. **ALWAYS** verify no production traffic is affected
4. **ALWAYS** document what you're testing

### After Backend Testing
1. **ALWAYS** scale Cloud Run back to normal
2. **ALWAYS** verify production is restored
3. **ALWAYS** test production functionality
4. **ALWAYS** document any issues found

### Emergency Procedures
```bash
# If production is down, immediately scale up
gcloud run services update worker --region=europe-west1 --min-instances=1 --max-instances=10

# Check service status
gcloud run services describe worker --region=europe-west1

# View recent logs
gcloud run services logs read worker --region=europe-west1 --limit=50
```

## 📊 Risk Assessment

| Approach | Risk Level | Development Speed | Production Safety | Implementation Effort |
|----------|------------|-------------------|-------------------|----------------------|
| Current (Manual Scaling) | 🔴 High | 🟡 Medium | 🔴 Low | 🟢 Low |
| Separate Dev Backend | 🟢 Low | 🟢 High | 🟢 High | 🟡 Medium |
| Local Docker | 🟢 Low | 🟢 High | 🟢 High | 🔴 High |

## 🎯 Recommendation

**Immediate**: Use current manual scaling approach with strict safety guidelines.

**Short-term**: Implement separate development backend environment (Option A).

**Long-term**: Consider local Docker development for complete isolation.

## 📝 Next Steps

1. **Review this strategy** with the team
2. **Choose implementation approach** (Option A recommended)
3. **Create detailed implementation plan** for chosen approach
4. **Set up development environment** following chosen approach
5. **Update team workflows** and documentation
6. **Train team** on new development processes

---

*This document should be reviewed and updated as the development strategy evolves.*
