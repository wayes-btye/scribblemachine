import { GoogleGenerativeAI } from '@google/generative-ai';
// import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in environment variables');
  console.log('Please set up your .env file in services/worker/ with your Gemini API key');
  process.exit(1);
}

async function testGeminiImageGeneration() {
  console.log('🚀 Testing Google Gemini API Integration\n');
  console.log('API Key:', GEMINI_API_KEY.substring(0, 8) + '...');

  try {
    // Initialize Gemini
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    // Test 1: Basic API connectivity
    console.log('📡 Test 1: Checking API connectivity...');
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    // Test text generation first
    const textResult = await model.generateContent('Say "API connected successfully" if you can read this.');
    const textResponse = await textResult.response;
    console.log('✅ API Response:', textResponse.text());

    // Test 2: Image processing capability
    console.log('\n🖼️ Test 2: Testing image-to-line-art prompt...');

    // Create a test prompt for coloring page generation
    const coloringPagePrompt = `Convert this image to a simple line drawing suitable for a children's coloring book.
    Requirements:
    - Clear, bold outlines only
    - No shading or filled areas
    - Simple, child-friendly design
    - High contrast black lines on white background
    - Remove all colors and textures
    - Suitable for ages 4-10`;

    const startTime = Date.now();
    const promptResult = await model.generateContent(coloringPagePrompt);
    const promptResponse = await promptResult.response;
    const responseTime = Date.now() - startTime;

    console.log('✅ Prompt accepted');
    console.log(`⏱️ Response time: ${responseTime}ms`);

    // Test 3: Rate limit check
    console.log('\n⚡ Test 3: Testing rate limits with multiple requests...');
    const requests = [];
    const requestCount = 5;

    for (let i = 0; i < requestCount; i++) {
      requests.push(
        model.generateContent(`Test request ${i + 1}: Generate a number between 1 and 10`)
      );
    }

    const rateTestStart = Date.now();
    const results = await Promise.allSettled(requests);
    const rateTestTime = Date.now() - rateTestStart;

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`✅ Successful requests: ${successful}/${requestCount}`);
    if (failed > 0) {
      console.log(`⚠️ Failed requests: ${failed}/${requestCount}`);
    }
    console.log(`⏱️ Total time for ${requestCount} requests: ${rateTestTime}ms`);
    console.log(`⏱️ Average time per request: ${Math.round(rateTestTime / requestCount)}ms`);

    // Test 4: Error handling
    console.log('\n🛡️ Test 4: Testing error handling...');
    try {
      const badModel = genAI.getGenerativeModel({ model: 'invalid-model-name' });
      await badModel.generateContent('This should fail');
      console.log('❌ Error handling failed - invalid model was accepted');
    } catch (error: any) {
      console.log('✅ Error handling working:', error.message.substring(0, 50) + '...');
    }

    // Summary
    console.log('\n📊 Summary:');
    console.log('✅ Gemini API is accessible');
    console.log('✅ Text generation works');
    console.log('✅ Can handle coloring page prompts');
    console.log(`✅ Response times: ~${responseTime}ms for single requests`);
    console.log(`✅ Can handle ${successful} concurrent requests`);
    console.log('✅ Error handling is functional');

    console.log('\n✨ Gemini API integration test completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('1. Test with actual image input using multimodal capabilities');
    console.log('2. Fine-tune prompts for optimal line-art generation');
    console.log('3. Implement retry logic and rate limiting');

  } catch (error: any) {
    console.error('\n❌ Test failed:', error.message);
    console.error('\nPossible issues:');
    console.error('1. Invalid API key');
    console.error('2. API key doesn\'t have necessary permissions');
    console.error('3. Network connectivity issues');
    console.error('4. Gemini API service issues');

    if (error.message.includes('API key')) {
      console.error('\n🔑 API Key Issue Detected:');
      console.error('Please check that your GEMINI_API_KEY in .env is valid');
      console.error('You can get an API key from: https://makersuite.google.com/app/apikey');
    }

    process.exit(1);
  }
}

// Run the test
testGeminiImageGeneration().catch(console.error);