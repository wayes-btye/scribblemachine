import 'dotenv/config';
import { validateEnv } from '@coloringpage/config';
import { createSupabaseAdminClient } from '@coloringpage/database';
import { createGeminiService, GenerationRequest } from './services/gemini-service';

interface Job {
  id: string;
  user_id: string;
  status: string;
  params_json: {
    asset_id: string;
    complexity: 'simple' | 'standard' | 'detailed';
    line_thickness: 'thin' | 'medium' | 'thick';
    custom_prompt?: string;
  };
  created_at: string;
}

async function main() {
  try {
    // Validate environment variables
    const env = validateEnv(process.env);
    console.log('✅ Environment variables validated');

    // Initialize Supabase admin client
    const supabase = createSupabaseAdminClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY!
    );
    console.log('✅ Supabase client initialized');

    // Initialize Gemini service
    if (!env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required');
    }
    const geminiService = createGeminiService(env.GEMINI_API_KEY);
    console.log('✅ Gemini service initialized');

    console.log('🚀 Simple polling worker started - checking for jobs every 5 seconds');

    // Poll for jobs every 5 seconds
    setInterval(async () => {
      try {
        // Get pending jobs
        const { data: jobs, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('status', 'queued')
          .order('created_at', { ascending: true })
          .limit(1);

        if (error) {
          console.error('Error fetching jobs:', error);
          return;
        }

        if (!jobs || jobs.length === 0) {
          return; // No jobs to process
        }

        const job = jobs[0] as Job;
        console.log(`🎨 Processing job ${job.id} for user ${job.user_id}`);

        // Update job status to running
        await supabase
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

async function processGenerationJob(job: Job, supabase: any, geminiService: any) {
  const startTime = Date.now();

  try {
    // Get original asset
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('storage_path')
      .eq('id', job.params_json.asset_id)
      .eq('kind', 'original')
      .single();

    if (assetError || !asset) {
      throw new Error(`Original asset ${job.params_json.asset_id} not found`);
    }

    // Download original image
    const { data: imageData, error: downloadError } = await supabase.storage
      .from('originals')
      .download(asset.storage_path);

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
      complexity: job.params_json.complexity,
      lineThickness: job.params_json.line_thickness
    };

    console.log(`  Sending request to Gemini (${job.params_json.complexity}, ${job.params_json.line_thickness})`);

    // Generate coloring page with Gemini
    const result = await geminiService.generateColoringPage(geminiRequest);

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

    // Create edge map asset record
    const edgeAssetId = `${job.id}-edge_map`;
    await supabase.from('assets').insert({
      id: edgeAssetId,
      user_id: job.user_id,
      kind: 'edge_map',
      storage_path: edgeMapPath,
      bytes: edgeMapBuffer.length,
      created_at: new Date().toISOString()
    });

    // Update job as completed with metadata
    await supabase
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
      const { error: creditError } = await supabase.rpc('increment_user_credits', {
        user_id: job.user_id,
        amount: 1
      });

      if (creditError) {
        console.error(`Failed to refund credit for job ${job.id}:`, creditError);
      } else {
        // Record credit refund event
        await supabase
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
    await supabase
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