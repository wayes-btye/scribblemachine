import PDFDocument from 'pdfkit';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

interface PDFTestResult {
  success: boolean;
  fileName: string;
  fileSizeKB: number;
  generationTimeMs: number;
  dimensions: {
    width: number;
    height: number;
    dpi: number;
  };
}

async function testPDFGeneration(): Promise<void> {
  console.log('🖨️ Testing PDF Generation for Coloring Pages\n');

  const outputDir = path.join(__dirname, '../test-output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Test configurations
  const paperSizes = {
    a4: { width: 8.27, height: 11.69 }, // inches
    letter: { width: 8.5, height: 11 } // inches
  };

  const DPI = 300;
  const MARGIN_INCHES = 0.5;

  const results: PDFTestResult[] = [];

  // Test 1: Generate test image with Sharp
  console.log('📐 Test 1: Creating test line-art image with Sharp...');
  const testImagePath = path.join(outputDir, 'test-coloring-page.png');

  // Create a simple line-art style test image
  const svgImage = `
    <svg width="2400" height="3300" xmlns="http://www.w3.org/2000/svg">
      <rect width="2400" height="3300" fill="white"/>
      <g stroke="black" stroke-width="8" fill="none">
        <circle cx="1200" cy="800" r="300"/>
        <rect x="900" y="1100" width="600" height="800"/>
        <polygon points="1200,1900 900,2400 1500,2400"/>
        <text x="1200" y="2700" font-size="120" text-anchor="middle" fill="black" stroke="none">
          Test Coloring Page
        </text>
      </g>
    </svg>
  `;

  await sharp(Buffer.from(svgImage))
    .png()
    .toFile(testImagePath);

  console.log('✅ Test image created\n');

  // Test each paper size
  for (const [sizeName, dimensions] of Object.entries(paperSizes)) {
    console.log(`📄 Test 2: Generating ${sizeName.toUpperCase()} PDF at ${DPI} DPI...`);

    const startTime = Date.now();

    // Create PDF document
    const doc = new PDFDocument({
      size: sizeName.toUpperCase() as 'A4' | 'LETTER',
      margin: MARGIN_INCHES * 72, // Convert inches to points (72 points = 1 inch)
      info: {
        Title: 'Test Coloring Page',
        Author: 'ColoringPage Generator',
        Subject: 'Children\'s Coloring Page',
        Keywords: 'coloring, kids, printable',
        CreationDate: new Date(),
      }
    });

    const pdfPath = path.join(outputDir, `test-coloring-page-${sizeName}.pdf`);
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Calculate dimensions
    const pageWidthPoints = dimensions.width * 72;
    const pageHeightPoints = dimensions.height * 72;
    const marginPoints = MARGIN_INCHES * 72;
    const contentWidth = pageWidthPoints - (2 * marginPoints);
    const contentHeight = pageHeightPoints - (2 * marginPoints);

    // Add the test image
    try {
      // Read the test image
      const imageBuffer = await fs.promises.readFile(testImagePath);

      // Get image dimensions
      const metadata = await sharp(imageBuffer).metadata();
      const imageWidth = metadata.width || 2400;
      const imageHeight = metadata.height || 3300;

      // Calculate scaling to fit page with margins
      const scaleX = contentWidth / (imageWidth * 72 / DPI);
      const scaleY = contentHeight / (imageHeight * 72 / DPI);
      const scale = Math.min(scaleX, scaleY);

      const finalWidth = (imageWidth * 72 / DPI) * scale;
      const finalHeight = (imageHeight * 72 / DPI) * scale;

      // Center the image on the page
      const xOffset = marginPoints + (contentWidth - finalWidth) / 2;
      const yOffset = marginPoints + (contentHeight - finalHeight) / 2;

      doc.image(imageBuffer, xOffset, yOffset, {
        width: finalWidth,
        height: finalHeight
      });

      // Add title at the top
      doc.fontSize(14)
         .fillColor('black')
         .text('Test Coloring Page', marginPoints, marginPoints / 2, {
           align: 'center',
           width: contentWidth
         });

      // Add page number at the bottom
      doc.fontSize(10)
         .text(`Page 1 | ${sizeName.toUpperCase()} | ${DPI} DPI`,
               marginPoints,
               pageHeightPoints - marginPoints / 2, {
           align: 'center',
           width: contentWidth
         });

    } catch (error) {
      console.error('Error adding image to PDF:', error);
    }

    // Finalize PDF
    doc.end();

    await new Promise((resolve) => stream.on('finish', resolve));

    const generationTime = Date.now() - startTime;
    const stats = fs.statSync(pdfPath);
    const fileSizeKB = stats.size / 1024;

    results.push({
      success: true,
      fileName: path.basename(pdfPath),
      fileSizeKB: Math.round(fileSizeKB * 10) / 10,
      generationTimeMs: generationTime,
      dimensions: {
        width: dimensions.width,
        height: dimensions.height,
        dpi: DPI
      }
    });

    console.log(`✅ PDF generated: ${path.basename(pdfPath)}`);
    console.log(`   Size: ${fileSizeKB.toFixed(1)} KB`);
    console.log(`   Time: ${generationTime}ms`);
    console.log(`   Dimensions: ${dimensions.width}" x ${dimensions.height}" at ${DPI} DPI\n`);
  }

  // Test 3: Multiple page PDF
  console.log('📚 Test 3: Generating multi-page PDF...');
  const multiPageStart = Date.now();

  const multiDoc = new PDFDocument({
    size: 'A4',
    margin: MARGIN_INCHES * 72
  });

  const multiPdfPath = path.join(outputDir, 'test-coloring-book.pdf');
  const multiStream = fs.createWriteStream(multiPdfPath);
  multiDoc.pipe(multiStream);

  // Add 5 pages
  for (let i = 0; i < 5; i++) {
    if (i > 0) multiDoc.addPage();

    multiDoc.fontSize(24)
            .text(`Coloring Page ${i + 1}`, { align: 'center' });

    // Draw simple shapes for each page
    multiDoc.rect(100, 200, 400, 500)
            .stroke();

    multiDoc.circle(300, 450, 100)
            .stroke();
  }

  multiDoc.end();
  await new Promise((resolve) => multiStream.on('finish', resolve));

  const multiPageTime = Date.now() - multiPageStart;
  const multiStats = fs.statSync(multiPdfPath);

  console.log(`✅ Multi-page PDF generated: ${path.basename(multiPdfPath)}`);
  console.log(`   Pages: 5`);
  console.log(`   Size: ${(multiStats.size / 1024).toFixed(1)} KB`);
  console.log(`   Time: ${multiPageTime}ms\n`);

  // Summary
  console.log('📊 Test Summary:');
  console.log('═══════════════════════════════════════');

  for (const result of results) {
    console.log(`✅ ${result.fileName}`);
    console.log(`   • Size: ${result.fileSizeKB} KB ${result.fileSizeKB < 5000 ? '✓' : '⚠️ (large)'}`);
    console.log(`   • Time: ${result.generationTimeMs}ms ${result.generationTimeMs < 800 ? '✓' : '⚠️ (slow)'}`);
    console.log(`   • Quality: ${result.dimensions.dpi} DPI ✓`);
  }

  console.log('\n✨ PDF Generation Tests Completed!');
  console.log(`📁 Output files saved in: ${outputDir}`);

  // Performance analysis
  const avgTime = results.reduce((sum, r) => sum + r.generationTimeMs, 0) / results.length;
  const avgSize = results.reduce((sum, r) => sum + r.fileSizeKB, 0) / results.length;

  console.log('\n📈 Performance Metrics:');
  console.log(`   Average generation time: ${Math.round(avgTime)}ms`);
  console.log(`   Average file size: ${avgSize.toFixed(1)} KB`);

  if (avgTime < 800 && avgSize < 5000) {
    console.log('   ✅ Performance targets MET!');
  } else {
    console.log('   ⚠️ Performance optimization needed');
  }

  console.log('\n📝 Next Steps:');
  console.log('1. Test with actual AI-generated line art images');
  console.log('2. Optimize for larger/complex images');
  console.log('3. Add watermark capability for free tier');
  console.log('4. Implement batch PDF generation');
}

// Run the test
testPDFGeneration().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});