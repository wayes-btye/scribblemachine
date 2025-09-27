import PgBoss from 'pg-boss';
import { SupabaseClient } from '@supabase/supabase-js';
import { JobParams } from '@coloringpage/types';
import { createGeminiService, GenerationRequest } from '../services/gemini-service';

interface GenerationJobData {
  job_id: string;
  user_id: string;
  asset_id: string;
  params: JobParams;
}

export async function setupGenerationWorker(
  boss: PgBoss,
  supabase: SupabaseClient<any>
) {
  // Initialize production Gemini service
  const geminiService = createGeminiService(process.env.GEMINI_API_KEY!);

  await boss.work('image-generation', { teamSize: 3 }, async (job) => {
    const { job_id, user_id, asset_id, params } = job.data as GenerationJobData;

    try {
      console.log(`🎨 Starting generation for job ${job_id} (Gemini 2.5 Flash Image)`);

      // Update job status
      await supabase
        .from('jobs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', job_id);

      // Get original asset directly (not preprocessed since Gemini service handles that)
      const { data: asset } = await supabase
        .from('assets')
        .select('storage_path')
        .eq('id', asset_id)
        .eq('kind', 'original')
        .single();

      if (!asset) {
        throw new Error('Original asset not found');
      }

      // Download original image
      const { data: imageData } = await supabase.storage
        .from('originals')
        .download(asset.storage_path);

      if (!imageData) {
        throw new Error('Failed to download original image');
      }

      // Convert to base64 for Gemini service
      const buffer = Buffer.from(await imageData.arrayBuffer());
      const base64Image = buffer.toString('base64');

      // Create Gemini generation request
      const geminiRequest: GenerationRequest = {
        imageBase64: base64Image,
        mimeType: 'image/jpeg',
        complexity: params.complexity,
        lineThickness: params.line_thickness
      };

      // Generate coloring page with production Gemini service
      const result = await geminiService.generateColoringPage(geminiRequest);

      if (!result.success || !result.imageBase64) {
        throw new Error(result.error?.message || 'Generation failed');
      }

      // Upload generated edge map
      const edgeMapBuffer = Buffer.from(result.imageBase64, 'base64');
      const edgeMapPath = `${user_id}/${job_id}/edge.png`;

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
      const edgeAssetId = `${job_id}-edge_map`;
      await supabase.from('assets').insert({
        id: edgeAssetId,
        user_id,
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
        .eq('id', job_id);

      console.log(`✅ Generation completed for job ${job_id}`);
      console.log(`   Model: ${result.metadata.model}`);
      console.log(`   Response time: ${result.metadata.responseTimeMs}ms`);
      console.log(`   Cost: $${result.metadata.cost.toFixed(3)}`);

    } catch (error) {
      console.error(`❌ Generation failed for job ${job_id}:`, error);

      // Refund credit to user on failure
      try {
        const { error: creditError } = await supabase
          .from('credits')
          .update({
            balance: 1, // Refund 1 credit
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user_id);

        if (creditError) {
          console.error(`Failed to refund credit for job ${job_id}:`, creditError);
        } else {
          // Record credit refund event
          await supabase
            .from('credit_events')
            .insert({
              user_id,
              delta: 1,
              reason: 'generation_failed',
            });

          console.log(`💰 Refunded 1 credit to user ${user_id} for failed job ${job_id}`);
        }
      } catch (refundError) {
        console.error(`❌ Credit refund failed for job ${job_id}:`, refundError);
      }

      // Update job as failed
      await supabase
        .from('jobs')
        .update({
          status: 'failed',
          ended_at: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        .eq('id', job_id);

      throw error;
    }
  });

  console.log('🎨 Image generation worker registered (Gemini 2.5 Flash Image)');
}