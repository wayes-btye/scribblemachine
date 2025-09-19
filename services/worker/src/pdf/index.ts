import PgBoss from 'pg-boss';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@coloringpage/database';
import { PaperSize } from '@coloringpage/types';
import { config } from '@coloringpage/config';
import PDFDocument from 'pdfkit';
import sharp from 'sharp';

interface PDFJobData {
  user_id: string;
  job_id: string;
  paper_size: PaperSize;
  title?: string;
}

export async function setupPDFWorker(
  boss: PgBoss,
  supabase: SupabaseClient<Database>
) {
  await boss.work('pdf-generation', { teamSize: 2 }, async (job) => {
    const { user_id, job_id, paper_size, title } = job.data as PDFJobData;

    try {
      console.log(`📄 Generating PDF for job ${job_id}`);

      // Get edge map
      const { data: assets } = await supabase
        .from('assets')
        .select('storage_path')
        .eq('user_id', user_id)
        .eq('kind', 'edge_map')
        .order('created_at', { ascending: false })
        .limit(1);

      if (!assets || assets.length === 0) {
        throw new Error('No edge map found');
      }

      const { data: imageData } = await supabase.storage
        .from('intermediates')
        .download(assets[0].storage_path);

      if (!imageData) {
        throw new Error('Failed to download edge map');
      }

      // Get paper dimensions
      const paperConfig = config.pdf[paper_size.toLowerCase() as keyof typeof config.pdf];
      if (!paperConfig || typeof paperConfig !== 'object') {
        throw new Error(`Invalid paper size: ${paper_size}`);
      }

      const { width: paperWidth, height: paperHeight } = paperConfig;
      const marginPoints = (config.pdf.marginMM / 25.4) * 72; // Convert mm to points

      // Process image for PDF
      const buffer = Buffer.from(await imageData.arrayBuffer());
      const processedImage = await sharp(buffer)
        .resize(
          Math.floor(paperWidth - marginPoints * 2),
          Math.floor(paperHeight - marginPoints * 2),
          {
            fit: 'inside',
            withoutEnlargement: true,
          }
        )
        .png()
        .toBuffer();

      // Create PDF
      const doc = new PDFDocument({
        size: [paperWidth, paperHeight],
        margins: {
          top: marginPoints,
          bottom: marginPoints,
          left: marginPoints,
          right: marginPoints,
        },
      });

      // Add title if provided
      if (title) {
        doc.fontSize(16).text(title, { align: 'center' });
        doc.moveDown();
      }

      // Add image
      const imageMetadata = await sharp(processedImage).metadata();
      const imageWidth = imageMetadata.width!;
      const imageHeight = imageMetadata.height!;

      // Center the image
      const x = (paperWidth - imageWidth) / 2;
      const y = title ? doc.y : (paperHeight - imageHeight) / 2;

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

      // Upload PDF
      const pdfPath = `${user_id}/${job_id}/coloring_page.pdf`;
      const { error: uploadError } = await supabase.storage
        .from('artifacts')
        .upload(pdfPath, pdfBuffer, {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        throw new Error(`Failed to upload PDF: ${uploadError.message}`);
      }

      // Create PDF asset record
      await supabase.from('assets').insert({
        user_id,
        kind: 'pdf',
        storage_path: pdfPath,
        bytes: pdfBuffer.length,
      });

      console.log(`✅ PDF generated for job ${job_id}`);
    } catch (error) {
      console.error(`❌ PDF generation failed for job ${job_id}:`, error);
      throw error;
    }
  });

  console.log('📄 PDF generation worker registered');
}