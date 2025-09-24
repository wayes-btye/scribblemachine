import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { validateEnv, config } from '@coloringpage/config';
import { createSupabaseAdminClient } from '@coloringpage/database';
import { createGeminiService, GenerationRequest, TextGenerationRequest, EditRequest } from './services/gemini-service';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

interface Job {
  id: string;
  user_id: string;
  status: string;
  params_json: {
    asset_id?: string; // Optional for text-based jobs
    text_prompt?: string; // For text-to-image jobs
    edit_parent_id?: string; // For edit jobs
    edit_prompt?: string; // For edit jobs
    edit_source_asset_id?: string; // For edit jobs
    complexity: 'simple' | 'standard' | 'detailed';
    line_thickness: 'thin' | 'medium' | 'thick';
    custom_prompt?: string;
  };
  created_at: string;
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
          // Enhanced debug: Check total job counts periodically
          const { data: recentJobs } = await supabase
            .from('jobs')
            .select('id, status, created_at, params_json')
            .order('created_at', { ascending: false })
            .limit(5);

          const timestamp = new Date().toISOString();
          console.log(`[${timestamp}] 📊 No queued jobs. Recent jobs:`,
            recentJobs?.map(j => `${j.id.substring(0,8)}:${j.status}${j.params_json?.edit_parent_id ? ':EDIT' : ''}`) || 'none');
          return; // No jobs to process
        }

        const job = jobs[0] as Job;
        const jobType = job.params_json.edit_parent_id ? 'EDIT' :
                       job.params_json.text_prompt ? 'TEXT' : 'IMAGE';
        console.log(`🎨 Processing ${jobType} job ${job.id} for user ${job.user_id}`);

        if (jobType === 'EDIT') {
          console.log(`🔧 EDIT DETAILS: parent=${job.params_json.edit_parent_id}, prompt="${job.params_json.edit_prompt}", source_asset=${job.params_json.edit_source_asset_id}`);
        }

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
    let result;

    // Check if this is a text-based job or image-based job
    if (job.params_json.text_prompt) {
      // Text-to-image generation
      console.log(`  Text prompt: "${job.params_json.text_prompt}"`);

      const textRequest: TextGenerationRequest = {
        textPrompt: job.params_json.text_prompt,
        complexity: job.params_json.complexity,
        lineThickness: job.params_json.line_thickness
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
        .eq('id', job.params_json.edit_source_asset_id);

      console.log(`🔍 DEBUG: Assets for source ID ${job.params_json.edit_source_asset_id}:`, allAssets);

      // Get the source edge map asset for editing
      const { data: sourceAsset, error: sourceAssetError } = await supabase
        .from('assets')
        .select('storage_path')
        .eq('id', job.params_json.edit_source_asset_id)
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
        .download(sourceAsset.storage_path);

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
        editPrompt: job.params_json.edit_prompt,
        complexity: job.params_json.complexity,
        lineThickness: job.params_json.line_thickness,
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
    const { error: insertError } = await supabase.from('assets').insert({
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
        const { error: pdfInsertError } = await supabase.from('assets').insert({
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