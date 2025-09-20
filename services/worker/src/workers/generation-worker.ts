import PgBoss from 'pg-boss';
import { createClient } from '@supabase/supabase-js';
import { createGeminiService, GenerationRequest as GeminiRequest } from '../services/gemini-service';
import { Job, JobParams, Asset, JobStatus } from '@coloringpage/types';

// Job types for pg-boss
export interface GenerationJobData {
  jobId: string;
  userId: string;
  assetId: string;
  params: JobParams;
}

export interface GenerationJobResult {
  success: boolean;
  generatedAssetId?: string;
  error?: string;
  metadata: {
    responseTimeMs: number;
    cost: number;
    model: string;
  };
}

// Configuration interface
export interface GenerationWorkerConfig {
  databaseUrl: string;
  supabaseUrl: string;
  supabaseServiceKey: string;
  geminiApiKey: string;
  maxConcurrency?: number;
  pollIntervalMs?: number;
}

export class GenerationWorker {
  private boss: PgBoss;
  private supabase: ReturnType<typeof createClient>;
  private geminiService: ReturnType<typeof createGeminiService>;
  private config: GenerationWorkerConfig;
  private isRunning = false;

  constructor(config: GenerationWorkerConfig) {
    this.config = {
      maxConcurrency: 3, // Process up to 3 jobs concurrently
      pollIntervalMs: 2000, // Poll every 2 seconds
      ...config
    };

    // Initialize pg-boss
    this.boss = new PgBoss({
      connectionString: config.databaseUrl,
      retryLimit: 2, // Architecture specifies max 2 retries
      retryBackoff: true,
      retryDelay: 1000, // 1 second base delay
      expireInHours: 1, // Jobs expire in 1 hour (as per architecture)
      newJobCheckInterval: this.config.pollIntervalMs,
      archiveCompletedAfterSeconds: 24 * 60 * 60 // Archive after 24 hours
    });

    // Initialize Supabase client with service role
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Initialize Gemini service
    this.geminiService = createGeminiService(config.geminiApiKey);
  }

  /**
   * Start the worker
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Worker is already running');
    }

    try {
      await this.boss.start();
      this.isRunning = true;

      // Register the generation job handler
      await this.boss.work(
        'generate-coloring-page',
        { teamSize: this.config.maxConcurrency },
        this.handleGenerationJob.bind(this)
      );

      console.log('🚀 Generation worker started successfully');
      console.log(`   Max concurrency: ${this.config.maxConcurrency}`);
      console.log(`   Poll interval: ${this.config.pollIntervalMs}ms`);

    } catch (error) {
      console.error('❌ Failed to start generation worker:', error);
      throw error;
    }
  }

  /**
   * Stop the worker gracefully
   */
  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      await this.boss.stop();
      this.isRunning = false;
      console.log('✅ Generation worker stopped gracefully');
    } catch (error) {
      console.error('❌ Error stopping generation worker:', error);
      throw error;
    }
  }

  /**
   * Add a generation job to the queue
   */
  async enqueueJob(jobData: GenerationJobData): Promise<string> {
    try {
      // Create idempotency key to prevent duplicate jobs
      const idempotencyKey = `${jobData.userId}-${jobData.assetId}-${JSON.stringify(jobData.params)}`;

      const jobId = await this.boss.send('generate-coloring-page', jobData, {
        singletonKey: idempotencyKey, // Prevents duplicate jobs
        expireInHours: 1,
        retryLimit: 2,
        retryBackoff: true,
        retryDelay: 1000
      });

      console.log(`📋 Enqueued generation job: ${jobId} for user ${jobData.userId}`);
      return jobId || '';

    } catch (error) {
      console.error('❌ Failed to enqueue generation job:', error);
      throw error;
    }
  }

  /**
   * Handle a generation job
   */
  private async handleGenerationJob(job: PgBoss.Job<GenerationJobData>): Promise<GenerationJobResult> {
    const startTime = Date.now();
    const { jobId, userId, assetId, params } = job.data;

    console.log(`🎨 Processing generation job ${jobId} for user ${userId}`);

    try {
      // Update job status to running
      await this.updateJobStatus(jobId, 'running');

      // 1. Download original image from Supabase Storage
      const originalAsset = await this.getAsset(assetId);
      if (!originalAsset) {
        throw new Error(`Original asset ${assetId} not found`);
      }

      const imageData = await this.downloadAsset(originalAsset);

      // 2. Convert to Gemini request format
      const geminiRequest: GeminiRequest = {
        imageBase64: imageData.toString('base64'),
        mimeType: 'image/jpeg', // Preprocessed by Gemini service
        complexity: params.complexity,
        lineThickness: params.line_thickness
      };

      // 3. Generate coloring page with Gemini
      const result = await this.geminiService.generateColoringPage(geminiRequest);

      if (!result.success || !result.imageBase64) {
        throw new Error(result.error?.message || 'Generation failed without error details');
      }

      // 4. Upload generated image to Supabase Storage
      const generatedAssetId = await this.uploadGeneratedImage(
        userId,
        jobId,
        result.imageBase64,
        'edge_map'
      );

      // 5. Update job with success
      await this.updateJobStatus(jobId, 'succeeded', {
        model: result.metadata.model,
        cost_cents: Math.round(result.metadata.cost * 100)
      });

      const totalTime = Date.now() - startTime;

      console.log(`✅ Generation job ${jobId} completed in ${totalTime}ms`);
      console.log(`   Gemini response time: ${result.metadata.responseTimeMs}ms`);
      console.log(`   Cost: $${result.metadata.cost.toFixed(3)}`);

      return {
        success: true,
        generatedAssetId,
        metadata: {
          responseTimeMs: totalTime,
          cost: result.metadata.cost,
          model: result.metadata.model
        }
      };

    } catch (error: any) {
      console.error(`❌ Generation job ${jobId} failed:`, error.message);

      // Update job status to failed
      await this.updateJobStatus(jobId, 'failed', {
        error: error.message
      });

      const totalTime = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        metadata: {
          responseTimeMs: totalTime,
          cost: 0, // No cost for failed jobs
          model: 'gemini-2.5-flash-image-preview'
        }
      };
    }
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(
    jobId: string,
    status: JobStatus,
    updates: Partial<Job> = {}
  ): Promise<void> {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
      ...updates
    };

    if (status === 'running') {
      updateData.started_at = new Date().toISOString();
    } else if (status === 'succeeded' || status === 'failed') {
      updateData.ended_at = new Date().toISOString();
    }

    const { error } = await this.supabase
      .from('jobs')
      .update(updateData)
      .eq('id', jobId);

    if (error) {
      console.error(`Failed to update job ${jobId} status to ${status}:`, error);
      throw error;
    }
  }

  /**
   * Get asset from database
   */
  private async getAsset(assetId: string): Promise<Asset | null> {
    const { data, error } = await this.supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (error) {
      console.error(`Failed to get asset ${assetId}:`, error);
      throw error;
    }

    return data;
  }

  /**
   * Download asset from Supabase Storage
   */
  private async downloadAsset(asset: Asset): Promise<Buffer> {
    const { data, error } = await this.supabase.storage
      .from('assets')
      .download(asset.storage_path);

    if (error) {
      console.error(`Failed to download asset ${asset.id}:`, error);
      throw error;
    }

    return Buffer.from(await data.arrayBuffer());
  }

  /**
   * Upload generated image to Supabase Storage
   */
  private async uploadGeneratedImage(
    userId: string,
    jobId: string,
    imageBase64: string,
    kind: Asset['kind']
  ): Promise<string> {
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const storagePath = `intermediates/${userId}/${jobId}/edge.png`;

    // Upload to storage
    const { error: uploadError } = await this.supabase.storage
      .from('assets')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        upsert: true
      });

    if (uploadError) {
      console.error('Failed to upload generated image:', uploadError);
      throw uploadError;
    }

    // Create asset record
    const assetId = `${jobId}-${kind}`;
    const { error: dbError } = await this.supabase
      .from('assets')
      .insert({
        id: assetId,
        user_id: userId,
        kind,
        storage_path: storagePath,
        bytes: imageBuffer.length,
        created_at: new Date().toISOString()
      });

    if (dbError) {
      console.error('Failed to create asset record:', dbError);
      throw dbError;
    }

    return assetId;
  }

  /**
   * Get worker status
   */
  getStatus(): { isRunning: boolean; config: GenerationWorkerConfig } {
    return {
      isRunning: this.isRunning,
      config: this.config
    };
  }

  /**
   * Get queue stats
   */
  async getQueueStats() {
    if (!this.isRunning) {
      return null;
    }

    try {
      const stats = await this.boss.getQueueSize('generate-coloring-page');
      return {
        queueName: 'generate-coloring-page',
        size: stats
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      return null;
    }
  }
}

// Factory function for easy instantiation
export function createGenerationWorker(config: GenerationWorkerConfig): GenerationWorker {
  return new GenerationWorker(config);
}