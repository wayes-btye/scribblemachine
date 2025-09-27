import { GoogleGenerativeAI } from '@google/generative-ai';
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

/**
 * 🏷️ COST-EFFECTIVE SINGLE IMAGE TEST
 *
 * ⚠️ **API COST WARNING**:
 * This is the RECOMMENDED test for routine backend validation.
 * - Uses: 1 image + 1 prompt = 1 API call
 * - Alternative: test-gemini-image-generation.ts uses 6 images × 3 prompts = 18 API calls
 *
 * 🎯 **When to use**:
 * - Routine backend testing and validation
 * - AI agent automated testing
 * - Development workflow testing
 * - Code extraction and integration work
 *
 * 🚨 **For comprehensive testing**, use test-gemini-image-generation.ts
 * (but be aware of the 18x higher API costs)
 */

// Function to convert image to base64
async function imageToBase64(imagePath: string): Promise<{ data: string; mimeType: string }> {
  // Resize image if needed to optimize API calls
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

async function testGeminiSingleImageGeneration() {
  console.log('🎨 Testing Gemini 2.5 Flash Image Generation - SINGLE IMAGE TEST\n');
  console.log('💰 Cost-effective version: 1 image + 1 prompt = 1 API call');
  console.log('   (Compare to full test: 6 images × 3 prompts = 18 API calls)\n');

  // Define test images directory
  const testImagesDir = path.join(__dirname, '../test-images');
  const outputDir = path.join(__dirname, '../test-output-single');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Use specific test image that's known to work well
  const testImageName = 'blue-girl-smile.jpg';
  const imagePath = path.join(testImagesDir, testImageName);

  if (!fs.existsSync(imagePath)) {
    console.error(`❌ Test image not found: ${imagePath}`);
    console.error('💡 Expected test image: blue-girl-smile.jpg');
    console.error(`📁 Check directory: ${testImagesDir}`);
    process.exit(1);
  }

  console.log(`📷 Using test image: ${testImageName}`);

  try {
    // Initialize Gemini with IMAGE GENERATION model
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not set');
      return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

    console.log(`\n🖼️ Processing: ${testImageName}`);
    console.log('─'.repeat(50));

    const imageStats = fs.statSync(imagePath);
    console.log(`   File size: ${(imageStats.size / 1024).toFixed(1)} KB`);

    // Convert image to base64
    const { data: base64Image, mimeType } = await imageToBase64(imagePath);
    console.log(`   Converted to base64: ${(base64Image.length / 1024).toFixed(1)} KB`);

    // Use the most reliable prompt from the full test suite
    const prompt = {
      name: 'Simple-Coloring',
      text: `Transform this image into a simple black and white coloring page for children ages 4-8. Create clean, bold black outlines on a white background. Remove all colors, shading, and textures. Simplify complex details into basic shapes that are easy for small children to color within. The lines should be thick (2-3px) and the shapes should be large enough for crayons. Make it a fun, cartoon-like version suitable for coloring books.`
    };

    console.log(`\n   🎯 Testing "${prompt.name}" generation...`);

    const startTime = Date.now();

    try {
      // Generate image content with the source image and transformation prompt
      const result = await model.generateContent([
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType
          }
        },
        prompt.text
      ]);

      const response = await result.response;
      const responseTime = Date.now() - startTime;

      console.log(`   ✅ Response received in ${responseTime}ms`);

      // Check if we got image data back
      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content?.parts;
        if (parts && parts.length > 0) {
          for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
              // We got image data! Save it
              const imageData = part.inlineData.data;
              const outputFileName = `${path.basename(testImageName, path.extname(testImageName))}_${prompt.name.toLowerCase()}_generated.png`;
              const outputPath = path.join(outputDir, outputFileName);

              // Convert base64 to buffer and save
              const imageBuffer = Buffer.from(imageData, 'base64');
              fs.writeFileSync(outputPath, imageBuffer);

              console.log(`   🎨 Generated image saved: ${outputFileName}`);
              console.log(`   📏 Generated image size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);
            } else if (part.text) {
              // Got text response instead of image
              console.log(`   📝 Text response: ${part.text.substring(0, 100)}...`);

              // Save text response for debugging
              const textFileName = `${path.basename(testImageName, path.extname(testImageName))}_${prompt.name.toLowerCase()}_text_response.txt`;
              const textPath = path.join(outputDir, textFileName);
              fs.writeFileSync(textPath, `
Test Image: ${testImageName}
Prompt Type: ${prompt.name}
Response Time: ${responseTime}ms
Prompt: ${prompt.text}

Text Response:
${part.text}
              `.trim());
            }
          }
        }
      }

    } catch (error: any) {
      console.log(`   ❌ Error with "${prompt.name}" generation:`, error.message.substring(0, 100));

      // Log detailed error for debugging
      const errorFileName = `${path.basename(testImageName, path.extname(testImageName))}_${prompt.name.toLowerCase()}_error.txt`;
      const errorPath = path.join(outputDir, errorFileName);
      fs.writeFileSync(errorPath, `
Error Details:
${error.message}

Stack:
${error.stack}
      `.trim());
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Single Image Test Summary:');
    console.log('═'.repeat(60));
    console.log(`✅ Processed 1 image with 1 prompt (1 API call)`);
    console.log(`🎨 Using Gemini 2.5 Flash Image for actual image generation`);
    console.log(`📁 Results saved in: ${outputDir}`);
    console.log(`💰 Cost: ~1 API call (vs 18 calls in full test)`);

    console.log('\n🎯 Expected Results:');
    console.log('1. Generated PNG file with coloring page image');
    console.log('2. Black and white line art suitable for children');
    console.log('3. Clean outlines without colors or shading');

    console.log('\n📝 Next Steps:');
    console.log('1. Review generated image for quality and usability');
    console.log('2. Use this test for routine backend validation');
    console.log('3. For comprehensive testing, run test-gemini-image-generation.ts');
    console.log('   (but note: 18x higher API costs)');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);

    if (error.message.includes('API key')) {
      console.error('\n🔑 API Key Issue Detected');
      console.error('Make sure your API key has access to Gemini 2.5 Flash Image');
    } else if (error.message.includes('model')) {
      console.error('\n🤖 Model Issue - Make sure you have access to gemini-2.5-flash-image-preview');
      console.error('This model may require special access or billing setup');
    } else if (error.message.includes('quota') || error.message.includes('limit')) {
      console.error('\n📊 Quota/Rate Limit Issue');
      console.error('You may have hit API usage limits for image generation');
    }

    process.exit(1);
  }
}

// Run the test
testGeminiSingleImageGeneration().catch(console.error);