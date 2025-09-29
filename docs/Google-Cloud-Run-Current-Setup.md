# Google Cloud Run Current Setup Documentation

## Executive Summary
This document provides comprehensive documentation of the current Google Cloud Run deployment for the ColoringGenerator worker service, including service configuration and operational procedures.

**✅ CURRENT STATUS**: Service is WORKING in production with manual deployment process (September 29, 2025)

**📋 RECENT CHANGES (Sept 29, 2025)**:
- **Issue Resolved**: Cloud Build context problem that caused all automated deployments to fail
- **Root Cause**: Auto-generated GitHub trigger used wrong build context (`services/worker/` instead of `.`)
- **Solution**: Removed broken trigger, documented working manual deployment process
- **Result**: Service successfully deployed and operational, manual builds work perfectly

**⚠️ IMPORTANT**: GitHub auto-deployment is currently DISABLED - use manual deployment commands below.

---

## CURRENT PRODUCTION SETUP

### **Service Overview**
- **Service Name**: `scribblemachine-worker`
- **Project ID**: `scribblemachine` (project number: 1001132689979)
- **Region**: `europe-west1`
- **Status**: ACTIVE and PROCESSING JOBS
- **Architecture**: Polling-based worker with 5-second intervals

### **Service URLs**
- **Primary**: https://scribblemachine-worker-1001132689979.europe-west1.run.app
- **Alternative**: https://scribblemachine-worker-r46ra5mcea-ew.a.run.app
- **Health Check**: `curl https://scribblemachine-worker-1001132689979.europe-west1.run.app/health`

---

## GITHUB INTEGRATION (MANUAL DEPLOY REQUIRED)

### **Automatic Deployment Setup**
⚠️ **CURRENT STATUS**: GitHub trigger REMOVED due to build context issues (resolved September 29, 2025)

**Repository Configuration**:
- **GitHub Repository**: `wayes-btye/scribblemachine`
- **Branch**: `main` (manual deploy required)
- **Previous Trigger**: `b605fbb4-db8a-4c29-af7f-17a222d24730` (DELETED - had wrong build context)
- **Status**: Manual deployment only (see deployment commands below)

### **Current Deployment Workflow (MANUAL)**
1. **Code Push**: Push to `main` branch in GitHub (no automatic trigger)
2. **Manual Build**: Run `gcloud builds submit --config cloudbuild.yaml .`
3. **Docker Build**: Uses `/cloudbuild.yaml` configuration with correct root context
4. **Image Push**: Pushes to `gcr.io/scribblemachine/coloringpage-worker:latest`
5. **Cloud Run Deploy**: Automatically updates the running service
6. **Health Check**: Verifies deployment success

### **Working Build Configuration**
Location: `/cloudbuild.yaml` (in repository root)
```yaml
# ✅ VERIFIED WORKING CONFIGURATION (September 29, 2025)
# This builds from repository root context (86.1 MiB), includes all workspace files
# Build Context: . (root directory, NOT services/worker/)
# Dockerfile: services/worker/Dockerfile
# Result: Successfully finds pnpm-lock.yaml, pnpm-workspace.yaml, package.json
```

### **Deployment Commands**
```bash
# ✅ WORKING - Use this for deployments:
gcloud builds submit --config cloudbuild.yaml .

# ✅ Alternative - Direct Cloud Run deployment:
# (First build image locally, then deploy)
```

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
NEXT_PUBLIC_APP_URL=https://scribblemachineweb-j79phs50k-wayes-btyes-projects.vercel.app
```

**⚠️ SECURITY NOTE**: These are production secrets. Changes should be made through secure methods only.

---

## CONTAINER CONFIGURATION

### **Docker Image**
- **Registry**: Google Container Registry (GCR)
- **Image**: `gcr.io/scribblemachine/coloringpage-worker:latest`
- **Base**: Node.js 18 Alpine (lightweight Linux)
- **Entry Point**: `/app/dist/simple-worker.js` (polling architecture)

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
- **Purpose**: Cloud Run health monitoring and load balancer checks

---

## OPERATIONAL PROCEDURES

### **Viewing Service Status**
```bash
# Check service status
gcloud run services describe scribblemachine-worker --region=europe-west1

# View recent logs
gcloud logs tail "resource.type=cloud_run_revision" \
  --filter="resource.labels.service_name=scribblemachine-worker"

# Check recent deployments
gcloud run revisions list --service=scribblemachine-worker --region=europe-west1
```

### **Monitoring Performance**
```bash
# Real-time log monitoring
gcloud logs tail "resource.type=cloud_run_revision" \
  --filter="resource.labels.service_name=scribblemachine-worker"

# Check metrics in Cloud Console
# Navigate to: Cloud Run → scribblemachine-worker → Metrics
```

### **Temporary Service Control**

**Pause Service** (stops processing, no new instances):
```bash
gcloud run services update scribblemachine-worker \
  --region=europe-west1 \
  --min-instances=0 \
  --max-instances=0
```

**Resume Service** (restore normal operation):
```bash
gcloud run services update scribblemachine-worker \
  --region=europe-west1 \
  --min-instances=1 \
  --max-instances=20
```

**Scale Up** (for high load):
```bash
gcloud run services update scribblemachine-worker \
  --region=europe-west1 \
  --min-instances=2 \
  --max-instances=50
```

---

## INTEGRATION ARCHITECTURE

### **Complete Flow**
1. **Frontend** (Vercel): User creates job → Supabase database
2. **Cloud Run Worker**: Polls database every 5 seconds
3. **Job Processing**: Worker picks up job → calls Gemini API
4. **Asset Storage**: Generated images saved to Supabase Storage
5. **Completion**: Job status updated → frontend polls for completion

### **Database Integration**
- **Polling Query**: `SELECT * FROM jobs WHERE status = 'queued' ORDER BY created_at ASC LIMIT 1`
- **Status Updates**: `queued` → `running` → `succeeded`/`failed`
- **Frequency**: Every 5 seconds (configurable)

### **Storage Integration**
- **Original Images**: Supabase Storage bucket
- **Generated Assets**: Edge maps (PNG) and PDFs
- **Access**: Signed URLs for secure download

---

## TROUBLESHOOTING

### **Common Issues**

**Worker Not Processing Jobs**:
```bash
# Check if service is running
gcloud run services describe scribblemachine-worker --region=europe-west1

# Check recent logs for errors
gcloud logs read "resource.type=cloud_run_revision" \
  --filter="resource.labels.service_name=scribblemachine-worker" \
  --limit=20
```

**High Processing Times**:
```bash
# Check instance utilization
gcloud logging read "resource.type=cloud_run_revision" \
  --filter="resource.labels.service_name=scribblemachine-worker AND textPayload:processing" \
  --limit=10
```

**Deployment Issues**:
```bash
# Check Cloud Build status
gcloud builds list --limit=5

# Check trigger status (NONE - manual deployment only)
gcloud builds triggers list
# Should return: "Listed 0 items."

# Manual deployment (if automated fails):
gcloud builds submit --config cloudbuild.yaml .
```

### **Emergency Procedures**

**Immediate Rollback** (if service broken):
```bash
# Option 1: Pause Cloud Run, use local worker
gcloud run services update scribblemachine-worker \
  --min-instances=0 --max-instances=0

# Option 2: Deploy previous revision
gcloud run services update-traffic scribblemachine-worker \
  --to-revisions=PREVIOUS_REVISION=100 \
  --region=europe-west1
```

**Service Recovery**:
```bash
# Restart all instances
gcloud run services replace-traffic scribblemachine-worker \
  --to-latest \
  --region=europe-west1
```

---

## COST ANALYSIS

### **Current Resource Costs** (Estimated)
- **Compute**: ~$15-25/month (1 min instance + scaling)
- **Container Registry**: ~$1-2/month (image storage)
- **Cloud Build**: ~$2-5/month (automated builds)
- **Networking**: ~$1-3/month (egress)
- **Total**: ~$19-35/month

### **API Costs** (Variable)
- **Gemini API**: Per generation (currently ~4-100 cents/image - investigating variance)
- **Supabase**: Included in project plan

---

## BACKUP & RECOVERY

### **Container Image Backup**
Images are stored in GCR with automatic versioning:
```bash
# List all image versions
gcloud container images list-tags gcr.io/scribblemachine/coloringpage-worker

# Export image (if needed)
docker pull gcr.io/scribblemachine/coloringpage-worker:latest
docker save gcr.io/scribblemachine/coloringpage-worker:latest > backup.tar
```

### **Configuration Backup**
Current service configuration is backed up in this document. To recreate:
```bash
# Export current configuration
gcloud run services describe scribblemachine-worker \
  --region=europe-west1 \
  --format="export" > service-backup.yaml

# Restore from backup (if needed)
gcloud run services replace service-backup.yaml \
  --region=europe-west1
```

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

---

## MAINTENANCE SCHEDULE

### **Regular Maintenance**
- **Weekly**: Check logs for errors or performance issues
- **Monthly**: Review resource utilization and costs
- **Quarterly**: Update base image and dependencies

### **Monitoring Alerts** (Recommended Setup)
- Job processing failures > 5%
- Response time > 30 seconds
- Memory usage > 80%
- CPU usage > 70%
- Error rate > 1%

---

## CONCLUSION

**Current Status**: ✅ FULLY OPERATIONAL
- Google Cloud Run service is deployed and processing jobs
- GitHub integration is active with automatic deployments
- Service is stable with proper resource allocation
- Performance monitoring is available through Cloud Console

**Key Success Factors**:
- Preserved polling architecture (proven reliable)
- Automatic GitHub deployment (developer-friendly)
- Proper scaling configuration (cost-effective)
- Health monitoring (operational visibility)

**Areas for Optimization**:
- Performance investigation (processing time variance)
- Cost monitoring (Gemini API usage patterns)
- Alert configuration (proactive monitoring)

This setup provides a solid foundation for production operation while maintaining the flexibility to optimize and scale as needed.