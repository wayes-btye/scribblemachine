# Google Cloud Run Migration Strategy LE

**NOTE** This is legacy plan, new plan is in `Google-Cloud-Run-Migration-Plan.md`

## 🎯 **The Big Picture**

**Current Situation:** Your app works perfectly locally with a worker that polls the database every 5 seconds. But in production, you need the worker to run on Google Cloud Run, which means it can't poll the database continuously.

**The Challenge:** We need to change from "worker polls database" to "API route calls worker" without breaking your local development workflow.

**The Solution:** Make your system smart enough to work both ways - polling locally, HTTP calls in production.

## 📊 **Current vs Target Architecture**

### **Current State (Local Development)**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Worker        │
│   (Next.js)     │───▶│   (Vercel)      │───▶│   (Local)       │
│   Port 3000     │    │   Port 3000     │    │   Port 3001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                           │
│              (Shared by all services)                          │
└─────────────────────────────────────────────────────────────────┘
```

### **Target State (Production)**
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   API Routes    │    │   Worker        │
│   (Vercel)      │───▶│   (Vercel)      │───▶│   (Cloud Run)   │
│   Port 3000     │    │   Port 3000     │    │   Port 3001     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Supabase Database                           │
│              (Shared by all services)                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🌳 **Current Code Structure**
```
ColoringGenerator/
├── apps/web/                    ← Frontend + API Routes
│   ├── app/api/                 ← API Routes (Vercel)
│   │   ├── jobs/route.ts        ← Creates jobs in DB
│   │   ├── credits/route.ts     ← User credit management
│   │   └── upload/route.ts      ← File upload handling
│   └── components/              ← React components
├── services/worker/             ← Background Worker
│   ├── src/
│   │   ├── simple-worker.ts     ← Main worker logic
│   │   ├── generate/index.ts    ← Job processing
│   │   └── services/            ← Gemini, PDF services
│   └── package.json             ← Worker dependencies
└── packages/                    ← Shared packages
    ├── types/                   ← TypeScript interfaces
    ├── config/                  ← Environment config
    └── database/                ← Supabase client
```

## 🔄 **Current vs New Flow**

### **Current Flow (Local Development)**
1. **Frontend** → User uploads image
2. **API Route** → Creates job in database (`status: 'queued'`)
3. **Worker** → Polls database for queued jobs
4. **Worker** → Processes job (image generation, PDF creation)
5. **Worker** → Updates database (`status: 'succeeded'` or `'failed'`)
6. **Frontend** → Polls database for job status updates

### **New Flow (Production)**
1. **Frontend** → User uploads image
2. **API Route** → Creates job in database (`status: 'queued'`)
3. **API Route** → Calls worker service via HTTP
4. **Worker** → Processes job (image generation, PDF creation)
5. **Worker** → Updates database (`status: 'succeeded'` or `'failed'`)
6. **Frontend** → Polls database for job status updates

## 🔗 **Critical Integration Point: Environment Variable**

**The Key Connection:** The only thing connecting your Vercel frontend to your Google Cloud Run worker is a single environment variable.

### **Environment Variable Details**
- **Variable Name:** `WORKER_SERVICE_URL`
- **Purpose:** Tells your API routes where to find the worker service
- **Format:** `https://your-worker-service-abc123-uc.a.run.app`

### **How It Works**
1. **API route creates job** in database
2. **API route reads** `WORKER_SERVICE_URL` from environment
3. **API route makes HTTP call** to worker using that URL
4. **Worker processes job** and updates database

### **Environment Variable Setup**
```bash
# Local Development (.env.local)
WORKER_SERVICE_URL=http://localhost:3001

# Production (Vercel Dashboard)
WORKER_SERVICE_URL=https://scribblemachine-worker-abc123-uc.a.run.app
```

**⚠️ Critical:** If this environment variable is wrong or missing, your frontend and backend won't communicate!

## 🚨 **Critical Risk Areas**

### **1. Environment Variable Mismatch**
**Risk:** Wrong worker URL or missing environment variable
**Impact:** Complete system failure - jobs won't process
**Mitigation:** Test environment variables in both local and production

### **2. Breaking Local Development**
**Risk:** Changes might break your current local workflow
**Mitigation:** Implement dual-mode system that detects environment

### **3. Worker Service Communication**
**Risk:** API route can't reach worker service
**Mitigation:** Test HTTP communication thoroughly before production

### **4. Database Connection Issues**
**Risk:** Worker can't connect to Supabase from Cloud Run
**Mitigation:** Test database connectivity in Docker environment

## 📋 **Step-by-Step Implementation Plan**

### **Phase 1: Prepare Worker for HTTP Mode (LOCAL TESTING)**

**Goal:** Make your worker accept HTTP requests instead of just polling

**What to Change:**
1. **Create HTTP server wrapper** around your existing worker logic
2. **Add Express.js** to handle HTTP requests
3. **Modify worker entry point** to detect environment

**Files to Modify:**
- `services/worker/package.json` - Add Express dependency
- `services/worker/src/server.ts` - New HTTP server file
- `services/worker/src/index.ts` - New entry point that chooses mode

**Testing:** Start worker locally and test HTTP endpoint with curl

### **Phase 2: Make API Routes Call Worker (LOCAL TESTING)**

**Goal:** Make your API routes call the worker via HTTP instead of relying on polling

**What to Change:**
1. **Add worker URL configuration** to your config package
2. **Modify jobs API route** to call worker after creating job
3. **Add environment detection** to choose between polling and HTTP

**Files to Modify:**
- `packages/config/src/index.ts` - Add worker configuration
- `apps/web/app/api/jobs/route.ts` - Add HTTP call to worker

**Testing:** Test complete flow locally with HTTP mode

### **Phase 3: Dockerize Worker (LOCAL TESTING)**

**Goal:** Package your worker so it can run in Google Cloud Run

**What to Change:**
1. **Create Dockerfile** for worker service
2. **Add build scripts** for production
3. **Test Docker container** locally

**Files to Create:**
- `services/worker/Dockerfile` - Docker configuration
- Update `services/worker/package.json` - Add build scripts

**Testing:** Build and run Docker container locally

**Dockerfile Example:**
```dockerfile
# services/worker/Dockerfile
FROM node:18-alpine
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 3001

# Start the service
CMD ["npm", "start"]
```

**Package.json Scripts:**
```json
{
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "start": "node dist/index.js",
    "build": "tsc"
  }
}
```

### **Phase 4: Deploy Worker to Google Cloud Run (PRODUCTION)**

**Goal:** Get your worker running in the cloud

**What to Do:**
1. **Deploy worker** using gcloud CLI
2. **Get worker URL** from Google Cloud
3. **Test worker endpoint** from your local machine

**Commands:**
```bash
cd services/worker
gcloud run deploy scribblemachine-worker --source . --platform managed --region us-central1 --allow-unauthenticated --port 3001
```

**Testing:** Call worker URL from your local machine to verify it works

### **Phase 5: Update Vercel Configuration (PRODUCTION)**

**Goal:** Tell your Vercel app where to find the worker

**What to Do:**
1. **Add worker URL** to Vercel environment variables
2. **Deploy frontend** to Vercel
3. **Test complete flow** in production

**Environment Variable to Add:**
```
WORKER_SERVICE_URL=https://your-worker-abc123-uc.a.run.app
```

**Testing:** Upload image in production and verify job processing

**Critical Test:** Verify environment variable is working
```bash
# Test worker URL from your local machine
curl -X POST https://your-worker-abc123-uc.a.run.app/process-job \
  -H "Content-Type: application/json" \
  -d '{"jobId": "test-job-id"}'
```

**Expected Response:** `{"success": true}` or error message

## 🔧 **Key Code Changes Required**

### **1. Worker Service Changes**

**Current Behavior:** Worker runs in a loop, checking database every 5 seconds
**New Behavior:** Worker waits for HTTP requests, processes job when called

**Main Changes:**
- Add Express.js server to handle HTTP requests
- Create endpoint that receives job ID and processes it
- Keep existing job processing logic unchanged

**Code Example - Current Worker:**
```typescript
// services/worker/src/simple-worker.ts
while (true) {
  const jobs = await supabase
    .from('jobs')
    .select('*')
    .eq('status', 'queued')
    .limit(1);
  
  if (jobs.data?.length > 0) {
    await processJob(jobs.data[0]);
  }
  
  await sleep(5000); // Poll every 5 seconds
}
```

**Code Example - New Worker:**
```typescript
// services/worker/src/server.ts
import express from 'express';
import { processJob } from './simple-worker';

const app = express();
app.use(express.json());

app.post('/process-job', async (req, res) => {
  const { jobId } = req.body;
  try {
    await processJob(jobId);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3001, () => {
  console.log('Worker service running on port 3001');
});
```

### **2. API Route Changes**

**Current Behavior:** API route creates job in database, worker picks it up later
**New Behavior:** API route creates job AND immediately calls worker

**Main Changes:**
- Add HTTP call to worker after creating job
- Add error handling for worker communication failures
- Keep existing job creation logic unchanged

**Code Example - Current API Route:**
```typescript
// apps/web/app/api/jobs/route.ts
const { data: job } = await supabase
  .from('jobs')
  .insert({
    id: jobId,
    user_id: user.id,
    status: 'queued',
    params_json: jobParams,
  });

// Worker will pick this up via polling
```

**Code Example - New API Route:**
```typescript
// apps/web/app/api/jobs/route.ts
const { data: job } = await supabase
  .from('jobs')
  .insert({
    id: jobId,
    user_id: user.id,
    status: 'queued',
    params_json: jobParams,
  });

// Call worker service immediately
const workerResponse = await fetch(`${process.env.WORKER_SERVICE_URL}/process-job`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ jobId: job.id })
});
```

### **3. Configuration Changes**

**Current Behavior:** No worker configuration needed
**New Behavior:** Need to know worker URL and mode

**Main Changes:**
- Add worker configuration to config package
- Add environment detection logic
- Add worker URL environment variable

**Code Example - Config Package:**
```typescript
// packages/config/src/index.ts
export const config = {
  worker: {
    mode: process.env.NODE_ENV === 'production' ? 'http' : 'polling',
    url: process.env.WORKER_SERVICE_URL || 'http://localhost:3001',
  }
};
```

## 🧪 **Testing Strategy**

### **Local Development Testing**
1. **Test HTTP mode locally** - Make sure worker responds to HTTP calls
2. **Test complete flow** - Upload image, verify job processing
3. **Test Docker container** - Make sure it works the same way

### **Production Testing**
1. **Test worker deployment** - Verify worker responds from Cloud Run
2. **Test API communication** - Verify Vercel can reach worker
3. **Test complete flow** - Upload image in production, verify processing

### **Rollback Plan**
- Keep polling mode as fallback
- Can switch back to polling if HTTP mode fails
- Database remains the same, so no data loss

## 📊 **Success Criteria**

### **Local Development**
- ✅ Worker starts in HTTP mode
- ✅ API routes call worker successfully
- ✅ Complete image generation flow works
- ✅ Docker container runs locally

### **Production**
- ✅ Worker deployed to Google Cloud Run
- ✅ Vercel can communicate with worker
- ✅ Complete image generation flow works
- ✅ No performance degradation

## 🚨 **Common Pitfalls to Avoid**

### **1. Environment Variable Mismatches**
- Make sure worker URL is correct in Vercel
- Test with actual URLs, not localhost

### **2. Network Connectivity Issues**
- Test worker URL from Vercel environment
- Check firewall and security settings

### **3. Database Connection Problems**
- Verify Supabase credentials work in Cloud Run
- Test database connectivity from Docker container

### **4. Cold Start Delays**
- Worker might take time to start on first request
- Consider implementing health checks

## 📝 **Implementation Order**

1. **Start with HTTP server** - Get worker accepting HTTP requests locally
2. **Test API communication** - Make sure frontend can call worker
3. **Dockerize and test** - Package worker and test locally
4. **Deploy to Cloud Run** - Get worker running in production
5. **Update Vercel** - Connect frontend to production worker
6. **Test everything** - Verify complete flow works end-to-end

## 🎯 **Why This Approach Works**

- **Minimal code changes** - Most of your existing logic stays the same
- **Backward compatible** - Local development still works
- **Gradual migration** - Test each step before moving to next
- **Easy rollback** - Can switch back to polling if needed
- **Same database** - No data migration required

---

**This plan focuses on the strategic changes needed while keeping technical details minimal. The AI agent can dive into specific implementation details for each phase.**
