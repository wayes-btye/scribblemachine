import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { validateEnv, config } from '@coloringpage/config';
import { createSupabaseAdminClient } from '@coloringpage/database';
import type { Job } from '@coloringpage/types';
import { createGeminiService, GenerationRequest, TextGenerationRequest, EditRequest } from './services/gemini-service';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import * as http from 'http';

// Extended JobParams interface for worker-specific properties
interface ExtendedJobParams {
  asset_id?: string;
  complexity?: 'simple' | 'standard' | 'detailed';
  line_thickness?: 'thin' | 'medium' | 'thick';
  paper_size?: 'A4' | 'Letter';
  title?: string;
  text_prompt?: string;
  edit_parent_id?: string;
  edit_prompt?: string;
  edit_source_asset_id?: string;
  custom_prompt?: string;
}

// Extended Job interface for worker
interface ExtendedJob extends Omit<Job, 'params_json'> {
  params_json: ExtendedJobParams;
}

// Smart logging class to reduce noise while maintaining observability
class WorkerLogger {
  private lastJobState: 'idle' | 'active' = 'idle';
  private lastIdleLogTime = 0;
  private idleLogInterval = 5 * 60 * 1000; // Log idle state every 5 minutes
  private consecutiveIdleCount = 0;

  logJobState(jobs: any[], recentJobs: any[]) {
    const timestamp = new Date().toISOString();
    const hasJobs = jobs.length > 0;
    const currentState = hasJobs ? 'active' : 'idle';

    // Always log state changes
    if (currentState !== this.lastJobState) {
      if (currentState === 'active') {
        console.log(`[${timestamp}] 🟢 Jobs detected after ${this.consecutiveIdleCount} idle checks`);
        this.consecutiveIdleCount = 0;
      } else {
        console.log(`[${timestamp}] 🟡 No queued jobs found`);
      }
      this.lastJobState = currentState;
    }

    // For idle state: periodic summary logs
    if (currentState === 'idle') {
      this.consecutiveIdleCount++;
      const now = Date.now();

      if (now - this.lastIdleLogTime > this.idleLogInterval) {
        console.log(`[${timestamp}] 📊 SUMMARY: ${this.consecutiveIdleCount} idle checks (${this.idleLogInterval / 60000}min). Recent jobs:`,
          recentJobs?.map((j: any) => `${j.id.substring(0, 8)}:${j.status}${j.params_json?.edit_parent_id ? ':EDIT' : ''}`).slice(0, 3) || 'none');
        this.lastIdleLogTime = now;
      }
    }
  }
}

async function createPDFFromPNG(pngBuffer: Buffer): Promise<Buffer> {
  // Use A4 as default paper size (8.27 x 11.69 inches = 595 x 842 points)
  const paperWidth = 595;
  const paperHeight = 842;
  const marginPoints = (config.pdf.marginMM / 25.4) * 72; // Convert mm to points

  // Process image to fit within margins
  const contentWidth = paperWidth - (marginPoints * 2);
  const contentHeight = paperHeight - (marginPoints * 2);

  const processedImage = await sharp(pngBuffer)
    .resize(
      Math.floor(contentWidth),
      Math.floor(contentHeight),
      {
        fit: 'inside',
        withoutEnlargement: true,
      }
    )
    .png()
    .toBuffer();

  // Create PDF document
  const doc = new PDFDocument({
    size: [paperWidth, paperHeight],
    margins: {
      top: marginPoints,
      bottom: marginPoints,
      left: marginPoints,
      right: marginPoints,
    },
  });

  // Get image metadata for centering
  const imageMetadata = await sharp(processedImage).metadata();
  const imageWidth = imageMetadata.width!;
  const imageHeight = imageMetadata.height!;

  // Center the image
  const x = (paperWidth - imageWidth) / 2;
  const y = (paperHeight - imageHeight) / 2;

  // Add the image to PDF
  doc.image(processedImage, x, y, {
    width: imageWidth,
    height: imageHeight,
  });

  // Convert PDF to buffer
  const pdfChunks: Buffer[] = [];
  doc.on('data', (chunk) => pdfChunks.push(chunk));

  const pdfBuffer = await new Promise<Buffer>((resolve) => {
    doc.on('end', () => {
      resolve(Buffer.concat(pdfChunks));
    });
    doc.end();
  });

  return pdfBuffer;
}

// Start HTTP server for Cloud Run health checks
function startHealthCheckServer() {
  const port = process.env.PORT || 8080;

  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: 'healthy',
        service: 'coloringpage-worker',
        timestamp: new Date().toISOString()
      }));
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    }
  });

  server.listen(port, () => {
    console.log(`🏥 Health check server listening on port ${port}`);
  });

  return server;
}

async function main() {
  try {
    // Start health check server for Cloud Run
    startHealthCheckServer();

    // Check for pause mechanism (for local development testing)
    const pauseWorker = process.env.PAUSE_WORKER === 'true';
    if (pauseWorker) {
      console.log('⏸️  WORKER PAUSED: PAUSE_WORKER=true detected');
      console.log('   Worker will not process jobs - safe for local development');
      console.log('   To resume: Set PAUSE_WORKER=false or remove the environment variable');

      // Keep the service alive but don't process jobs
      setInterval(() => {
        console.log('⏸️  Worker paused - no job processing');
      }, 30000); // Log every 30 seconds to show it's alive

      return; // Exit early - don't start job processing
    }

    // Validate environment variables
    const env = validateEnv(process.env);
    console.log('✅ Environment variables validated');

    // Initialize Supabase admin client
    console.log('🔗 Connecting to Supabase:', env.NEXT_PUBLIC_SUPABASE_URL);
    const supabase = createSupabaseAdminClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Test Supabase connection
    try {
      const { error } = await supabase.from('jobs').select('count').limit(1);
      if (error) {
        console.error('❌ Supabase connection test failed:', error);
        return;
      }
      console.log('✅ Supabase connection test successful');
    } catch (err) {
      console.error('❌ Supabase connection error:', err);
      return;
    }

    // Initialize Gemini service
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }
    const geminiService = createGeminiService(env.GEMINI_API_KEY);
    console.log('✅ Gemini service initialized');

    console.log('🚀 Simple polling worker started - checking for jobs every 5 seconds');

    // Initialize smart logger
    const logger = new WorkerLogger();

    // Poll for jobs every 5 seconds
    setInterval(async () => {
      try {
        // Get pending jobs
        console.log('🔍 Fetching pending jobs...');
        const { data: jobs, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'queued')
          .order('created_at', { ascending: true })
          .limit(1);

        if (error) {
          console.error('❌ Error fetching jobs:', error);
          console.error('Error details:', JSON.stringify(error, null, 2));
          return;
        }

        console.log(`📋 Found ${jobs?.length || 0} pending jobs`);

        if (!jobs || jobs.length === 0) {
          // Get recent jobs for logging context
          const { data: recentJobs } = await supabase
            .from('jobs')
            .select('id, status, created_at, params_json')
            .order('created_at', { ascending: false })
            .limit(5);

          // Use smart logger to reduce noise
          logger.logJobState([], recentJobs || []);
          return; // No jobs to process
        }

        // Log transition to active state
        logger.logJobState(jobs, []);

        const job = jobs[0] as ExtendedJob;
        const jobType = job.params_json.edit_parent_id ? 'EDIT' :
          job.params_json.text_prompt ? 'TEXT' : 'IMAGE';
        console.log(`🎨 Processing ${jobType} job ${job.id} for user ${job.user_id}`);

        if (jobType === 'EDIT') {
          console.log(`🔧 EDIT DETAILS: parent=${job.params_json.edit_parent_id}, prompt="${job.params_json.edit_prompt}", source_asset=${job.params_json.edit_source_asset_id}`);
        }

        // Update job status to running
        await (supabase as any)
          .from('jobs')
          .update({
            status: 'running',
            started_at: new Date().toISOString()
          })
          .eq('id', job.id);

        // Process the job
        await processGenerationJob(job, supabase, geminiService);

      } catch (error) {
        console.error('Error in job processing loop:', error);
      }
    }, 5000);

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('🛑 Shutting down worker...');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Failed to start worker service:', error);
    process.exit(1);
  }
}

async function processGenerationJob(job: ExtendedJob, supabase: ReturnType<typeof createSupabaseAdminClient>, geminiService: any) {
  const startTime = Date.now();

  try {
    let result;

    // Check if this is a text-based job or image-based job
    if (job.params_json.text_prompt) {
      // Text-to-image generation
      console.log(`  Text prompt: "${job.params_json.text_prompt}"`);

      const textRequest: TextGenerationRequest = {
        textPrompt: job.params_json.text_prompt!,
        complexity: job.params_json.complexity || 'standard',
        lineThickness: job.params_json.line_thickness || 'medium'
      };

      console.log(`  Sending text request to Gemini (${job.params_json.complexity}, ${job.params_json.line_thickness})`);

      // Generate coloring page from text with Gemini
      result = await geminiService.generateColoringPageFromText(textRequest);

    } else if (job.params_json.edit_parent_id && job.params_json.edit_prompt) {
      // Edit existing coloring page
      console.log(`  Edit request: "${job.params_json.edit_prompt}" for parent job ${job.params_json.edit_parent_id}`);

      // Debug: Check all assets for this source ID
      const { data: allAssets } = await supabase
        .from('assets')
        .select('id, kind, storage_path, user_id')
        .eq('id', job.params_json.edit_source_asset_id!);

      console.log(`🔍 DEBUG: Assets for source ID ${job.params_json.edit_source_asset_id}:`, allAssets);

      // Get the source edge map asset for editing
      const { data: sourceAsset, error: sourceAssetError } = await supabase
        .from('assets')
        .select('storage_path')
        .eq('id', job.params_json.edit_source_asset_id!)
        .eq('kind', 'edge_map')
        .single();

      console.log(`🔍 DEBUG: Edge map lookup result:`, { sourceAsset, error: sourceAssetError });

      if (sourceAssetError || !sourceAsset) {
        // Additional debug: Look for edge_map assets by parent job pattern
        const parentJobId = job.params_json.edit_parent_id;
        const { data: edgeAssets } = await supabase
          .from('assets')
          .select('id, storage_path, user_id')
          .eq('kind', 'edge_map')
          .like('storage_path', `%/${parentJobId}/%`);

        console.log(`🔍 DEBUG: Edge assets for parent job ${parentJobId}:`, edgeAssets);
        throw new Error(`Source edge map asset ${job.params_json.edit_source_asset_id} not found for editing`);
      }

      // Download the existing coloring page
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('intermediates')
        .download((sourceAsset as any).storage_path);

      if (downloadError || !imageData) {
        throw new Error('Failed to download existing coloring page for editing');
      }

      // Convert to base64 for Gemini service
      const buffer = Buffer.from(await imageData.arrayBuffer());
      const base64Image = buffer.toString('base64');

      // Create Gemini edit request
      const editRequest: EditRequest = {
        existingImageBase64: base64Image,
        mimeType: 'image/png',
        editPrompt: job.params_json.edit_prompt!,
        complexity: job.params_json.complexity || 'standard',
        lineThickness: job.params_json.line_thickness || 'medium',
        originalPrompt: job.params_json.custom_prompt
      };

      console.log(`  Sending edit request to Gemini (${job.params_json.complexity}, ${job.params_json.line_thickness})`);

      // Edit coloring page with Gemini
      result = await geminiService.editColoringPage(editRequest);

    } else if (job.params_json.asset_id) {
      // Image-to-image generation (existing logic)

      // Get original asset
      const { data: asset, error: assetError } = await supabase
        .from('assets')
        .select('storage_path')
        .eq('id', job.params_json.asset_id!)
        .eq('kind', 'original')
        .single();

      if (assetError || !asset) {
        throw new Error(`Original asset ${job.params_json.asset_id} not found`);
      }

      // Download original image
      const { data: imageData, error: downloadError } = await supabase.storage
        .from('originals')
        .download((asset as any).storage_path);

      if (downloadError || !imageData) {
        throw new Error('Failed to download original image');
      }

      // Convert to base64 for Gemini service
      const buffer = Buffer.from(await imageData.arrayBuffer());
      const base64Image = buffer.toString('base64');

      // Create Gemini generation request
      const geminiRequest: GenerationRequest = {
        imageBase64: base64Image,
        mimeType: 'image/jpeg',
        complexity: job.params_json.complexity || 'standard',
        lineThickness: job.params_json.line_thickness || 'medium'
      };

      console.log(`  Sending image request to Gemini (${job.params_json.complexity}, ${job.params_json.line_thickness})`);

      // Generate coloring page with Gemini
      result = await geminiService.generateColoringPage(geminiRequest);

    } else {
      throw new Error('Job must have either text_prompt, asset_id, or edit_parent_id with edit_prompt');
    }

    if (!result.success || !result.imageBase64) {
      throw new Error(result.error?.message || 'Generation failed');
    }

    // Upload generated edge map
    const edgeMapBuffer = Buffer.from(result.imageBase64, 'base64');
    const edgeMapPath = `${job.user_id}/${job.id}/edge.png`;

    const { error: uploadError } = await supabase.storage
      .from('intermediates')
      .upload(edgeMapPath, edgeMapBuffer, {
        contentType: 'image/png',
        upsert: true,
      });

    if (uploadError) {
      throw new Error(`Failed to upload edge map: ${uploadError.message}`);
    }

    // Create edge map asset record with proper UUID
    const edgeAssetId = uuidv4();
    const { error: insertError } = await (supabase as any).from('assets').insert({
      id: edgeAssetId,
      user_id: job.user_id,
      kind: 'edge_map',
      storage_path: edgeMapPath,
      bytes: edgeMapBuffer.length,
      created_at: new Date().toISOString()
    });

    if (insertError) {
      console.error('Failed to create edge_map asset record:', insertError);
      throw new Error(`Failed to create edge_map asset: ${insertError.message}`);
    }

    console.log(`  ✅ Created edge_map asset: ${edgeAssetId}`);

    // Generate PDF from the PNG coloring page
    console.log(`  📄 Generating PDF from coloring page...`);
    try {
      const pdfBuffer = await createPDFFromPNG(edgeMapBuffer);
      const pdfPath = `${job.user_id}/${job.id}/coloring_page.pdf`;

      // Upload PDF to artifacts bucket
      const { error: pdfUploadError } = await supabase.storage
        .from('artifacts')
        .upload(pdfPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (pdfUploadError) {
        console.warn(`⚠️ PDF upload failed (non-blocking): ${pdfUploadError.message}`);
      } else {
        // Create PDF asset record
        const pdfAssetId = uuidv4();
        const { error: pdfInsertError } = await (supabase as any).from('assets').insert({
          id: pdfAssetId,
          user_id: job.user_id,
          kind: 'pdf',
          storage_path: pdfPath,
          bytes: pdfBuffer.length,
          created_at: new Date().toISOString()
        });

        if (pdfInsertError) {
          console.warn(`⚠️ PDF asset record failed (non-blocking): ${pdfInsertError.message}`);
        } else {
          console.log(`  ✅ Created PDF asset: ${pdfAssetId} (${Math.round(pdfBuffer.length / 1024)}KB)`);
        }
      }
    } catch (pdfError: any) {
      console.warn(`⚠️ PDF generation failed (non-blocking): ${pdfError.message}`);
    }

    // Update job as completed with metadata
    await (supabase as any)
      .from('jobs')
      .update({
        status: 'succeeded',
        ended_at: new Date().toISOString(),
        model: result.metadata.model,
        cost_cents: Math.round(result.metadata.cost * 100)
      })
      .eq('id', job.id);

    const totalTime = Date.now() - startTime;
    console.log(`✅ Job ${job.id} completed successfully in ${totalTime}ms`);
    console.log(`   Model: ${result.metadata.model}`);
    console.log(`   Response time: ${result.metadata.responseTimeMs}ms`);
    console.log(`   Cost: $${result.metadata.cost.toFixed(3)}`);

  } catch (error: any) {
    console.error(`❌ Job ${job.id} failed:`, error.message);

    // Refund credit to user on failure
    try {
      const { error: creditError } = await (supabase as any).rpc('increment_user_credits', {
        user_id: job.user_id,
        amount: 1
      });

      if (creditError) {
        console.error(`Failed to refund credit for job ${job.id}:`, creditError);
      } else {
        // Record credit refund event
        await (supabase as any)
          .from('credit_events')
          .insert({
            user_id: job.user_id,
            delta: 1,
            reason: 'generation_failed',
          });

        console.log(`💰 Refunded 1 credit to user ${job.user_id} for failed job ${job.id}`);
      }
    } catch (refundError) {
      console.error(`❌ Credit refund failed for job ${job.id}:`, refundError);
    }

    // Update job as failed
    await (supabase as any)
      .from('jobs')
      .update({
        status: 'failed',
        ended_at: new Date().toISOString(),
        error: error.message,
      })
      .eq('id', job.id);
  }
}

main();