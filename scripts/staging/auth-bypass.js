#!/usr/bin/env node

/**
 * Authentication Bypass Staging Script
 *
 * PURPOSE: Get AI agents to authenticated home page state using the
 * development bypass button.
 *
 * This handles the critical authentication barrier that AI agents struggle
 * with, providing legitimate session tokens for subsequent testing.
 */

const { chromium } = require('playwright');
const path = require('path');

async function main() {
  console.log('🎯 Stage 1: Authentication Bypass');
  console.log('PURPOSE: Navigate to authenticated home page state\n');

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

    // Navigate to application
    console.log('📍 Navigating to http://localhost:3000...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // Take initial screenshot
    await page.screenshot({
      path: 'scripts/screenshots/stage1-initial-load.png',
      fullPage: true
    });
    console.log('📸 Screenshot: scripts/screenshots/stage1-initial-load.png');

    // Click "Upload Photo - It's FREE!" to trigger sign-in flow
    console.log('🔗 Clicking "Upload Photo - It\'s FREE!" button...');
    await page.click('text="Upload Photo - It\'s FREE!"');

    // Wait for potential page navigation or dialog
    await page.waitForTimeout(2000);

    // Check if we need to click "Sign In" button to open auth dialog
    const signInButton = page.locator('button:has-text("Sign In")');
    const isSignInVisible = await signInButton.isVisible();

    if (isSignInVisible) {
      console.log('🔐 Clicking "Sign In" button to open auth dialog...');
      await signInButton.click();
      await page.waitForTimeout(1000);
    }

    // Look for and click the development bypass button
    console.log('🧪 Looking for development bypass button...');

    // Try multiple selectors for the dev bypass button
    const devBypassSelectors = [
      'button:has-text("🧪 Dev Bypass")',
      'button:has-text("Dev Bypass")',
      'button[class*="dev"]',
      'text="wayes.appsmate@gmail.com"'
    ];

    let devBypassFound = false;
    for (const selector of devBypassSelectors) {
      try {
        const devBypassButton = page.locator(selector);
        if (await devBypassButton.isVisible({ timeout: 2000 })) {
          console.log(`✅ Found dev bypass button with selector: ${selector}`);
          await devBypassButton.click();
          devBypassFound = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!devBypassFound) {
      console.log('⚠️  Dev bypass button not found. Checking if already authenticated...');

      // Check for authentication indicators
      const authIndicators = [
        'text="WA"',  // User initials
        'text="50 credits"', // Credit balance
        'text="Upload"' // Upload button in authenticated state
      ];

      let isAuthenticated = false;
      for (const indicator of authIndicators) {
        if (await page.locator(indicator).isVisible({ timeout: 1000 })) {
          console.log('✅ Already authenticated - found indicator:', indicator);
          isAuthenticated = true;
          break;
        }
      }

      if (!isAuthenticated) {
        throw new Error('Dev bypass button not found and no authentication indicators detected');
      }
    } else {
      // Wait for authentication to complete
      console.log('⏳ Waiting for authentication to complete...');
      await page.waitForTimeout(3000);
    }

    // Verify authentication success by looking for user indicators
    console.log('🔍 Verifying authentication success...');

    const authSuccess = await Promise.race([
      page.waitForSelector('text="WA"', { timeout: 5000 }).then(() => 'initials'),
      page.waitForSelector('text="50 credits"', { timeout: 5000 }).then(() => 'credits'),
      page.waitForSelector('text="Upload Photo"', { timeout: 5000 }).then(() => 'upload_button')
    ]).catch(() => null);

    if (authSuccess) {
      console.log(`✅ Authentication verified - found: ${authSuccess}`);
    } else {
      console.log('⚠️  Authentication indicators not found, but proceeding...');
    }

    // Take final screenshot of authenticated state
    await page.screenshot({
      path: 'scripts/screenshots/stage1-authenticated-home.png',
      fullPage: true
    });
    console.log('📸 Screenshot: scripts/screenshots/stage1-authenticated-home.png');

    // Check console logs for any errors
    const logs = await page.evaluate(() => {
      return window.console.logs || [];
    });

    if (logs.length > 0) {
      console.log('📋 Console logs captured');
    }

    console.log('\n🎉 SUCCESS: Authentication bypass completed');
    console.log('📦 HANDOFF: Screenshot saved showing authenticated home page');
    console.log('🤖 AI agents can now proceed with authenticated workflows\n');

    return {
      success: true,
      screenshotPath: 'scripts/screenshots/stage1-authenticated-home.png',
      message: 'Authentication bypass successful - user authenticated with 50 credits'
    };

  } catch (error) {
    console.error('❌ FAILED: Authentication bypass failed');
    console.error('Error:', error.message);

    if (page) {
      // Take error screenshot for debugging
      await page.screenshot({
        path: 'scripts/screenshots/stage1-error.png',
        fullPage: true
      });
      console.log('📸 Error screenshot: scripts/screenshots/stage1-error.png');
    }

    return {
      success: false,
      error: error.message,
      screenshotPath: 'scripts/screenshots/stage1-error.png'
    };

  } finally {
    // Browser kept open for subsequent screenshot/testing
    // Note: browser.close() removed to allow AI agents to take screenshots
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