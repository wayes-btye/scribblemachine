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

async function testGeminiImageToLineArt() {
  console.log('🎨 Testing Gemini Image-to-Line-Art Conversion\n');

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
    // Initialize Gemini with vision model
    if (!GEMINI_API_KEY) {
      console.error('❌ GEMINI_API_KEY is not set');
      return;
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

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

      // Different prompts to test
      const prompts = [
        {
          name: 'Simple',
          text: `Convert this image into a simple coloring page for children. Create clean black outlines on a white background. Remove all colors, shading, and textures. Make it suitable for kids ages 4-8 to color in.`
        },
        {
          name: 'Detailed',
          text: `Transform this image into a detailed coloring book page. Create clear, bold black lines that define all major shapes and features. Ensure the lines are thick enough for children to color within. Remove all colors and gradients, leaving only outlines. The result should be a black and white line drawing suitable for printing and coloring.`
        },
        {
          name: 'Cartoon-style',
          text: `Convert this photo into a cartoon-style coloring page. Simplify complex details into basic shapes that children can easily color. Use thick, bold outlines. Remove all shading and colors. Make it fun and engaging for kids aged 5-10.`
        }
      ];

      // Test each prompt
      for (const prompt of prompts) {
        console.log(`\n   🎯 Testing "${prompt.name}" prompt...`);

        const startTime = Date.now();

        try {
          // Generate content with image
          const result = await model.generateContent([
            prompt.text,
            {
              inlineData: {
                data: base64Image,
                mimeType: mimeType
              }
            }
          ]);

          const response = await result.response;
          const responseTime = Date.now() - startTime;

          console.log(`   ✅ Response received in ${responseTime}ms`);

          // Get the text response (which should describe what was generated)
          const responseText = response.text();

          // Save response details
          const resultFileName = `${path.basename(imageName, path.extname(imageName))}_${prompt.name.toLowerCase()}_result.txt`;
          const resultPath = path.join(outputDir, resultFileName);

          fs.writeFileSync(resultPath, `
Test Image: ${imageName}
Prompt Type: ${prompt.name}
Response Time: ${responseTime}ms
Prompt: ${prompt.text}

Response:
${responseText}

Note: Gemini 1.5 Flash returns text descriptions of what it would generate.
For actual image generation, you would need to use Gemini's image generation endpoints
or integrate with other services like Stability AI or DALL-E.
          `.trim());

          console.log(`   📝 Results saved to: ${resultFileName}`);

        } catch (error: any) {
          console.log(`   ❌ Error with "${prompt.name}" prompt:`, error.message.substring(0, 100));
        }
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Test Summary:');
    console.log('═'.repeat(60));
    console.log(`✅ Processed ${testImages.length} image(s)`);
    console.log(`✅ Gemini API is responding to image inputs`);
    console.log(`📁 Results saved in: ${outputDir}`);

    console.log('\n⚠️ Important Notes:');
    console.log('1. Gemini 1.5 Flash can analyze images but does not generate images');
    console.log('2. For actual line-art generation, consider:');
    console.log('   - Using Gemini 2.0 with Imagen 3 (when available)');
    console.log('   - Integrating Stability AI or DALL-E for image generation');
    console.log('   - Using edge detection algorithms (OpenCV/Sharp) as fallback');
    console.log('\n📝 Next Steps:');
    console.log('1. Implement edge detection with Sharp as immediate solution');
    console.log('2. Research Gemini 2.0 Imagen 3 API availability');
    console.log('3. Consider hybrid approach: Gemini for prompts + edge detection');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);

    if (error.message.includes('API key')) {
      console.error('\n🔑 API Key Issue Detected');
    } else if (error.message.includes('model')) {
      console.error('\n🤖 Model Issue - Try using gemini-pro-vision or gemini-1.5-pro');
    }

    process.exit(1);
  }
}

// Run the test
testGeminiImageToLineArt().catch(console.error);