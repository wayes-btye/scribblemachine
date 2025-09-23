#!/usr/bin/env node

/**
 * Authentication Flow Test
 *
 * PURPOSE: Validate that the authentication flow works correctly,
 * including dev bypass functionality and user session management.
 *
 * This test runs a complete authentication workflow and generates
 * reports for AI agents to analyze.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    timeout: 30000,
    slowMo: 100,
    screenshotDir: 'scripts/screenshots/testing',
    logDir: 'scripts/logs/testing'
};

// Ensure directories exist
function ensureDirectories() {
    [TEST_CONFIG.screenshotDir, TEST_CONFIG.logDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

async function runAuthFlowTest() {
    const testResult = {
        testName: 'Authentication Flow Test',
        timestamp: new Date().toISOString(),
        passed: false,
        duration: 0,
        steps: [],
        screenshots: [],
        errors: [],
        consoleMessages: [],
        networkRequests: [],
        assertions: {
            total: 0,
            passed: 0,
            failed: 0
        }
    };

    const startTime = Date.now();
    let browser, page;

    try {
        console.log('🧪 Starting Authentication Flow Test');
        console.log('📍 Target URL:', TEST_CONFIG.baseUrl);
        console.log('');

        // Setup browser and page
        browser = await chromium.launch({
            headless: false,
            slowMo: TEST_CONFIG.slowMo
        });

        page = await browser.newPage();

        // Setup event listeners for logging
        page.on('console', msg => {
            testResult.consoleMessages.push({
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            });
        });

        page.on('request', request => {
            if (request.url().includes('/api/')) {
                testResult.networkRequests.push({
                    method: request.method(),
                    url: request.url(),
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Test Step 1: Navigate to application
        testResult.steps.push('Navigate to application');
        console.log('🔄 Step 1: Navigating to application...');

        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle' });

        const screenshotPath1 = path.join(TEST_CONFIG.screenshotDir, 'auth-test-01-initial-load.png');
        await page.screenshot({ path: screenshotPath1, fullPage: true });
        testResult.screenshots.push(screenshotPath1);

        // Test Step 2: Check initial page load
        testResult.steps.push('Verify initial page load');
        console.log('✅ Step 2: Verifying initial page load...');

        const hasUploadButton = await page.locator('text="Upload Photo - It\'s FREE!"').isVisible({ timeout: 5000 });
        testResult.assertions.total++;
        if (hasUploadButton) {
            testResult.assertions.passed++;
            console.log('   ✓ Upload Photo button found');
        } else {
            testResult.assertions.failed++;
            testResult.errors.push('Upload Photo button not found on initial load');
            console.log('   ❌ Upload Photo button not found');
        }

        // Test Step 3: Trigger authentication flow
        testResult.steps.push('Trigger authentication flow');
        console.log('🔐 Step 3: Triggering authentication flow...');

        await page.click('text="Upload Photo - It\'s FREE!"');
        await page.waitForTimeout(2000);

        const screenshotPath2 = path.join(TEST_CONFIG.screenshotDir, 'auth-test-02-auth-triggered.png');
        await page.screenshot({ path: screenshotPath2, fullPage: true });
        testResult.screenshots.push(screenshotPath2);

        // Test Step 4: Check for Sign In button
        testResult.steps.push('Check for Sign In button');
        console.log('🔍 Step 4: Looking for Sign In button...');

        const signInButton = page.locator('button:has-text("Sign In")');
        const isSignInVisible = await signInButton.isVisible({ timeout: 5000 });

        testResult.assertions.total++;
        if (isSignInVisible) {
            testResult.assertions.passed++;
            console.log('   ✓ Sign In button found');

            await signInButton.click();
            await page.waitForTimeout(1000);
        } else {
            console.log('   ⚠️  Sign In button not found - checking if already authenticated');
        }

        // Test Step 5: Use development bypass
        testResult.steps.push('Use development bypass');
        console.log('🧪 Step 5: Using development bypass...');

        const devBypassButton = page.locator('button:has-text("🧪 Dev Bypass")');
        const isDevBypassVisible = await devBypassButton.isVisible({ timeout: 5000 });

        testResult.assertions.total++;
        if (isDevBypassVisible) {
            testResult.assertions.passed++;
            console.log('   ✓ Dev bypass button found');

            await devBypassButton.click();
            await page.waitForTimeout(3000);
        } else {
            testResult.assertions.failed++;
            testResult.errors.push('Dev bypass button not found');
            console.log('   ❌ Dev bypass button not found');
        }

        const screenshotPath3 = path.join(TEST_CONFIG.screenshotDir, 'auth-test-03-bypass-clicked.png');
        await page.screenshot({ path: screenshotPath3, fullPage: true });
        testResult.screenshots.push(screenshotPath3);

        // Test Step 6: Verify authentication success
        testResult.steps.push('Verify authentication success');
        console.log('✅ Step 6: Verifying authentication success...');

        // Check for authentication indicators
        const authIndicators = [
            { selector: 'text="WA"', name: 'User initials' },
            { selector: 'text="50 credits"', name: 'Credit balance' },
            { selector: 'text="Upload Photo"', name: 'Upload button' }
        ];

        let authenticationSuccessful = false;
        for (const indicator of authIndicators) {
            const isVisible = await page.locator(indicator.selector).isVisible({ timeout: 3000 });
            testResult.assertions.total++;

            if (isVisible) {
                testResult.assertions.passed++;
                console.log(`   ✓ ${indicator.name} found`);
                authenticationSuccessful = true;
            } else {
                testResult.assertions.failed++;
                console.log(`   ❌ ${indicator.name} not found`);
            }
        }

        if (authenticationSuccessful) {
            console.log('   🎉 Authentication appears successful');
        } else {
            testResult.errors.push('No authentication indicators found');
            console.log('   ❌ Authentication may have failed');
        }

        const screenshotPath4 = path.join(TEST_CONFIG.screenshotDir, 'auth-test-04-final-state.png');
        await page.screenshot({ path: screenshotPath4, fullPage: true });
        testResult.screenshots.push(screenshotPath4);

        // Determine overall test result
        testResult.passed = testResult.assertions.failed === 0 && authenticationSuccessful;
        testResult.duration = Date.now() - startTime;

        console.log('');
        console.log('📊 Test Results Summary:');
        console.log(`   Status: ${testResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`   Duration: ${testResult.duration}ms`);
        console.log(`   Assertions: ${testResult.assertions.passed}/${testResult.assertions.total} passed`);
        console.log(`   Errors: ${testResult.errors.length}`);
        console.log(`   Screenshots: ${testResult.screenshots.length}`);
        console.log(`   Console messages: ${testResult.consoleMessages.length}`);
        console.log(`   Network requests: ${testResult.networkRequests.length}`);

        return testResult;

    } catch (error) {
        testResult.errors.push(error.message);
        testResult.duration = Date.now() - startTime;

        console.error('❌ Test failed with error:', error.message);

        if (page) {
            const errorScreenshot = path.join(TEST_CONFIG.screenshotDir, 'auth-test-error.png');
            await page.screenshot({ path: errorScreenshot, fullPage: true });
            testResult.screenshots.push(errorScreenshot);
        }

        return testResult;

    } finally {
        if (browser) {
            await browser.close();
        }
    }
}

async function main() {
    console.log('🧪 Authentication Flow Test Runner');
    console.log('=====================================');
    console.log('');

    ensureDirectories();

    const result = await runAuthFlowTest();

    // Write detailed test report
    const reportPath = path.join(TEST_CONFIG.logDir, `auth-flow-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

    console.log('');
    console.log('📄 Test Report Generated:');
    console.log(`   Report: ${reportPath}`);
    console.log(`   Screenshots: ${TEST_CONFIG.screenshotDir}/`);
    console.log('');

    if (result.passed) {
        console.log('🎉 Authentication flow test completed successfully');
        process.exit(0);
    } else {
        console.log('❌ Authentication flow test failed');
        console.log('🔍 Check the report and screenshots for debugging information');
        process.exit(1);
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(error => {
        console.error('💥 Test runner failed:', error);
        process.exit(1);
    });
}

module.exports = { runAuthFlowTest, TEST_CONFIG };
