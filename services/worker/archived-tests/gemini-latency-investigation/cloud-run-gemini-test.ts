import { GoogleGenerativeAI } from '@google/generative-ai';
import * as http from 'http';

/**
 * 🎯 CLOUD RUN GEMINI API LATENCY TEST
 *
 * Purpose: Run this FROM Cloud Run to measure actual Gemini API latency
 * in production environment vs local development.
 *
 * This is a standalone HTTP server that can be deployed to Cloud Run
 * to definitively prove whether the latency issue is Cloud Run specific.
 */

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function runGeminiTest() {
  console.log('🎨 Starting Gemini API latency test from Cloud Run...');
  console.log(`📍 Running from: ${process.env.K_SERVICE || 'local'}`);
  console.log(`🌍 Region: ${process.env.FUNCTION_REGION || process.env.REGION || 'unknown'}`);

  const testPrompt = `Create a simple black and white coloring page of a cat for children ages 6-10. Use medium-weight black lines (2-3px width) on a pure white background. Remove all colors, shading, and textures. Make it suitable for printing and coloring with crayons.`;

  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash-image-preview' });

    console.log('⏱️  [START] Gemini API call starting...');
    const startTime = Date.now();

    const result = await model.generateContent([
      {
        text: testPrompt
      }
    ]);

    const duration = Date.now() - startTime;
    const durationSeconds = (duration / 1000).toFixed(2);

    console.log(`⏱️  [END] Gemini API call completed in ${duration}ms (${durationSeconds}s)`);

    const response = await result.response;
    const candidates = response.candidates;

    let imageGenerated = false;
    if (candidates && candidates.length > 0) {
      const parts = candidates[0].content?.parts;
      if (parts) {
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            const imageSizeKB = (part.inlineData.data.length * 0.75 / 1024).toFixed(1);
            console.log(`✅ Image generated successfully (${imageSizeKB} KB)`);
            imageGenerated = true;
            break;
          }
        }
      }
    }

    // Performance analysis
    console.log('\n📊 Performance Analysis:');
    console.log(`   Duration: ${duration}ms (${durationSeconds}s)`);
    console.log(`   Image generated: ${imageGenerated ? 'Yes' : 'No'}`);

    if (duration > 60000) {
      console.log('   Status: 🚨 CRITICAL - Extremely slow (>60s)');
    } else if (duration > 10000) {
      console.log('   Status: 🐢 SLOW - Should be investigated (>10s)');
    } else {
      console.log('   Status: ✅ GOOD - Normal performance (<10s)');
    }

    // Compare with expected local performance
    const localExpected = 5000; // 5 seconds
    const slowdownFactor = (duration / localExpected).toFixed(1);
    console.log(`   Slowdown vs local: ${slowdownFactor}x`);

    return {
      success: true,
      duration,
      durationSeconds,
      imageGenerated,
      slowdownFactor,
      environment: process.env.K_SERVICE || 'local',
      region: process.env.FUNCTION_REGION || process.env.REGION || 'unknown'
    };

  } catch (error: any) {
    console.error('❌ Gemini API test failed:', error.message);
    return {
      success: false,
      error: error.message,
      environment: process.env.K_SERVICE || 'local'
    };
  }
}

// Create HTTP server for Cloud Run
const server = http.createServer(async (req, res) => {
  console.log(`📥 Request received: ${req.method} ${req.url}`);

  // Health check endpoint
  if (req.url === '/health' || req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      service: 'gemini-api-latency-test',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // Test endpoint
  if (req.url === '/test' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });

    console.log('🚀 Starting Gemini API latency test...');
    const result = await runGeminiTest();

    res.end(JSON.stringify(result, null, 2));
    return;
  }

  // Not found
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found. Try /test or /health' }));
});

server.listen(PORT, () => {
  console.log(`🚀 Gemini API latency test server listening on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.K_SERVICE || 'local'}`);
  console.log(`\n🔍 Available endpoints:`);
  console.log(`   GET /health - Health check`);
  console.log(`   GET /test   - Run Gemini API latency test`);
  console.log(`\n💡 Usage:`);
  console.log(`   curl https://your-service-url.run.app/test`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('⏸️  SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});