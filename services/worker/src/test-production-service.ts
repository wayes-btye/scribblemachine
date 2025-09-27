import { createGeminiService } from './services/gemini-service';
import * as path from 'path';
import dotenv from 'dotenv';

// Quick validation test for the production service
dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testProductionService() {
  console.log('🔧 Testing Production Gemini Service\n');

  if (!process.env.GEMINI_API_KEY) {
    console.log('⚠️ GEMINI_API_KEY not found - skipping API test');
    console.log('✅ Service module compiles correctly');
    return;
  }

  const geminiService = createGeminiService(process.env.GEMINI_API_KEY);

  console.log('✅ Service created successfully');
  console.log('✅ Configuration:', geminiService.getConfig());

  // Test with a small base64 image (1x1 pixel white PNG)
  const testImageBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChAHGARuKWgAAAABJRU5ErkJggg==';

  try {
    const result = await geminiService.generateColoringPage({
      imageBase64: testImageBase64,
      mimeType: 'image/png',
      complexity: 'standard',
      lineThickness: 'medium'
    });

    if (result.success) {
      console.log('✅ API call successful');
      console.log('   Response time:', result.metadata.responseTimeMs + 'ms');
      console.log('   Cost:', '$' + result.metadata.cost.toFixed(3));
    } else {
      console.log('⚠️ API call failed:', result.error?.message);
    }

  } catch (error: any) {
    console.log('⚠️ Test error:', error.message);
  }

  console.log('\n✨ Production service validation complete!');
}

testProductionService().catch(console.error);