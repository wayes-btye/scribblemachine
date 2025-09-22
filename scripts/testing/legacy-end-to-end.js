#!/usr/bin/env node

/**
 * End-to-End Integration Test
 *
 * Tests the complete flow: Upload -> Create Job -> Worker Processing -> Complete
 * Bypasses authentication by directly creating test data
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://htxsylxwvcbrazdowjys.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh0eHN5bHh3dmNicmF6ZG93anlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODIxMTM0MSwiZXhwIjoyMDczNzg3MzQxfQ.DDB0D4h8359eJix-Yuy64Mf98VQngDyJpTGEbtH6GmA';

async function main() {
  console.log('🚀 Starting End-to-End Integration Test');

  // Initialize Supabase admin client
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  const testUserId = '123e4567-e89b-12d3-a456-426614174000';
  const testAssetId = 'test-asset-123';

  try {
    // Step 1: Create test user in auth.users (required for foreign key)
    console.log('📝 Step 1: Creating test user in auth system...');
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      user_id: testUserId,
      email: 'test@example.com',
      password: 'test123456',
      email_confirm: true
    });

    if (authError && authError.message !== 'User already registered') {
      console.error('Failed to create auth user:', authError);
      throw authError;
    }
    console.log('✅ Auth user ready');

    // Step 2: Create user in public.users table
    console.log('📝 Step 2: Creating user in public.users...');
    const { error: userError } = await supabase
      .from('users')
      .upsert({
        id: testUserId,
        email: 'test@example.com',
        created_at: new Date().toISOString()
      });

    if (userError) {
      console.error('Failed to create public user:', userError);
      throw userError;
    }
    console.log('✅ Public user created');

    // Step 3: Create credits for user
    console.log('📝 Step 3: Creating user credits...');
    const { error: creditsError } = await supabase
      .from('credits')
      .upsert({
        user_id: testUserId,
        balance: 10,
        updated_at: new Date().toISOString()
      });

    if (creditsError) {
      console.error('Failed to create credits:', creditsError);
      throw creditsError;
    }
    console.log('✅ Credits created (balance: 10)');

    // Step 4: Upload test image to storage
    console.log('📝 Step 4: Uploading test image...');
    const testImagePath = path.join(__dirname, 'services/worker/test-images/blue-girl-smile.jpg');
    const imageBuffer = fs.readFileSync(testImagePath);
    const storagePath = `originals/${testUserId}/test-image.jpg`;

    const { error: uploadError } = await supabase.storage
      .from('assets')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });

    if (uploadError) {
      console.error('Failed to upload image:', uploadError);
      throw uploadError;
    }
    console.log('✅ Test image uploaded');

    // Step 5: Create asset record
    console.log('📝 Step 5: Creating asset record...');
    const { error: assetError } = await supabase
      .from('assets')
      .upsert({
        id: testAssetId,
        user_id: testUserId,
        kind: 'original',
        storage_path: storagePath,
        width: 800,
        height: 600,
        bytes: imageBuffer.length,
        created_at: new Date().toISOString()
      });

    if (assetError) {
      console.error('Failed to create asset:', assetError);
      throw assetError;
    }
    console.log('✅ Asset record created');

    // Step 6: Create generation job
    console.log('📝 Step 6: Creating generation job...');
    const jobId = 'test-job-' + Date.now();
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .insert({
        id: jobId,
        user_id: testUserId,
        status: 'queued',
        params_json: {
          asset_id: testAssetId,
          complexity: 'standard',
          line_thickness: 'medium'
        }
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create job:', jobError);
      throw jobError;
    }
    console.log(`✅ Job created: ${jobId}`);
    console.log('   Status: queued');
    console.log('   Parameters: standard complexity, medium line thickness');

    // Step 7: Deduct credit
    console.log('📝 Step 7: Deducting credit...');
    const { error: deductError } = await supabase.rpc('increment_user_credits', {
      user_id: testUserId,
      amount: -1
    });

    if (deductError) {
      console.error('Failed to deduct credit:', deductError);
      throw deductError;
    }

    // Record credit event
    await supabase
      .from('credit_events')
      .insert({
        user_id: testUserId,
        delta: -1,
        reason: 'generation_queued'
      });

    console.log('✅ Credit deducted (balance: 9)');

    // Step 8: Monitor job processing
    console.log('📝 Step 8: Monitoring job processing...');
    console.log('⏳ Waiting for worker to pick up job...');

    let attempts = 0;
    const maxAttempts = 60; // Wait up to 5 minutes

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds

      const { data: currentJob, error: fetchError } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (fetchError) {
        console.error('Error fetching job:', fetchError);
        continue;
      }

      console.log(`   Job status: ${currentJob.status}`);

      if (currentJob.status === 'succeeded') {
        console.log('🎉 SUCCESS! Job completed successfully');
        console.log(`   Model: ${currentJob.model}`);
        console.log(`   Cost: $${(currentJob.cost_cents / 100).toFixed(3)}`);

        // Check if edge map asset was created
        const { data: edgeAsset } = await supabase
          .from('assets')
          .select('*')
          .eq('user_id', testUserId)
          .eq('kind', 'edge_map')
          .limit(1)
          .single();

        if (edgeAsset) {
          console.log(`✅ Generated asset created: ${edgeAsset.id}`);
          console.log(`   Storage path: ${edgeAsset.storage_path}`);
          console.log(`   Size: ${edgeAsset.bytes} bytes`);
        }

        break;
      } else if (currentJob.status === 'failed') {
        console.log('❌ FAILED! Job failed');
        console.log(`   Error: ${currentJob.error}`);

        // Check if credit was refunded
        const { data: credits } = await supabase
          .from('credits')
          .select('balance')
          .eq('user_id', testUserId)
          .single();

        console.log(`   Credit balance after failure: ${credits?.balance || 'unknown'}`);
        break;
      }

      attempts++;
    }

    if (attempts >= maxAttempts) {
      console.log('⏰ TIMEOUT! Job did not complete within 5 minutes');
    }

    console.log('\n🏁 End-to-End Test Complete');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

main();