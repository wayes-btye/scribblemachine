# Backend API Implementation Requirements

## Overview
This document provides detailed technical specifications for implementing the production Gemini API service, extracted from Phase 1 testing and validation.

**Status**: Ready for immediate implementation
**Estimated Time**: 3-4 hours
**Priority**: High - Implement before Phase 2

---

## 📁 File Structure

```
services/worker/src/
├── services/
│   ├── gemini-service.ts          # Core Gemini API service
│   └── index.ts                   # Service exports
├── workers/
│   ├── generation-worker.ts       # Job processor
│   └── index.ts                   # Worker exports
├── types/
│   └── gemini.ts                  # Gemini-specific types
└── utils/
    ├── retry.ts                   # Retry logic utilities
    └── monitoring.ts              # Performance monitoring
```

---

## 🎯 Core Gemini Service

### File: `services/worker/src/services/gemini-service.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

// Configuration interface
export interface GeminiServiceConfig {
  model: 'gemini-2.5-flash-image-preview';
  apiKey: string;
  maxRetries: 3;
  retryDelayMs: 1000;
  timeoutMs: 30000;
}

// Request interface
export interface GenerationRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png';
  promptType: 'simple' | 'detailed' | 'cartoon';
  customPrompt?: string;
}

// Response interface
export interface GenerationResult {
  success: boolean;
  imageBase64?: string;
  error?: GeminiError;
  metadata: {
    responseTimeMs: number;
    retryCount: number;
    cost: number; // $0.039 per generation
    promptUsed: string;
  };
}

// Error categorization
export enum GeminiErrorType {
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  TEMPORARY_FAILURE = 'TEMPORARY_FAILURE',
  INVALID_INPUT = 'INVALID_INPUT',
  MODEL_ERROR = 'MODEL_ERROR'
}

export interface GeminiError {
  type: GeminiErrorType;
  message: string;
  retryable: boolean;
  retryAfterMs?: number;
}

// Main service class
export class GeminiService {
  private client: GoogleGenerativeAI;
  private model: any;
  private config: GeminiServiceConfig;

  constructor(config: GeminiServiceConfig) {
    this.config = config;
    this.client = new GoogleGenerativeAI(config.apiKey);
    this.model = this.client.getGenerativeModel({ model: config.model });
  }

  async generateColoring(request: GenerationRequest): Promise<GenerationResult> {
    // Implementation with retry logic
  }

  private buildPrompt(promptType: string, customPrompt?: string): string {
    // Extract validated prompts from test-gemini-single-image.ts (cost-effective)
    // For comprehensive prompt matrix, see test-gemini-image-generation.ts (18 API calls)
  }

  private categorizeError(error: any): GeminiError {
    // Categorize errors based on Phase 1 findings
  }

  private async retryWithBackoff<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    // Exponential backoff: 1s, 2s, 4s
  }
}
```

### Prompt Templates (from Phase 1 validation)

```typescript
const PROMPT_TEMPLATES = {
  simple: `Transform this image into a simple coloring page for children ages 4-8. Create clean, bold black outlines on a white background. Remove all colors, shading, and textures. Simplify complex details into basic shapes that are easy for small children to color within. The lines should be thick (2-3px) and the shapes should be large enough for crayons. Make it a fun, cartoon-like version suitable for coloring books.`,

  detailed: `Convert this photograph into a detailed black and white line art coloring page. Create precise black outlines that capture the main features and important details. Remove all colors and convert to clean line drawings on white background. The result should look like professional coloring book artwork - black outlines only, no shading or fills. Suitable for children ages 8-12 who can handle more detailed coloring.`,

  cartoon: `Transform this photo into a fun cartoon-style coloring page. Simplify the image into bold, playful cartoon shapes with thick black outlines on white background. Make facial features exaggerated and friendly. Remove all colors and shading. The style should be similar to children's animated movies - simple, bold, and engaging for kids to color.`
};
```

---

## 🔄 Job Processor Integration

### File: `services/worker/src/workers/generation-worker.ts`

```typescript
import PgBoss from 'pg-boss';
import { GeminiService } from '../services/gemini-service.js';

export interface GenerationJob {
  id: string;
  userId: string;
  imageUrl: string; // Supabase storage URL
  promptType: 'simple' | 'detailed' | 'cartoon';
  customPrompt?: string;
}

export interface JobResult {
  jobId: string;
  success: boolean;
  outputImageUrl?: string; // Supabase storage URL
  error?: string;
  metadata: {
    processingTimeMs: number;
    cost: number;
    retryCount: number;
  };
}

export class GenerationWorker {
  private geminiService: GeminiService;
  private pgBoss: PgBoss;

  constructor(geminiService: GeminiService, pgBoss: PgBoss) {
    this.geminiService = geminiService;
    this.pgBoss = pgBoss;
  }

  async start() {
    await this.pgBoss.work('generate-coloring', this.processJob.bind(this));
  }

  private async processJob(job: PgBoss.Job<GenerationJob>): Promise<void> {
    // 1. Download image from Supabase storage
    // 2. Convert to base64
    // 3. Call Gemini service
    // 4. Upload result to Supabase storage
    // 5. Update job status with metadata
  }

  private async downloadImage(url: string): Promise<{data: string, mimeType: string}> {
    // Download and convert to base64
  }

  private async uploadResult(imageBase64: string, jobId: string): Promise<string> {
    // Upload to Supabase storage and return URL
  }
}
```

---

## 📊 Error Handling Strategy

### Based on Phase 1 Testing

```typescript
// Error categorization from actual API responses
const ERROR_PATTERNS = {
  QUOTA_EXCEEDED: [
    'exceeded your current quota',
    'quota exceeded for metric',
    'rate limit exceeded'
  ],
  TEMPORARY_FAILURE: [
    'network error',
    'timeout',
    'temporary unavailable',
    'service unavailable'
  ],
  INVALID_INPUT: [
    'invalid image format',
    'image too large',
    'unsupported mime type'
  ],
  MODEL_ERROR: [
    'model error',
    'generation failed',
    'content policy violation'
  ]
};

// Retry strategy
const RETRY_CONFIG = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelayMs: 1000,
  maxDelayMs: 8000,
  retryableErrors: [GeminiErrorType.TEMPORARY_FAILURE]
};
```

---

## 🧪 Testing Requirements

### Unit Tests: `services/worker/src/__tests__/gemini-service.test.ts`

```typescript
describe('GeminiService', () => {
  test('successful generation returns expected format');
  test('quota exceeded error is categorized correctly');
  test('temporary failure triggers retry with backoff');
  test('invalid input fails fast without retry');
  test('cost calculation is accurate ($0.039 per generation)');
  test('retry count is tracked correctly');
  test('response time is measured accurately');
});
```

### Integration Tests: `services/worker/src/__tests__/generation-worker.test.ts`

```typescript
describe('GenerationWorker', () => {
  test('processes job end-to-end successfully');
  test('handles Gemini service failures gracefully');
  test('updates job status with correct metadata');
  test('uploads result to correct Supabase location');
  test('tracks cost and performance metrics');
});
```

---

## 📈 Monitoring & Metrics

### Key Metrics to Track

```typescript
interface GenerationMetrics {
  totalRequests: number;
  successfulGenerations: number;
  failedGenerations: number;
  averageResponseTimeMs: number;
  totalCost: number;
  errorsByType: Record<GeminiErrorType, number>;
  queueDepth: number;
  processingTimeMs: number;
}
```

### Logging Strategy

```typescript
// Use structured logging for monitoring
const logger = {
  info: (message: string, metadata?: object) => void,
  warn: (message: string, metadata?: object) => void,
  error: (message: string, error: Error, metadata?: object) => void,
};

// Example usage
logger.info('Generation started', {
  jobId, userId, promptType, imageSize
});

logger.error('Generation failed', error, {
  jobId, errorType, retryCount, responseTime
});
```

---

## 🔧 Configuration Management

### Environment Variables

```bash
# services/worker/.env
GEMINI_API_KEY=your_api_key_here
GEMINI_MODEL=gemini-2.5-flash-image-preview
GEMINI_MAX_RETRIES=3
GEMINI_RETRY_DELAY_MS=1000
GEMINI_TIMEOUT_MS=30000

# Cost tracking
GEMINI_COST_PER_GENERATION=0.039

# Monitoring
ENABLE_PERFORMANCE_METRICS=true
LOG_LEVEL=info
```

---

## 🚀 Implementation Checklist

### Step 1: Core Service (1-2 hours)
- [ ] Create `services/gemini-service.ts` with interfaces
- [ ] Extract working code from `test-gemini-single-image.ts` (cost-effective reference)
- [ ] Implement retry logic with exponential backoff
- [ ] Add error categorization based on Phase 1 patterns
- [ ] Include cost and performance tracking
- [ ] Add comprehensive logging

### Step 2: Job Integration (1 hour)
- [ ] Create `workers/generation-worker.ts`
- [ ] Integrate with pg-boss job queue
- [ ] Add job state management
- [ ] Implement Supabase storage integration
- [ ] Add metadata tracking

### Step 3: Testing (30 minutes)
- [ ] Unit tests for error handling scenarios
- [ ] Integration tests for job processing
- [ ] Performance benchmarking
- [ ] Error scenario validation

### Step 4: Documentation (15 minutes)
- [ ] API service documentation
- [ ] Error handling guide
- [ ] Monitoring setup instructions
- [ ] Deployment checklist

---

## 📝 Success Criteria

✅ **Production-ready Gemini service** with proper error handling
✅ **Job processor** handling async generation
✅ **Comprehensive test coverage** (>80%)
✅ **Performance metrics** and monitoring
✅ **Cost tracking** per generation
✅ **Ready for frontend integration**

**Status**: All requirements documented and ready for implementation
**Next Step**: Begin implementation in next chat session