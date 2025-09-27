import PgBoss from 'pg-boss';
import { SupabaseClient } from '@supabase/supabase-js';
import { config } from '@coloringpage/config';
import sharp from 'sharp';

interface IngestJobData {
  asset_id: string;
  user_id: string;
  original_path: string;
}

export async function setupIngestWorker(
  boss: PgBoss,
  supabase: SupabaseClient<any>
) {
  await boss.work('image-ingest', { teamSize: 2 }, async (job) => {
    const { asset_id, user_id, original_path } = job.data as IngestJobData;

    try {
      console.log(`📸 Processing image ingest for asset ${asset_id}`);

      // Download original image
      const { data: imageData } = await supabase.storage
        .from('originals')
        .download(original_path);

      if (!imageData) {
        throw new Error('Failed to download original image');
      }

      const buffer = Buffer.from(await imageData.arrayBuffer());

      // Process image with sharp
      const processed = await sharp(buffer)
        .resize(config.limits.maxImageDimensions, config.limits.maxImageDimensions, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .rotate() // Auto-rotate based on EXIF
        .withMetadata({ exif: {} }) // Strip GPS data but keep orientation
        .toBuffer();

      // Get image metadata
      const metadata = await sharp(processed).metadata();

      // Upload processed image
      const processedPath = `${user_id}/${asset_id}/processed.jpg`;
      const { error: uploadError } = await supabase.storage
        .from('intermediates')
        .upload(processedPath, processed, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload processed image: ${uploadError.message}`);
      }

      // Update asset record
      await supabase
        .from('assets')
        .update({
          width: metadata.width,
          height: metadata.height,
          bytes: processed.length,
        })
        .eq('id', asset_id);

      // Create preprocessed asset record
      await supabase.from('assets').insert({
        user_id,
        kind: 'preprocessed',
        storage_path: processedPath,
        width: metadata.width,
        height: metadata.height,
        bytes: processed.length,
      });

      console.log(`✅ Image ingest completed for asset ${asset_id}`);
    } catch (error) {
      console.error(`❌ Image ingest failed for asset ${asset_id}:`, error);
      throw error;
    }
  });

  console.log('📸 Image ingest worker registered');
}