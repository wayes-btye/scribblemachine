import { createGenerationWorker, GenerationJobData } from './workers/generation-worker';
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'GEMINI_API_KEY'
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`❌ ${envVar} not found in environment variables`);
    process.exit(1);
  }
}

async function testGenerationWorker() {
  console.log('🔧 Testing Generation Worker Integration\n');

  // Initialize worker
  const worker = createGenerationWorker({
    databaseUrl: process.env.DATABASE_URL!,
    supabaseUrl: process.env.SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    geminiApiKey: process.env.GEMINI_API_KEY!,
    maxConcurrency: 1, // Use 1 for testing
    pollIntervalMs: 1000 // Check every second for testing
  });

  // Initialize Supabase client for test setup
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    console.log('🚀 Starting worker...');
    await worker.start();

    // 1. Setup test data
    console.log('\n📝 Setting up test data...');

    // Create test user
    const testUserId = `test-user-${Date.now()}`;
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: testUserId,
        email: `test-${Date.now()}@example.com`,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString()
      });

    if (userError) {
      console.error('Failed to create test user:', userError);
      throw userError;
    }

    console.log(`✅ Created test user: ${testUserId}`);

    // Upload test image to Supabase Storage
    const testImagesDir = path.join(__dirname, '../test-images');
    const testImages = fs.readdirSync(testImagesDir)
      .filter(file => /\.(jpg|jpeg|png)$/i.test(file));

    if (testImages.length === 0) {
      console.log('❌ No test images found for worker testing');
      process.exit(1);
    }

    const testImagePath = path.join(testImagesDir, testImages[0]);
    console.log(`📸 Using test image: ${testImages[0]}`);

    // Preprocess and upload image
    const processedImage = await sharp(testImagePath)
      .resize(1024, 1024, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    const assetId = `test-asset-${Date.now()}`;
    const storagePath = `${testUserId}/${assetId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('originals')
      .upload(storagePath, processedImage, {
        contentType: 'image/jpeg'
      });

    if (uploadError) {
      console.error('Failed to upload test image:', uploadError);
      throw uploadError;
    }

    // Create asset record
    const { error: assetError } = await supabase
      .from('assets')
      .insert({
        id: assetId,
        user_id: testUserId,
        kind: 'original',
        storage_path: storagePath,
        bytes: processedImage.length,
        created_at: new Date().toISOString()
      });

    if (assetError) {
      console.error('Failed to create asset record:', assetError);
      throw assetError;
    }

    console.log(`✅ Uploaded test asset: ${assetId}`);

    // Create test job
    const jobId = `test-job-${Date.now()}`;
    const { error: jobError } = await supabase
      .from('jobs')
      .insert({
        id: jobId,
        user_id: testUserId,
        status: 'queued',
        params_json: {
          asset_id: assetId,
          complexity: 'standard',
          line_thickness: 'medium'
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (jobError) {
      console.error('Failed to create test job:', jobError);
      throw jobError;
    }

    console.log(`✅ Created test job: ${jobId}`);

    // 2. Test job processing
    console.log('\n🎨 Testing job processing...');

    const jobData: GenerationJobData = {
      jobId,
      userId: testUserId,
      assetId,
      params: {
        asset_id: assetId,
        complexity: 'standard',
        line_thickness: 'medium'
      }
    };

    const startTime = Date.now();
    const queueJobId = await worker.enqueueJob(jobData);
    console.log(`📋 Enqueued job with queue ID: ${queueJobId}`);

    // 3. Monitor job progress
    console.log('\n👀 Monitoring job progress...');

    let attempts = 0;
    const maxAttempts = 60; // Wait up to 60 seconds
    let finalStatus = 'queued';

    while (attempts < maxAttempts) {
      const { data: job, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) {
        console.error('Failed to check job status:', error);
        break;
      }

      if (job.status !== finalStatus) {
        finalStatus = job.status;
        console.log(`   Status changed to: ${finalStatus}`);

        if (job.status === 'running') {
          console.log(`   Started at: ${job.started_at}`);
        } else if (job.status === 'succeeded') {
          console.log(`   Completed at: ${job.ended_at}`);
          console.log(`   Model: ${job.model}`);
          console.log(`   Cost: $${(job.cost_cents / 100).toFixed(3)}`);
          break;
        } else if (job.status === 'failed') {
          console.log(`   Failed at: ${job.ended_at}`);
          console.log(`   Error: ${job.error}`);
          break;
        }
      }

      attempts++;
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const totalTime = Date.now() - startTime;
    console.log(`\n⏱️ Total processing time: ${totalTime}ms`);

    // 4. Verify results
    if (finalStatus === 'succeeded') {
      console.log('\n✅ Job completed successfully! Verifying results...');

      // Check for generated assets
      const { data: generatedAssets, error: assetsError } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', testUserId)
        .eq('kind', 'edge_map');

      if (assetsError) {
        console.error('Failed to check generated assets:', assetsError);
      } else if (generatedAssets.length > 0) {
        console.log(`✅ Found ${generatedAssets.length} generated asset(s)`);

        for (const asset of generatedAssets) {
          console.log(`   Asset ID: ${asset.id}`);
          console.log(`   Storage path: ${asset.storage_path}`);
          console.log(`   Size: ${(asset.bytes / 1024).toFixed(1)} KB`);

          // Try to download and verify the generated image
          const { data: downloadData, error: downloadError } = await supabase.storage
            .from('assets')
            .download(asset.storage_path);

          if (downloadError) {
            console.log(`   ⚠️ Could not download generated image: ${downloadError.message}`);
          } else {
            const imageBuffer = Buffer.from(await downloadData.arrayBuffer());
            console.log(`   ✅ Successfully downloaded: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

            // Save to local test output for manual verification
            const outputDir = path.join(__dirname, '../test-output-worker');
            if (!fs.existsSync(outputDir)) {
              fs.mkdirSync(outputDir, { recursive: true });
            }

            const outputPath = path.join(outputDir, `worker_test_result_${Date.now()}.png`);
            fs.writeFileSync(outputPath, imageBuffer);
            console.log(`   💾 Saved result to: ${outputPath}`);
          }
        }
      } else {
        console.log('⚠️ No generated assets found');
      }

    } else if (finalStatus === 'failed') {
      console.log('\n❌ Job failed - this might be expected for testing error handling');
    } else {
      console.log('\n⏰ Job did not complete within timeout - check queue status');
    }

    // 5. Test queue stats
    console.log('\n📊 Queue statistics:');
    const stats = await worker.getQueueStats();
    if (stats) {
      console.log(`   Queue: ${stats.queueName}`);
      console.log(`   Size: ${stats.size}`);
    }

    console.log('\n✨ Worker test completed!');

  } catch (error: any) {
    console.error('\n❌ Worker test failed:', error.message);
    throw error;

  } finally {
    // Clean up
    console.log('\n🧹 Cleaning up...');
    try {
      await worker.stop();
      console.log('✅ Worker stopped');
    } catch (error) {
      console.error('⚠️ Error stopping worker:', error);
    }
  }
}

// Run the test
testGenerationWorker().catch(console.error);