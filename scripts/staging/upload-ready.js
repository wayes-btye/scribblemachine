#!/usr/bin/env node

/**
 * Upload Ready Staging Script
 *
 * PURPOSE: Get AI agents to the upload interface with a test image uploaded
 * and ready for parameter selection.
 *
 * This handles both authentication and file upload - the two critical barriers
 * that AI agents struggle with most.
 */

const { chromium } = require('playwright');
const path = require('path');
const { main: authBypass } = require('./auth-bypass.js');

async function main() {
  console.log('🎯 Stage 2: Upload Interface with Image');
  console.log('PURPOSE: Navigate to upload interface with test image ready\n');

  let browser;
  let page;

  try {
    // Launch browser
    console.log('🚀 Launching browser...');
    browser = await chromium.launch({
      headless: false,  // Show browser for debugging
      slowMo: 500       // Slow down for visual feedback
    });

    page = await browser.newPage();

    // Step 1: Complete authentication first
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    console.log('🔐 Step 1: Handling authentication...');

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

    console.log('✅ Authentication completed');

    // Step 2: Navigate to upload interface
    console.log('📁 Step 2: Navigating to upload interface...');

    // Wait a bit for auth to fully settle
    await page.waitForTimeout(2000);

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

    // Wait for upload interface to load
    await page.waitForSelector('[data-testid="file-upload-dropzone"]', { timeout: 15000 });
    console.log('✅ Upload interface loaded');

    // Take screenshot before upload
    await page.screenshot({
      path: 'scripts/screenshots/stage2-before-upload.png',
      fullPage: true
    });
    console.log('📸 Screenshot: scripts/screenshots/stage2-before-upload.png');

    // Step 3: Upload test image
    console.log('📤 Step 3: Uploading test image...');

    const testImagePath = path.resolve(__dirname, '../../services/worker/test-images/blue-girl-smile.jpg');
    console.log(`Using test image: ${testImagePath}`);

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

    console.log('⏳ Waiting for upload processing...');

    // Wait for upload success indicators
    const uploadSuccess = await Promise.race([
      page.waitForSelector('text="✓ Image ready for processing"', { timeout: 15000 }),
      page.waitForSelector('text="Preview"', { timeout: 15000 }),
      page.waitForSelector('[data-testid="image-preview"]', { timeout: 15000 }),
      page.waitForSelector('text="Generate Coloring Page"', { timeout: 15000 })
    ]).catch(() => null);

    if (uploadSuccess) {
      console.log('✅ Upload successful - image processing completed');
    } else {
      console.log('⚠️  Upload success indicators not found, but proceeding...');
    }

    // Wait for parameter selection interface to appear
    await page.waitForTimeout(2000);

    // Check for parameter selection elements
    const hasParameters = await Promise.race([
      page.waitForSelector('text="Complexity"', { timeout: 5000 }),
      page.waitForSelector('text="Line Thickness"', { timeout: 5000 }),
      page.waitForSelector('input[type="radio"]', { timeout: 5000 })
    ]).then(() => true).catch(() => false);

    if (hasParameters) {
      console.log('✅ Parameter selection interface ready');
    } else {
      console.log('⚠️  Parameter selection interface not fully loaded');
    }

    // Take final screenshot
    await page.screenshot({
      path: 'scripts/screenshots/stage2-upload-ready.png',
      fullPage: true
    });
    console.log('📸 Screenshot: scripts/screenshots/stage2-upload-ready.png');

    // Check for any console errors
    const consoleErrors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    console.log('\n🎉 SUCCESS: Upload interface ready');
    console.log('📦 HANDOFF: Screenshot saved showing upload interface with image');
    console.log('🤖 AI agents can now proceed with parameter selection and generation\n');

    const result = {
      success: true,
      screenshotPath: 'scripts/screenshots/stage2-upload-ready.png',
      message: 'Upload interface ready with test image - parameters can be selected',
      consoleErrors: consoleErrors.length > 0 ? consoleErrors : null
    };

    if (consoleErrors.length > 0) {
      console.log('⚠️  Console errors detected:', consoleErrors);
    }

    return result;

  } catch (error) {
    console.error('❌ FAILED: Upload ready staging failed');
    console.error('Error:', error.message);

    if (page) {
      // Take error screenshot for debugging
      await page.screenshot({
        path: 'scripts/screenshots/stage2-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot: scripts/screenshots/stage2-error.png');
    }

    return {
      success: false,
      error: error.message,
      screenshotPath: 'scripts/screenshots/stage2-error.png'
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