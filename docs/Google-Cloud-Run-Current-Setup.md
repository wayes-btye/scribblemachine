# Google Cloud Run Current Setup Documentation

## Executive Summary
This document provides comprehensive documentation of the current Google Cloud Run deployment for the ColoringGenerator worker service, including service configuration and operational procedures.

**✅ CURRENT STATUS**: Service is WORKING in production with PAUSE_WORKER functionality (September 29, 2025)

**📋 RECENT CHANGES (Sept 29, 2025)**:
- **Major Issue Resolved**: Deployment pipeline was completely broken - GitHub trigger was building images but NOT deploying them to Cloud Run
- **Root Cause**: Cloud Build trigger was only performing `docker build` without deployment step
- **Root Cause 2**: Image name mismatch - trigger built `github.com/wayes-btye/scribblemachine:$COMMIT_SHA` but service used `coloringpage-worker:latest`
- **Solution**: Fixed Cloud Run service to use the correct image that GitHub triggers actually build
- **Result**: PAUSE_WORKER mechanism now works correctly, proper GitHub integration restored

**🎯 IMPORTANT**: PAUSE_WORKER is now functional and displays proper pause messages in logs!

---

## CURRENT PRODUCTION SETUP

### **Service Overview**
- **Service Name**: `scribblemachine-worker`
- **Project ID**: `scribblemachine` (project number: 1001132689979)
- **Region**: `europe-west1`
- **Status**: ACTIVE (can be paused with PAUSE_WORKER=true)
- **Architecture**: Polling-based worker with 5-second intervals
- **Current Image**: `gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:2bd64c60dcfa36c1224763b69ddbe17fe03f9d53`

### **Service URLs**
- **Primary**: https://scribblemachine-worker-1001132689979.europe-west1.run.app
- **Health Check**: `curl https://scribblemachine-worker-1001132689979.europe-west1.run.app/health`

---

## DEPLOYMENT PIPELINE (CORRECTED)

### **Current GitHub Integration Setup**

**✅ WORKING STATUS**: GitHub integration is functional but required manual fixes (September 29, 2025)

**Repository Configuration**:
- **GitHub Repository**: `wayes-btye/scribblemachine`
- **Branch**: `main` (automated building on push)
- **Build Trigger**: `rmgpgab-scribblemachine-worker-europe-west1-wayes-btye-scribyze`
- **Dockerfile Path**: `services/worker/Dockerfile`
- **Build Context**: `.` (root directory - includes all workspace files)

**Actual Deployment Workflow** (What Really Happens):
1. **Code Push**: Push to `main` branch in GitHub
2. **Automatic Trigger**: Cloud Build detects changes and builds image
3. **Docker Build**: Uses `services/worker/Dockerfile` with root context (`.`)
4. **Image Push**: Pushes to `gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:$COMMIT_SHA`
5. **⚠️ NO AUTO-DEPLOY**: Cloud Build trigger does NOT automatically deploy to Cloud Run
6. **Manual Update Required**: Must manually update Cloud Run to use new image

### **GitHub Integration Issue Explained**

**The Problem**: The GitHub integration was **partially broken**:
- **Cloud Build Trigger**: ✅ Successfully builds images on GitHub push
- **Deployment Step**: ❌ Missing - trigger doesn't deploy images to Cloud Run
- **Service Configuration**: ❌ Was using wrong/old image names

**Cloud Build Trigger Configuration**:
```yaml
steps:
  - name: gcr.io/cloud-builders/docker
    args:
      - build
      - -t
      - gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:$COMMIT_SHA
      - -f
      - services/worker/Dockerfile
      - .
# ❌ MISSING: No gcloud run deploy step
```

**What Should Happen vs What Actually Happens**:
- **Expected**: Push to GitHub → Build → Deploy to Cloud Run
- **Reality**: Push to GitHub → Build → Image sits unused in registry

### **Current Deployment Methods**

**Option 1: GitHub Push + Manual Cloud Run Update**
1. Push code to `main` branch
2. Wait for Cloud Build to complete (builds image automatically)
3. Manually update Cloud Run service to use new image:
   ```bash
   gcloud run services update scribblemachine-worker \
     --region=europe-west1 \
     --image="gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:COMMIT_SHA"
   ```

**Option 2: Manual Build from Root Directory**
```bash
cd /path/to/ColoringGenerator
gcloud builds submit --tag=gcr.io/scribblemachine/coloringpage-worker:latest \
  --file=services/worker/Dockerfile .
```

---

## WORKER PAUSE MECHANISM (NEW FEATURE)

### **PAUSE_WORKER Environment Variable**

**✅ CURRENT STATUS**: PAUSE_WORKER is now working correctly and displays proper messages

**Configuration**:
- **Environment Variable**: `PAUSE_WORKER=true/false`
- **Purpose**: Pause job processing for local development testing
- **Default**: `false` (normal operation)
- **Location**: Set in Cloud Run environment variables

**Behavior**:
- **When `PAUSE_WORKER=true`**:
  ```
  ⏸️  WORKER PAUSED: PAUSE_WORKER=true detected
     Worker will not process jobs - safe for local development
     To resume: Set PAUSE_WORKER=false or remove the environment variable
     Health check server running on http://localhost:8080/health
     No environment validation required - running in pause-only mode
  ```
- **When `PAUSE_WORKER=false` or undefined**: Normal job processing
- **Health Check**: Remains active regardless of pause state

**Usage for Local Development**:
1. Set `PAUSE_WORKER=true` in Cloud Run console
2. Run `pnpm dev` locally for full-stack development
3. Local worker processes jobs, Cloud Run worker is paused
4. Set `PAUSE_WORKER=false` to resume Cloud Run processing

---

## CLOUD RUN SERVICE CONFIGURATION

### **Resource Allocation**
- **CPU**: 2 vCPU
- **Memory**: 2Gi (2048 MB)
- **Container Concurrency**: 80 (multiple requests per instance)
- **Port**: 8080 (HTTP server for health checks)

### **Scaling Configuration**
- **Minimum Instances**: 1 (always warm, prevents cold starts)
- **Maximum Instances**: 20 (auto-scales based on load)
- **Scaling**: Automatic based on CPU/memory usage
- **Startup CPU Boost**: ENABLED (faster cold starts)

### **Networking & Security**
- **Ingress**: All traffic allowed
- **IAM**: Public access DISABLED (requires authentication)
- **Service Account**: `1001132689979-compute@developer.gserviceaccount.com`
- **Request Timeout**: 300 seconds (5 minutes)

### **Health Monitoring**
- **Startup Probe**: TCP check on port 8080
- **Probe Timeout**: 240 seconds
- **Failure Threshold**: 1 failure = instance restart
- **Probe Period**: 240 seconds between checks

---

## ENVIRONMENT VARIABLES

### **Current Production Configuration**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://htxsylxwvcbrazdowjys.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0eHN5bHh3dmNicmF6ZG93anlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgyMTEzNDEsImV4cCI6MjA3Mzc4NzM0MX0.hXgLEcCAmaQMgY6vkUlrT_-HKkU0hDlFgCIAyVev__E
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0eHN5bHh3dmNicmF6ZG93anlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxMTM0MSwiZXhwIjoyMDczNzg3MzQxfQ.DDB0D4h8359eJix-Yuy64Mf98VQngDyJpTGEbtH6GmA

# Google Gemini API
GEMINI_API_KEY=AIzaSyBnFcITNFm0i4hk9-u1xCbAd272fzfpJqs

# Application Configuration
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://scribblemachineweb.vercel.app/

# Development Control
PAUSE_WORKER=true  # Currently set for development testing
```

**⚠️ SECURITY NOTE**: These are production secrets. Changes should be made through secure methods only.

---

## MONOREPO COMPLEXITY EXPLANATION

### **Why This Setup Was Complex**

**Monorepo Structure Requirements**:
```
ColoringGenerator/                    # Root directory (build context)
├── package.json                      # Workspace root package.json
├── pnpm-lock.yaml                    # Workspace lock file
├── pnpm-workspace.yaml              # Workspace configuration
├── packages/                         # Shared packages
│   ├── types/
│   ├── database/
│   └── config/
└── services/
    └── worker/
        └── Dockerfile               # Dockerfile in subdirectory
```

**Key Challenge**: The Dockerfile needs access to root-level files (`package.json`, `pnpm-lock.yaml`, `packages/`) but is located in a subdirectory.

### **Image Name Confusion**

**The Problem**: Two different image naming schemes were in use:
- **GitHub Trigger Builds**: `gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:$COMMIT_SHA`
- **Cloud Run Service Used**: `gcr.io/scribblemachine/coloringpage-worker:latest`

**The Result**:
- GitHub pushes built new images with latest code
- Cloud Run continued using old images
- Environment variable changes and code updates were ignored

---

## DEPLOYMENT COMMANDS (UPDATED)

### **GitHub Integration (Semi-Automatic)**
```bash
# 1. Push code (triggers build automatically)
git push origin main

# 2. Wait for build to complete, then check build ID
gcloud builds list --limit=1

# 3. Manually update Cloud Run to use new image
gcloud run services update scribblemachine-worker \
  --region=europe-west1 \
  --image="gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:COMMIT_SHA"
```

### **Manual Build and Deploy**
```bash
# Build image with correct context
cd /path/to/ColoringGenerator
gcloud builds submit --tag=gcr.io/scribblemachine/coloringpage-worker:latest \
  --file=services/worker/Dockerfile .

# Deploy to Cloud Run
gcloud run deploy scribblemachine-worker \
  --image=gcr.io/scribblemachine/coloringpage-worker:latest \
  --region=europe-west1
```

### **Local Docker Build**
```bash
# Build locally (from project root)
docker build -f services/worker/Dockerfile -t gcr.io/scribblemachine/coloringpage-worker:latest .

# Push to registry
docker push gcr.io/scribblemachine/coloringpage-worker:latest

# Deploy to Cloud Run
gcloud run deploy scribblemachine-worker \
  --image=gcr.io/scribblemachine/coloringpage-worker:latest \
  --region=europe-west1
```

---

## OPERATIONAL PROCEDURES

### **Development Workflow with PAUSE_WORKER**

**For Local Development** (Recommended):
1. **Pause Cloud Run Worker**:
   - Go to Google Cloud Console > Cloud Run > scribblemachine-worker
   - Click "Edit & Deploy New Revision"
   - Add environment variable: `PAUSE_WORKER=true`
   - Click "Deploy"

2. **Start Local Development**:
   ```bash
   # Start both frontend and worker locally
   pnpm dev
   ```

3. **Resume Cloud Run Worker** (when done):
   - Go back to Cloud Console
   - Edit environment variables
   - Set `PAUSE_WORKER=false` or remove the variable
   - Click "Deploy"

**Verify Pause Status**:
```bash
# Check logs for pause message
gcloud run services logs read scribblemachine-worker --region=europe-west1 --limit=10

# Should show:
# ⏸️  WORKER PAUSED: PAUSE_WORKER=true detected
# ⏸️  [timestamp] Worker paused - health check active, no job processing
```

### **Monitoring & Troubleshooting**

**Check Service Status**:
```bash
# Service details
gcloud run services describe scribblemachine-worker --region=europe-west1

# Current image
gcloud run services describe scribblemachine-worker --region=europe-west1 \
  --format="value(spec.template.spec.containers[0].image)"

# Environment variables
gcloud run services describe scribblemachine-worker --region=europe-west1 \
  --format="table(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)"
```

**View Logs**:
```bash
# Real-time logs
gcloud run services logs read scribblemachine-worker --region=europe-west1 --follow

# Recent logs
gcloud run services logs read scribblemachine-worker --region=europe-west1 --limit=20
```

**Check Build Status**:
```bash
# Recent builds
gcloud builds list --limit=5

# Specific build details
gcloud builds describe BUILD_ID
```

---

## INTEGRATION ARCHITECTURE

### **Complete Flow**
1. **Frontend** (Vercel): User creates job → Supabase database
2. **Cloud Run Worker**: Polls database every 5 seconds (when not paused)
3. **Job Processing**: Worker picks up job → calls Gemini API
4. **Asset Storage**: Generated images saved to Supabase Storage
5. **Completion**: Job status updated → frontend polls for completion

### **Database Integration**
- **Polling Query**: `SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1`
- **Status Updates**: `queued` → `running` → `succeeded`/`failed`
- **Frequency**: Every 5 seconds (configurable)
- **Pause Behavior**: No database queries when `PAUSE_WORKER=true`

### **Storage Integration**
- **Original Images**: Supabase Storage bucket
- **Generated Assets**: Edge maps (PNG) and PDFs
- **Access**: Signed URLs for secure download

---

## TROUBLESHOOTING

### **Common Issues & Solutions**

**Issue: Worker Not Processing Jobs**
```bash
# 1. Check if worker is paused
gcloud run services describe scribblemachine-worker --region=europe-west1 \
  --format="value(spec.template.spec.containers[0].env[].name,spec.template.spec.containers[0].env[].value)" | grep PAUSE

# 2. Check recent logs
gcloud run services logs read scribblemachine-worker --region=europe-west1 --limit=20

# 3. Look for pause messages or errors
```

**Issue: Code Changes Not Reflected**
```bash
# 1. Check if latest image is being used
gcloud run services describe scribblemachine-worker --region=europe-west1 \
  --format="value(spec.template.spec.containers[0].image)"

# 2. Check recent builds
gcloud builds list --limit=3

# 3. Manually update to latest build
gcloud run services update scribblemachine-worker \
  --region=europe-west1 \
  --image="gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:LATEST_COMMIT_SHA"
```

**Issue: PAUSE_WORKER Not Working**
- **Symptom**: Not seeing pause messages in logs
- **Cause**: Using old container image without PAUSE_WORKER support
- **Solution**: Update to image with commit `2bd64c6` or later

### **Emergency Procedures**

**Immediate Stop** (for emergency):
```bash
# Scale down to 0 instances
gcloud run services update scribblemachine-worker --region=europe-west1 \
  --min-instances=0 --max-instances=0
```

**Emergency Recovery**:
```bash
# Scale back up
gcloud run services update scribblemachine-worker --region=europe-west1 \
  --min-instances=1 --max-instances=20

# Or use latest working image
gcloud run services update scribblemachine-worker \
  --region=europe-west1 \
  --image="gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:2bd64c60dcfa36c1224763b69ddbe17fe03f9d53"
```

---

## CONTAINER CONFIGURATION

### **Docker Image Details**
- **Current Image**: `gcr.io/scribblemachine/github.com/wayes-btye/scribblemachine:2bd64c60dcfa36c1224763b69ddbe17fe03f9d53`
- **Base**: Node.js 18 Alpine (lightweight Linux)
- **Entry Point**: `/app/dist/simple-worker.js`
- **Features**: PAUSE_WORKER support, improved logging, health checks

### **File Structure in Container**
```
/app/
├── dist/               # Compiled TypeScript
├── node_modules/       # Dependencies
├── package.json        # Package configuration
└── simple-worker.js    # Main entry point (polling worker)
```

### **Health Check Endpoint**
- **URL**: `/health`
- **Method**: GET
- **Response**: JSON health status
- **Purpose**: Cloud Run health monitoring

---

## COST ANALYSIS

### **Current Resource Costs** (Estimated)
- **Compute**: ~$15-25/month (1 min instance + scaling)
- **Container Registry**: ~$1-2/month (image storage)
- **Cloud Build**: ~$2-5/month (automated builds)
- **Networking**: ~$1-3/month (egress)
- **Total**: ~$19-35/month

### **API Costs** (Variable)
- **Gemini API**: Per generation (~$0.04-1.00 per image depending on complexity)
- **Supabase**: Included in project plan

---

## SECURITY CONSIDERATIONS

### **Access Control**
- **Service Account**: Limited permissions for Cloud Run execution
- **IAM**: Public access disabled, requires authentication
- **Secrets**: Environment variables stored securely in Cloud Run
- **Network**: HTTPS only, no HTTP traffic allowed

### **Best Practices Applied**
- ✅ Non-root container user
- ✅ Minimal Alpine Linux base image
- ✅ Environment variable injection (no hardcoded secrets)
- ✅ Health check endpoint for monitoring
- ✅ Request timeout limits
- ✅ Resource limits to prevent abuse
- ✅ PAUSE_WORKER mechanism for safe development

---

## KEY LEARNINGS & SOLUTIONS

### **Major Issues Resolved**

**1. Broken GitHub Integration**
- **Problem**: GitHub trigger built images but didn't deploy them
- **Symptom**: Code changes not reflected in running service
- **Solution**: Manual service updates or fix trigger deployment step

**2. Image Name Mismatch**
- **Problem**: Different naming schemes between trigger and service
- **Symptom**: Old code running despite successful builds
- **Solution**: Standardize on one image naming scheme

**3. Environment Variable Persistence**
- **Problem**: Manual env var changes got wiped by deployments
- **Symptom**: PAUSE_WORKER not working after deployments
- **Solution**: Include PAUSE_WORKER in service default configuration

### **Current Best Practices**

**For Development**:
1. Use `PAUSE_WORKER=true` to pause Cloud Run worker
2. Run `pnpm dev` for local full-stack development
3. Test thoroughly before resuming Cloud Run worker

**For Deployment**:
1. Push code to trigger build
2. Check build completion: `gcloud builds list --limit=1`
3. Update service to use new image manually
4. Verify deployment with logs and health check

**For Monitoring**:
1. Check logs regularly for errors
2. Monitor pause status when developing locally
3. Verify correct image is deployed after updates

---

## CONCLUSION

**Current Status**: ✅ FUNCTIONAL with manual deployment step required

**Key Success Factors**:
- **PAUSE_WORKER Feature**: Enables safe local development
- **Image Tracking**: Can identify and use correct container images
- **Monorepo Support**: Proper build context for workspace structure
- **Health Monitoring**: Comprehensive logging and error detection

**Outstanding Issues**:
- **Semi-Manual Deployment**: GitHub builds automatically, deployment requires manual step
- **Image Name Inconsistency**: Two naming schemes still exist

**Recommended Next Steps**:
1. Fix GitHub trigger to include deployment step
2. Standardize on single image naming scheme
3. Consider setting up Cloud Build notifications for deployment status

This setup provides a solid foundation for production operation with proper pause functionality for development, though it requires manual deployment steps after code pushes.