import { createGeminiService, GenerationRequest } from './services/gemini-service';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  process.exit(1);
}

async function imageToBase64(imagePath: string): Promise<{ data: string; mimeType: string }> {
  const processedImage = await sharp(imagePath)
    .resize(1024, 1024, {
      fit: 'inside',
      withoutEnlargement: true
    })
    .toBuffer();

  const base64 = processedImage.toString('base64');
  const mimeType = 'image/jpeg';

  return { data: base64, mimeType };
}

async function testGeminiServiceParameters() {
  console.log('🎨 Testing Gemini Service Parameter Variations\n');

  const testImagesDir = path.join(__dirname, '../test-images');
  const outputDir = path.join(__dirname, '../test-output-parameters');

  // Create directories if they don't exist
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
    console.log('📁 Please add test images to:', testImagesDir);
    process.exit(0);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get test images
  const testImages = fs.readdirSync(testImagesDir)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file))
    .slice(0, 2); // Test with first 2 images to avoid quota issues

  if (testImages.length === 0) {
    console.log('❌ No test images found!');
    process.exit(1);
  }

  console.log(`📷 Testing with ${testImages.length} image(s)\n`);

  // Initialize Gemini service
  const geminiService = createGeminiService(GEMINI_API_KEY);

  // All parameter combinations to test (PRD requirements)
  const parameterCombinations = [
    { complexity: 'simple', lineThickness: 'thick', description: 'Ages 4-6, easy coloring' },
    { complexity: 'simple', lineThickness: 'medium', description: 'Ages 4-6, standard tools' },
    { complexity: 'standard', lineThickness: 'medium', description: 'Ages 6-10, balanced' },
    { complexity: 'standard', lineThickness: 'thin', description: 'Ages 6-10, fine detail' },
    { complexity: 'detailed', lineThickness: 'thin', description: 'Ages 8-12, intricate work' },
    { complexity: 'detailed', lineThickness: 'medium', description: 'Ages 8-12, detailed but manageable' }
  ] as const;

  const results: Array<{
    image: string;
    complexity: string;
    lineThickness: string;
    success: boolean;
    responseTime: number;
    cost: number;
    error?: string;
  }> = [];

  // Test each image with each parameter combination
  for (const imageName of testImages) {
    console.log(`\n🖼️ Processing: ${imageName}`);
    console.log('─'.repeat(60));

    const imagePath = path.join(testImagesDir, imageName);
    const { data: base64Image, mimeType } = await imageToBase64(imagePath);

    for (const params of parameterCombinations) {
      console.log(`\n   🎯 Testing: ${params.complexity}/${params.lineThickness} (${params.description})`);

      const request: GenerationRequest = {
        imageBase64: base64Image,
        mimeType,
        complexity: params.complexity,
        lineThickness: params.lineThickness
      };

      try {
        const startTime = Date.now();
        const result = await geminiService.generateColoringPage(request);
        const totalTime = Date.now() - startTime;

        if (result.success && result.imageBase64) {
          // Save generated image
          const outputFileName = `${path.basename(imageName, path.extname(imageName))}_${params.complexity}_${params.lineThickness}.png`;
          const outputPath = path.join(outputDir, outputFileName);

          const imageBuffer = Buffer.from(result.imageBase64, 'base64');
          fs.writeFileSync(outputPath, imageBuffer);

          console.log(`   ✅ Success in ${result.metadata.responseTimeMs}ms (total: ${totalTime}ms)`);
          console.log(`   💰 Cost: $${result.metadata.cost.toFixed(3)}`);
          console.log(`   📁 Saved: ${outputFileName} (${(imageBuffer.length / 1024).toFixed(1)} KB)`);

          results.push({
            image: imageName,
            complexity: params.complexity,
            lineThickness: params.lineThickness,
            success: true,
            responseTime: result.metadata.responseTimeMs,
            cost: result.metadata.cost
          });

        } else {
          console.log(`   ❌ Failed: ${result.error?.message || 'Unknown error'}`);
          console.log(`   💰 Cost: $${result.metadata.cost.toFixed(3)}`);

          results.push({
            image: imageName,
            complexity: params.complexity,
            lineThickness: params.lineThickness,
            success: false,
            responseTime: result.metadata.responseTimeMs,
            cost: result.metadata.cost,
            error: result.error?.message
          });
        }

        // Delay between requests to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error: any) {
        console.log(`   ❌ Exception: ${error.message}`);

        results.push({
          image: imageName,
          complexity: params.complexity,
          lineThickness: params.lineThickness,
          success: false,
          responseTime: 0,
          cost: 0,
          error: error.message
        });
      }
    }
  }

  // Generate comprehensive report
  console.log('\n' + '═'.repeat(80));
  console.log('📊 PARAMETER TESTING RESULTS');
  console.log('═'.repeat(80));

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful generations: ${successful.length}/${results.length}`);
  console.log(`❌ Failed generations: ${failed.length}/${results.length}`);

  if (successful.length > 0) {
    const avgResponseTime = successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length;
    const totalCost = successful.reduce((sum, r) => sum + r.cost, 0);

    console.log(`⏱️ Average response time: ${Math.round(avgResponseTime)}ms`);
    console.log(`💰 Total cost: $${totalCost.toFixed(3)}`);

    // Performance by complexity
    console.log('\n📈 Performance by Complexity:');
    ['simple', 'standard', 'detailed'].forEach(complexity => {
      const complexityResults = successful.filter(r => r.complexity === complexity);
      if (complexityResults.length > 0) {
        const avgTime = complexityResults.reduce((sum, r) => sum + r.responseTime, 0) / complexityResults.length;
        console.log(`   ${complexity}: ${Math.round(avgTime)}ms avg (${complexityResults.length} samples)`);
      }
    });

    // Performance by line thickness
    console.log('\n📏 Performance by Line Thickness:');
    ['thin', 'medium', 'thick'].forEach(thickness => {
      const thicknessResults = successful.filter(r => r.lineThickness === thickness);
      if (thicknessResults.length > 0) {
        const avgTime = thicknessResults.reduce((sum, r) => sum + r.responseTime, 0) / thicknessResults.length;
        console.log(`   ${thickness}: ${Math.round(avgTime)}ms avg (${thicknessResults.length} samples)`);
      }
    });
  }

  if (failed.length > 0) {
    console.log('\n❌ Failure Analysis:');
    const errorCounts = failed.reduce((acc, r) => {
      const errorType = r.error?.split(':')[0] || 'Unknown';
      acc[errorType] = (acc[errorType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(errorCounts).forEach(([error, count]) => {
      console.log(`   ${error}: ${count} occurrence(s)`);
    });
  }

  // Save detailed results
  const reportPath = path.join(outputDir, 'parameter_test_results.json');
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      avgResponseTime: successful.length > 0 ? successful.reduce((sum, r) => sum + r.responseTime, 0) / successful.length : 0,
      totalCost: successful.reduce((sum, r) => sum + r.cost, 0)
    },
    results
  }, null, 2));

  console.log(`\n📁 Detailed results saved to: ${reportPath}`);
  console.log(`📁 Generated images saved to: ${outputDir}`);

  console.log('\n🎯 Next Steps:');
  console.log('1. Review generated images for quality differences between parameter combinations');
  console.log('2. Validate that complexity and line thickness parameters produce expected variations');
  console.log('3. Ensure cost tracking is accurate ($0.039 per successful generation)');
  console.log('4. Test error handling and retry logic with edge cases');
}

// Run the test
testGeminiServiceParameters().catch(console.error);