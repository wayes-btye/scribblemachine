import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  process.exit(1);
}

/**
 * 🎨 TEXT-TO-IMAGE COLORING PAGE TEST
 *
 * 🎯 **Purpose**:
 * Test Gemini API's ability to generate coloring pages directly from text prompts
 * for the "Imagine An Idea" feature implementation.
 *
 * 📝 **What this tests**:
 * - Text-only input to coloring page generation
 * - Different complexity levels for coloring pages
 * - Age-appropriate output validation
 * - API response structure for text-to-image
 *
 * 💰 **Cost**: 3 API calls (3 different prompts)
 */

async function testTextToImageGeneration() {
  console.log('🎨 Testing Gemini Text-to-Image Coloring Page Generation\n');
  console.log('🎯 Purpose: Verify "Imagine An Idea" functionality for Phase 3B Extended\n');

  // Define output directory
  const outputDir = path.join(__dirname, '../test-output-text-to-image');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Test prompts that simulate user "Imagine An Idea" inputs
  const testPrompts = [
    {
      name: 'Simple-Castle',
      text: 'A princess castle',
      complexity: 'simple',
      expectedAge: '4-6',
      fullPrompt: `Create a simple black and white coloring page of a princess castle for children ages 4-6. Use very basic shapes with minimal detail. The castle should have simple towers, a door, and maybe some windows. Use thick, bold black outlines (3-4px width) on a pure white background. Remove all colors, shading, and textures. Make large, easy-to-color regions that are perfect for crayons. Simple cartoon style suitable for young children's coloring books.`
    },
    {
      name: 'Standard-Dog',
      text: 'A friendly dog playing in a park',
      complexity: 'standard',
      expectedAge: '6-10',
      fullPrompt: `Create a standard coloring page of a friendly dog playing in a park for children ages 6-10. Show a dog with moderate detail - clear features like ears, tail, eyes, and maybe a ball or stick. Include some simple park elements like trees or grass. Use medium-weight black lines (2-3px width) on a pure white background. Remove all colors, shading, and textures. Keep shapes manageable for coloring while maintaining the dog's character and park setting.`
    },
    {
      name: 'Detailed-Butterfly',
      text: 'A beautiful butterfly with flowers',
      complexity: 'detailed',
      expectedAge: '8-12',
      fullPrompt: `Create a detailed coloring page of a beautiful butterfly with flowers for children ages 8-12 and adults. Include intricate wing patterns, detailed flower petals, leaves, and background elements. Use thin, precise black lines (1-2px width) on a pure white background. Preserve fine details and complex patterns that can be colored separately. Remove all colors, shading, and textures but maintain the complex beauty suitable for detailed coloring work.`
    }
  ];

  try {
    // Initialize Gemini with IMAGE GENERATION model
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

    console.log(`📝 Testing ${testPrompts.length} text prompts...`);

    let successCount = 0;
    let errorCount = 0;

    for (const prompt of testPrompts) {
      console.log(`\n🎯 Testing: "${prompt.text}"`);
      console.log(`   Complexity: ${prompt.complexity} | Target age: ${prompt.expectedAge}`);
      console.log('─'.repeat(50));

      const startTime = Date.now();

      try {
        // Generate image content from TEXT ONLY (no image input)
        const result = await model.generateContent([
          {
            text: prompt.fullPrompt
          }
        ]);

        const response = await result.response;
        const responseTime = Date.now() - startTime;

        console.log(`   ✅ Response received in ${responseTime}ms`);

        // Check if we got image data back
        const candidates = response.candidates;
        if (candidates && candidates.length > 0) {
          const parts = candidates[0].content?.parts;
          if (parts && parts.length > 0) {
            let imageFound = false;

            for (const part of parts) {
              if (part.inlineData && part.inlineData.data) {
                // We got image data! Save it
                const imageData = part.inlineData.data;
                const outputFileName = `${prompt.name.toLowerCase()}_generated.png`;
                const outputPath = path.join(outputDir, outputFileName);

                // Convert base64 to buffer and save
                const imageBuffer = Buffer.from(imageData, 'base64');
                fs.writeFileSync(outputPath, imageBuffer);

                console.log(`   🎨 Generated image saved: ${outputFileName}`);
                console.log(`   📏 Generated image size: ${(imageBuffer.length / 1024).toFixed(1)} KB`);

                successCount++;
                imageFound = true;
                break;
              } else if (part.text) {
                // Got text response instead of image
                console.log(`   📝 Text response received instead of image`);
                console.log(`   Content: ${part.text.substring(0, 100)}...`);

                // Save text response for debugging
                const textFileName = `${prompt.name.toLowerCase()}_text_response.txt`;
                const textPath = path.join(outputDir, textFileName);
                fs.writeFileSync(textPath, `
Test Prompt: ${prompt.text}
Complexity: ${prompt.complexity}
Target Age: ${prompt.expectedAge}
Response Time: ${responseTime}ms
Full Prompt: ${prompt.fullPrompt}

Text Response:
${part.text}
                `.trim());
              }
            }

            if (!imageFound) {
              console.log(`   ⚠️  No image data in response for "${prompt.text}"`);
              errorCount++;
            }
          }
        }

      } catch (error: any) {
        console.log(`   ❌ Error with "${prompt.text}":`, error.message.substring(0, 100));
        errorCount++;

        // Log detailed error for debugging
        const errorFileName = `${prompt.name.toLowerCase()}_error.txt`;
        const errorPath = path.join(outputDir, errorFileName);
        fs.writeFileSync(errorPath, `
Error Details:
Prompt: ${prompt.text}
Complexity: ${prompt.complexity}
Full Prompt: ${prompt.fullPrompt}
Error Message: ${error.message}

Stack:
${error.stack}
        `.trim());
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 Text-to-Image Test Summary:');
    console.log('═'.repeat(60));
    console.log(`✅ Successful generations: ${successCount}/${testPrompts.length}`);
    console.log(`❌ Failed generations: ${errorCount}/${testPrompts.length}`);
    console.log(`🎨 Using Gemini 2.5 Flash Image for text-to-image generation`);
    console.log(`📁 Results saved in: ${outputDir}`);
    console.log(`💰 Cost: ${testPrompts.length} API calls`);

    console.log('\n🎯 Expected Results:');
    console.log('1. Generated PNG files with coloring page images from text prompts');
    console.log('2. Black and white line art suitable for different age groups');
    console.log('3. Clean outlines without colors or shading');
    console.log('4. Different complexity levels based on age targeting');

    console.log('\n📝 Next Steps:');
    console.log('1. Review generated images for quality and age-appropriateness');
    console.log('2. If successful, proceed with "Imagine An Idea" frontend implementation');
    console.log('3. If text responses instead of images, may need prompt refinement');

    // Verdict for implementation
    if (successCount === testPrompts.length) {
      console.log('\n🎉 VERDICT: ✅ Text-to-image generation FULLY SUPPORTED');
      console.log('   Ready to implement "Imagine An Idea" functionality!');
    } else if (successCount > 0) {
      console.log('\n⚠️  VERDICT: 🔶 Text-to-image generation PARTIALLY SUPPORTED');
      console.log('   May need prompt refinement or error handling');
    } else {
      console.log('\n❌ VERDICT: ❌ Text-to-image generation NOT SUPPORTED');
      console.log('   Need to investigate alternative approaches');
    }

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
testTextToImageGeneration().catch(console.error);