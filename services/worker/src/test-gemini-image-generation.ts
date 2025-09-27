import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';

/**
 * 🚨 **HIGH COST COMPREHENSIVE TEST** 🚨
 *
 * ⚠️ **API COST WARNING**:
 * This test uses 6 images × 3 prompts = 18 Gemini API calls!
 * This can be expensive and is NOT recommended for routine testing.
 *
 * 💰 **For cost-effective testing**, use test-gemini-single-image.ts instead
 * (1 image × 1 prompt = 1 API call = 95% cost reduction)
 *
 * 🎯 **Only use this test when**:
 * - Comprehensive validation of all test images is needed
 * - Testing multiple prompt variations
 * - Validating complete prompt matrix
 * - You understand and accept the API costs
 *
 * 🏷️ **Aliases**:
 * - `pnpm test:gemini:generate` (this file)
 * - `pnpm test:gemini:generate:full` (this file)
 * - `pnpm test:gemini:single` (cost-effective alternative)
 */

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  process.exit(1);
}

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

async function testGeminiImageGeneration() {
  console.log('🎨 Testing Gemini 2.5 Flash Image Generation for Coloring Pages\n');

  // Define test images directory
  const testImagesDir = path.join(__dirname, '../test-images');
  const outputDir = path.join(__dirname, '../test-output');

  // Create directories if they don't exist
  if (!fs.existsSync(testImagesDir)) {
    fs.mkdirSync(testImagesDir, { recursive: true });
    console.log(`📁 Created test images directory: ${testImagesDir}`);
    console.log('📝 Please add test images (JPG/PNG) to this directory:\n');
    console.log(`   ${testImagesDir}`);
    console.log('\nSuggested test images:');
    console.log('   - A photo of a person or pet');
    console.log('   - A landscape or nature photo');
    console.log('   - An object like a toy or vehicle');
    console.log('\nThen run this test again.\n');
    process.exit(0);
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Get test images
  const testImages = fs.readdirSync(testImagesDir)
    .filter(file => /\.(jpg|jpeg|png|webp)$/i.test(file));

  if (testImages.length === 0) {
    console.log('❌ No test images found!');
    console.log(`📝 Please add test images to: ${testImagesDir}`);
    console.log('\nSupported formats: JPG, JPEG, PNG, WEBP');
    process.exit(1);
  }

  console.log(`📷 Found ${testImages.length} test image(s)\n`);

  try {
    // Initialize Gemini with IMAGE GENERATION model (nano-banana)
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not set');
      return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

    // Process each test image
    for (const imageName of testImages) {
      console.log(`\n🖼️ Processing: ${imageName}`);
      console.log('─'.repeat(50));

      const imagePath = path.join(testImagesDir, imageName);
      const imageStats = fs.statSync(imagePath);
      console.log(`   File size: ${(imageStats.size / 1024).toFixed(1)} KB`);

      // Convert image to base64
      const { data: base64Image, mimeType } = await imageToBase64(imagePath);
      console.log(`   Converted to base64: ${(base64Image.length / 1024).toFixed(1)} KB`);

      // Different prompts to test for coloring page generation
      const prompts = [
        {
          name: 'Simple-Coloring',
          text: `Transform this image into a simple black and white coloring page for children ages 4-8. Create clean, bold black outlines on a white background. Remove all colors, shading, and textures. Simplify complex details into basic shapes that are easy for small children to color within. The lines should be thick (2-3px) and the shapes should be large enough for crayons. Make it a fun, cartoon-like version suitable for coloring books.`
        },
        {
          name: 'Detailed-LineArt',
          text: `Convert this photograph into a detailed black and white line art coloring page. Create precise black outlines that capture the main features and important details. Remove all colors and convert to clean line drawings on white background. The result should look like professional coloring book artwork - black outlines only, no shading or fills. Suitable for children ages 8-12 who can handle more detailed coloring.`
        },
        {
          name: 'Cartoon-Style',
          text: `Transform this photo into a fun cartoon-style coloring page. Simplify the image into bold, playful cartoon shapes with thick black outlines on white background. Make facial features exaggerated and friendly. Remove all colors and shading. The style should be similar to children's animated movies - simple, bold, and engaging for kids to color.`
        }
      ];

      // Test each prompt
      for (const prompt of prompts) {
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
                  const outputFileName = `${path.basename(imageName, path.extname(imageName))}_${prompt.name.toLowerCase()}_generated.png`;
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
                  const textFileName = `${path.basename(imageName, path.extname(imageName))}_${prompt.name.toLowerCase()}_text_response.txt`;
                  const textPath = path.join(outputDir, textFileName);
                  fs.writeFileSync(textPath, `
Test Image: ${imageName}
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
          const errorFileName = `${path.basename(imageName, path.extname(imageName))}_${prompt.name.toLowerCase()}_error.txt`;
          const errorPath = path.join(outputDir, errorFileName);
          fs.writeFileSync(errorPath, `
Error Details:
${error.message}

Stack:
${error.stack}
          `.trim());
        }
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Test Summary:');
    console.log('═'.repeat(60));
    console.log(`✅ Processed ${testImages.length} image(s)`);
    console.log(`🎨 Using Gemini 2.5 Flash Image (nano-banana) for actual image generation`);
    console.log(`📁 Results saved in: ${outputDir}`);

    console.log('\n🎯 Expected Results:');
    console.log('1. Generated PNG files with actual coloring page images');
    console.log('2. Black and white line art suitable for children');
    console.log('3. Clean outlines without colors or shading');
    console.log('\n📝 Next Steps:');
    console.log('1. Review generated images for quality and usability');
    console.log('2. Integrate best-performing prompts into main application');
    console.log('3. Set up fallback to edge detection for backup');

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
testGeminiImageGeneration().catch(console.error);