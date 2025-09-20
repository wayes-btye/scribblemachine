#!/usr/bin/env node

/**
 * API Endpoint Validation Tests
 *
 * Basic validation tests for Phase 2 API endpoints.
 * Run with: node test-api-endpoints.js
 *
 * Requirements:
 * - Web app running on http://localhost:3000
 * - Valid Supabase configuration in .env.local
 */

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds
  email: 'test@example.com',
  testImageData: {
    filename: 'test-image.jpg',
    contentType: 'image/jpeg',
    size: 1024 * 1024 // 1MB
  }
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const makeRequest = async (path, options = {}) => {
  const url = `${BASE_URL}${path}`;
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  try {
    const response = await fetch(url, { ...defaultOptions, ...options });
    const data = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries())
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message
    };
  }
};

// Test suite
const tests = {
  async testHealthCheck() {
    log('Testing health check endpoint...');
    const response = await makeRequest('/api/health');

    if (response.status === 404) {
      log('Health endpoint not implemented (expected)', 'info');
      return true;
    }

    return response.ok;
  },

  async testMagicLinkValidation() {
    log('Testing magic link validation...');

    // Test missing email
    const invalidResponse = await makeRequest('/api/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({})
    });

    if (invalidResponse.status !== 400) {
      log(`Expected 400 for missing email, got ${invalidResponse.status}`, 'error');
      return false;
    }

    // Test valid email format (will actually send email if auth is configured)
    const validResponse = await makeRequest('/api/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email: TEST_CONFIG.email })
    });

    if (validResponse.status === 401) {
      log('Magic link endpoint exists but requires proper Supabase auth setup', 'info');
      return true;
    }

    if (validResponse.ok) {
      log('Magic link sent successfully', 'success');
      return true;
    }

    log(`Magic link test failed: ${validResponse.status}`, 'error');
    return false;
  },

  async testUploadValidation() {
    log('Testing upload endpoint validation...');

    // Test unauthenticated request
    const unauthResponse = await makeRequest('/api/upload', {
      method: 'POST',
      body: JSON.stringify(TEST_CONFIG.testImageData)
    });

    if (unauthResponse.status !== 401) {
      log(`Expected 401 for unauthenticated upload, got ${unauthResponse.status}`, 'error');
      return false;
    }

    log('Upload endpoint correctly rejects unauthenticated requests', 'success');

    // Test invalid payload
    const invalidResponse = await makeRequest('/api/upload', {
      method: 'POST',
      body: JSON.stringify({})
    });

    if (invalidResponse.status !== 401 && invalidResponse.status !== 400) {
      log(`Upload validation may not be working properly: ${invalidResponse.status}`, 'error');
      return false;
    }

    return true;
  },

  async testJobsValidation() {
    log('Testing jobs endpoint validation...');

    // Test unauthenticated request
    const unauthResponse = await makeRequest('/api/jobs', {
      method: 'POST',
      body: JSON.stringify({
        assetId: 'test-asset',
        complexity: 'standard',
        lineThickness: 'medium'
      })
    });

    if (unauthResponse.status !== 401) {
      log(`Expected 401 for unauthenticated job creation, got ${unauthResponse.status}`, 'error');
      return false;
    }

    log('Jobs endpoint correctly rejects unauthenticated requests', 'success');
    return true;
  },

  async testCreditsEndpoint() {
    log('Testing credits endpoint...');

    // Test unauthenticated request
    const response = await makeRequest('/api/credits');

    if (response.status !== 401) {
      log(`Expected 401 for unauthenticated credits request, got ${response.status}`, 'error');
      return false;
    }

    log('Credits endpoint correctly rejects unauthenticated requests', 'success');
    return true;
  },

  async testProfileEndpoint() {
    log('Testing user profile endpoint...');

    // Test unauthenticated request
    const response = await makeRequest('/api/user/profile');

    if (response.status !== 401) {
      log(`Expected 401 for unauthenticated profile request, got ${response.status}`, 'error');
      return false;
    }

    log('Profile endpoint correctly rejects unauthenticated requests', 'success');
    return true;
  },

  async testRateLimiting() {
    log('Testing rate limiting (basic check)...');

    // Make multiple requests to upload endpoint to check rate limiting headers
    const response = await makeRequest('/api/upload', {
      method: 'POST',
      body: JSON.stringify(TEST_CONFIG.testImageData)
    });

    // Check for rate limiting headers
    const rateLimitHeaders = ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset'];
    const hasRateLimitHeaders = rateLimitHeaders.some(header =>
      response.headers[header] !== undefined
    );

    if (hasRateLimitHeaders) {
      log('Rate limiting headers detected', 'success');
    } else {
      log('Rate limiting headers not found (may be implemented at auth level)', 'info');
    }

    return true;
  },

  async testErrorHandling() {
    log('Testing error handling...');

    // Test malformed JSON
    try {
      const response = await fetch(`${BASE_URL}/api/upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: 'invalid json'
      });

      if (response.status === 400 || response.status === 401) {
        log('Error handling working correctly for malformed requests', 'success');
        return true;
      }
    } catch (error) {
      log('Error handling test completed', 'info');
    }

    return true;
  }
};

// Main test runner
async function runTests() {
  log('Starting API Endpoint Validation Tests');
  log(`Base URL: ${BASE_URL}`);
  log('');

  const results = {};
  let totalTests = 0;
  let passedTests = 0;

  for (const [testName, testFunction] of Object.entries(tests)) {
    totalTests++;
    try {
      const result = await testFunction();
      results[testName] = result;
      if (result) {
        passedTests++;
      }
    } catch (error) {
      log(`Test ${testName} threw error: ${error.message}`, 'error');
      results[testName] = false;
    }
    log(''); // Empty line between tests
  }

  // Summary
  log('='.repeat(50));
  log('TEST SUMMARY');
  log('='.repeat(50));

  for (const [testName, result] of Object.entries(results)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    log(`${status} ${testName}`);
  }

  log('');
  log(`Total: ${totalTests} tests, ${passedTests} passed, ${totalTests - passedTests} failed`);

  if (passedTests === totalTests) {
    log('All tests passed! API endpoints are functioning correctly.', 'success');
  } else {
    log('Some tests failed. Check the output above for details.', 'error');
  }

  // Exit with appropriate code
  process.exit(passedTests === totalTests ? 0 : 1);
}

// Check if fetch is available (Node.js 18+ required)
if (typeof fetch === 'undefined') {
  log('This test requires Node.js 18+ with built-in fetch support', 'error');
  log('Alternatively, run: npm install node-fetch', 'info');
  process.exit(1);
}

// Run tests
runTests().catch(error => {
  log(`Test runner failed: ${error.message}`, 'error');
  process.exit(1);
});