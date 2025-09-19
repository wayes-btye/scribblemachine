import PgBoss from 'pg-boss';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@coloringpage/database';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { JobParams } from '@coloringpage/types';
import { config } from '@coloringpage/config';
import sharp from 'sharp';

interface GenerationJobData {
  job_id: string;
  user_id: string;
  asset_id: string;
  params: JobParams;
}

export async function setupGenerationWorker(
  boss: PgBoss,
  supabase: SupabaseClient<Database>
) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

  await boss.work('image-generation', { teamSize: 1 }, async (job) => {
    const { job_id, user_id, asset_id, params } = job.data as GenerationJobData;

    try {
      console.log(`🎨 Starting generation for job ${job_id}`);

      // Update job status
      await supabase
        .from('jobs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', job_id);

      // Get preprocessed image
      const { data: assets } = await supabase
        .from('assets')
        .select('storage_path')
        .eq('user_id', user_id)
        .eq('kind', 'preprocessed')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!assets || assets.length === 0) {
        throw new Error('No preprocessed image found');
      }

      const { data: imageData } = await supabase.storage
        .from('intermediates')
        .download(assets[0].storage_path);

      if (!imageData) {
        throw new Error('Failed to download preprocessed image');
      }

      // Convert to base64 for Gemini API
      const buffer = Buffer.from(await imageData.arrayBuffer());
      const base64Image = buffer.toString('base64');

      // Prepare prompt based on complexity
      const complexityPrompt = config.generation.complexityLevels[params.complexity];
      const prompt = `Convert this image to a coloring page with ${complexityPrompt}.
        Create clear, bold outlines suitable for coloring.
        Remove all color and create black lines on white background.
        Line thickness should be ${params.line_thickness}.
        Make it suitable for children to color.`;

      // Call Gemini API
      const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });
      const result = await model.generateContent([
        prompt,
        {
          inlineData: {
            data: base64Image,
            mimeType: 'image/jpeg',
          },
        },
      ]);

      // Note: This is a placeholder - actual Gemini API for image generation
      // would need different implementation based on the actual API
      const response = await result.response;
      const generatedImageData = response.text(); // This would be different for actual image output

      // For now, create a simple edge detection as fallback
      const edgeMap = await sharp(buffer)
        .greyscale()
        .normalise()
        .convolve({
          width: 3,
          height: 3,
          kernel: [-1, -1, -1, -1, 8, -1, -1, -1, -1],
        })
        .threshold(128)
        .png()
        .toBuffer();

      // Upload generated edge map
      const edgeMapPath = `${user_id}/${job_id}/edge_map.png`;
      const { error: uploadError } = await supabase.storage
        .from('intermediates')
        .upload(edgeMapPath, edgeMap, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload edge map: ${uploadError.message}`);
      }

      // Create edge map asset record
      await supabase.from('assets').insert({
        user_id,
        kind: 'edge_map',
        storage_path: edgeMapPath,
        bytes: edgeMap.length,
      });

      // Update job as completed
      await supabase
        .from('jobs')
        .update({
          status: 'succeeded',
          ended_at: new Date().toISOString(),
        })
        .eq('id', job_id);

      console.log(`✅ Generation completed for job ${job_id}`);
    } catch (error) {
      console.error(`❌ Generation failed for job ${job_id}:`, error);

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

  console.log('🎨 Image generation worker registered');
}