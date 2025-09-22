#!/usr/bin/env node

/**
 * Generation Complete Staging Script
 *
 * PURPOSE: Get AI agents to the generation result state with default parameters.
 *
 * NOTE: This script handles the current incomplete generation workflow gracefully,
 * capturing errors and partial states for debugging and analysis.
 */

const { chromium } = require('playwright');
const path = require('path');
const { main: uploadReady } = require('./upload-ready.js');

async function main() {
  console.log('🎯 Stage 3: Generation Complete (with Error Handling)');
  console.log('PURPOSE: Navigate through generation workflow with default settings\n');
  console.log('⚠️  NOTE: Generation workflow is incomplete - will capture errors for analysis\n');

  let browser;
  let page;
  let consoleMessages = [];
  let networkRequests = [];
  let generationOutcome = null;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await chromium.launch({
      headless: false,  // Show browser for debugging
      slowMo: 500       // Slow down for visual feedback
    });

    page = await browser.newPage();

    // Enable console logging
    page.on('console', msg => {
      consoleMessages.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date().toISOString()
      });
      console.log(`📋 Console [${msg.type()}]: ${msg.text()}`);
    });

    // Enable network request monitoring
    page.on('request', request => {
      if (request.url().includes('/api/')) {
        networkRequests.push({
          url: request.url(),
          method: request.method(),
          timestamp: new Date().toISOString()
        });
        console.log(`🌐 API Request: ${request.method()} ${request.url()}`);
      }
    });

    page.on('response', response => {
      if (response.url().includes('/api/')) {
        console.log(`📡 API Response: ${response.status()} ${response.url()}`);
        if (response.status() >= 400) {
          console.log(`❌ API Error: ${response.status()} ${response.statusText()}`);
        }
      }
    });

    // Step 1: Get to upload-ready state first
    console.log('📤 Step 1: Getting to upload-ready state...');

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Check if already authenticated
    const isAlreadyAuth = await page.locator('text="WA"').isVisible({ timeout: 2000 });

    if (!isAlreadyAuth) {
      // Perform authentication flow
      await page.click('text="Upload Photo - It\'s FREE!"');
      await page.waitForTimeout(1000);

      const signInButton = page.locator('button:has-text("Sign In")');
      if (await signInButton.isVisible()) {
        await signInButton.click();
        await page.waitForTimeout(1000);
      }

      // Click dev bypass
      const devBypass = page.locator('button:has-text("🧪 Dev Bypass")');
      if (await devBypass.isVisible({ timeout: 3000 })) {
        await devBypass.click();
        await page.waitForTimeout(2000);
      }
    }

    // Navigate to upload if needed
    const currentUrl = page.url();
    if (!currentUrl.includes('/create')) {
      const uploadButton = page.locator('text="Upload Photo"').first();
      if (await uploadButton.isVisible({ timeout: 3000 })) {
        await uploadButton.click();
        await page.waitForTimeout(2000);
      } else {
        await page.goto('http://localhost:3000/create', { waitUntil: 'networkidle' });
      }
    }

    // Upload image if not already uploaded
    const isImageUploaded = await page.locator('text="✓ Image ready for processing"').isVisible({ timeout: 2000 });

    if (!isImageUploaded) {
      console.log('📁 Uploading test image...');

      // Click the "Upload Photo - It's FREE!" button to navigate properly
      const uploadPhotoButton = page.locator('text="Upload Photo - It\'s FREE!"');
      if (await uploadPhotoButton.isVisible({ timeout: 5000 })) {
        console.log('🔗 Clicking "Upload Photo - It\'s FREE!" to navigate to create page...');
        await uploadPhotoButton.click();
        await page.waitForTimeout(3000);
      } else {
        // Fallback to direct navigation
        console.log('🔗 Button not found, trying direct navigation...');
        await page.goto('http://localhost:3000/create', { waitUntil: 'networkidle' });
      }

      await page.waitForSelector('[data-testid="file-upload-dropzone"]', { timeout: 15000 });

      const testImagePath = path.resolve(__dirname, '../../services/worker/test-images/blue-girl-smile.jpg');

      // Try using the file input directly first
      const fileInput = page.locator('[data-testid="file-upload-input"]');
      const isInputVisible = await fileInput.isVisible({ timeout: 2000 });

      if (isInputVisible) {
        console.log('📁 Using file input directly...');
        await fileInput.setInputFiles(testImagePath);
        console.log('✅ File selected via input');
      } else {
        // Fallback to file chooser approach
        console.log('📁 Using file chooser approach...');
        const fileChooserPromise = page.waitForEvent('filechooser');
        await page.click('[data-testid="file-upload-dropzone"]');

        console.log('⏳ Waiting for file chooser...');
        const fileChooser = await fileChooserPromise;
        await fileChooser.setFiles(testImagePath);
        console.log('✅ File selected via chooser');
      }

      await page.waitForTimeout(5000); // Wait for upload processing
    }

    console.log('✅ Upload state ready');

    // Take screenshot before parameter selection
    await page.screenshot({
      path: 'scripts/screenshots/stage3-before-parameters.png',
      fullPage: true
    });
    console.log('📸 Screenshot: scripts/screenshots/stage3-before-parameters.png');

    // Step 2: Set default parameters
    console.log('⚙️  Step 2: Setting default parameters...');

    // Set complexity to 'standard' (usually the default)
    const complexityStandard = page.locator('input[value="standard"]');
    if (await complexityStandard.isVisible({ timeout: 3000 })) {
      await complexityStandard.check();
      console.log('✅ Complexity set to: standard');
    } else {
      console.log('⚠️  Standard complexity option not found');
    }

    // Set line thickness to 'medium' (usually the default)
    const thicknessMedium = page.locator('input[value="medium"]');
    if (await thicknessMedium.isVisible({ timeout: 3000 })) {
      await thicknessMedium.check();
      console.log('✅ Line thickness set to: medium');
    } else {
      console.log('⚠️  Medium thickness option not found');
    }

    await page.waitForTimeout(1000);

    // Take screenshot after parameter selection
    await page.screenshot({
      path: 'scripts/screenshots/stage3-parameters-set.png',
      fullPage: true
    });
    console.log('📸 Screenshot: scripts/screenshots/stage3-parameters-set.png');

    // Step 3: Attempt generation (expecting errors)
    console.log('🎨 Step 3: Attempting generation (expecting current workflow issues)...');

    const generateButton = page.locator('button:has-text("Generate Coloring Page")');
    const isGenerateVisible = await generateButton.isVisible({ timeout: 3000 });

    if (isGenerateVisible) {
      console.log('🔘 Clicking "Generate Coloring Page" button...');
      await generateButton.click();

      console.log('⏳ Monitoring generation process...');

      // Wait and monitor for various outcomes
      const monitoringTimeout = 30000; // 30 seconds

      try {
        generationOutcome = await Promise.race([
          // Success scenarios
          page.waitForSelector('text="Generation complete"', { timeout: monitoringTimeout }).then(() => 'success'),
          page.waitForSelector('text="Download"', { timeout: monitoringTimeout }).then(() => 'success_download'),
          page.waitForSelector('[data-testid="generated-result"]', { timeout: monitoringTimeout }).then(() => 'success_result'),

          // Error scenarios (current expected outcome)
          page.waitForSelector('text="Error"', { timeout: monitoringTimeout }).then(() => 'error_message'),
          page.waitForSelector('text="Failed"', { timeout: monitoringTimeout }).then(() => 'error_failed'),
          page.waitForSelector('[role="alert"]', { timeout: monitoringTimeout }).then(() => 'error_alert'),

          // Network error detection
          new Promise((resolve) => {
            setTimeout(() => {
              const errors = consoleMessages.filter(msg => msg.type === 'error');
              if (errors.length > 0) {
                resolve('console_errors');
              } else {
                resolve('timeout');
              }
            }, monitoringTimeout);
          })
        ]);

      } catch (error) {
        generationOutcome = 'timeout';
      }

      console.log(`📊 Generation outcome: ${generationOutcome}`);

      // Take screenshot of result state
      await page.screenshot({
        path: 'scripts/screenshots/stage3-generation-result.png',
        fullPage: true
      });
      console.log('📸 Screenshot: scripts/screenshots/stage3-generation-result.png');

    } else {
      console.log('❌ Generate button not found - UI may not be fully loaded');

      await page.screenshot({
        path: 'scripts/screenshots/stage3-no-generate-button.png',
        fullPage: true
      });
      console.log('📸 Screenshot: scripts/screenshots/stage3-no-generate-button.png');
    }

    // Step 4: Analyze and report findings
    console.log('\n📊 Step 4: Analysis Summary');

    const errorMessages = consoleMessages.filter(msg => msg.type === 'error');
    const apiErrors = networkRequests.filter(req => req.method === 'POST' && req.url.includes('/api/'));

    console.log(`📋 Console errors: ${errorMessages.length}`);
    if (errorMessages.length > 0) {
      errorMessages.forEach(error => {
        console.log(`   - ${error.text}`);
      });
    }

    console.log(`🌐 API requests: ${networkRequests.length}`);
    apiErrors.forEach(req => {
      console.log(`   - ${req.method} ${req.url}`);
    });

    console.log('\n🎉 SUCCESS: Generation workflow tested (with expected errors)');
    console.log('📦 HANDOFF: Screenshots and logs captured for analysis');
    console.log('🤖 AI agents can analyze the current workflow state and errors\n');

    return {
      success: true,
      screenshotPath: 'scripts/screenshots/stage3-generation-result.png',
      message: 'Generation workflow tested - errors captured for analysis',
      consoleErrors: errorMessages,
      apiRequests: networkRequests,
      generationOutcome: generationOutcome || 'unknown'
    };

  } catch (error) {
    console.error('❌ FAILED: Generation staging failed');
    console.error('Error:', error.message);

    if (page) {
      await page.screenshot({
        path: 'scripts/screenshots/stage3-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot: scripts/screenshots/stage3-error.png');
    }

    return {
      success: false,
      error: error.message,
      screenshotPath: 'scripts/screenshots/stage3-error.png',
      consoleErrors: consoleMessages.filter(msg => msg.type === 'error'),
      apiRequests: networkRequests
    };

  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

// Run if called directly
if (require.main === module) {
  main().then(result => {
    if (result.success) {
      console.log('✅ Script completed successfully');
      process.exit(0);
    } else {
      console.log('❌ Script failed');
      process.exit(1);
    }
  });
}

module.exports = { main };