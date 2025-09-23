#!/usr/bin/env node

/**
 * Upload Validation Test
 *
 * PURPOSE: Validate that the file upload workflow functions correctly,
 * including authentication, navigation, file selection, and upload processing.
 *
 * This test runs a complete upload workflow and generates detailed
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
    logDir: 'scripts/logs/testing',
    testImagePath: path.resolve(__dirname, '../../services/worker/test-images/blue-girl-smile.jpg')
};

// Ensure directories exist
function ensureDirectories() {
    [TEST_CONFIG.screenshotDir, TEST_CONFIG.logDir].forEach(dir => {
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
    });
}

// Check if test image exists
function validateTestImage() {
    if (!fs.existsSync(TEST_CONFIG.testImagePath)) {
        throw new Error(`Test image not found: ${TEST_CONFIG.testImagePath}`);
    }
    console.log(`📷 Test image confirmed: ${TEST_CONFIG.testImagePath}`);
}

async function runUploadValidationTest() {
    const testResult = {
        testName: 'Upload Validation Test',
        timestamp: new Date().toISOString(),
        passed: false,
        duration: 0,
        steps: [],
        screenshots: [],
        errors: [],
        consoleMessages: [],
        networkRequests: [],
        uploadDetails: {
            imageUploaded: false,
            processingComplete: false,
            parametersVisible: false,
            generateButtonReady: false
        },
        assertions: {
            total: 0,
            passed: 0,
            failed: 0
        }
    };

    const startTime = Date.now();
    let browser, page;

    try {
        console.log('🧪 Starting Upload Validation Test');
        console.log('📍 Target URL:', TEST_CONFIG.baseUrl);
        console.log('🖼️  Test Image:', TEST_CONFIG.testImagePath);
        console.log('');

        // Validate prerequisites
        validateTestImage();

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

        // Test Step 1: Authentication (required for upload)
        testResult.steps.push('Complete authentication flow');
        console.log('🔐 Step 1: Completing authentication flow...');

        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle' });

        const screenshotPath1 = path.join(TEST_CONFIG.screenshotDir, 'upload-test-01-initial.png');
        await page.screenshot({ path: screenshotPath1, fullPage: true });
        testResult.screenshots.push(screenshotPath1);

        // Quick auth flow
        await page.click('text="Upload Photo - It\'s FREE!"');
        await page.waitForTimeout(1000);

        const signInButton = page.locator('button:has-text("Sign In")');
        if (await signInButton.isVisible({ timeout: 3000 })) {
            await signInButton.click();
            await page.waitForTimeout(1000);
        }

        const devBypass = page.locator('button:has-text("🧪 Dev Bypass")');
        if (await devBypass.isVisible({ timeout: 3000 })) {
            await devBypass.click();
            await page.waitForTimeout(2000);
        }

        // Test Step 2: Navigate to upload interface
        testResult.steps.push('Navigate to upload interface');
        console.log('📁 Step 2: Navigating to upload interface...');

        await page.click('text="Upload Photo - It\'s FREE!"');
        await page.waitForTimeout(3000);

        const screenshotPath2 = path.join(TEST_CONFIG.screenshotDir, 'upload-test-02-upload-page.png');
        await page.screenshot({ path: screenshotPath2, fullPage: true });
        testResult.screenshots.push(screenshotPath2);

        // Test Step 3: Verify upload interface elements
        testResult.steps.push('Verify upload interface elements');
        console.log('🔍 Step 3: Verifying upload interface elements...');

        const uploadElements = [
            { selector: '[data-testid="file-upload-dropzone"]', name: 'Upload dropzone' },
            { selector: 'text="Drag and drop"', name: 'Drag and drop text' },
            { selector: 'text="Choose file"', name: 'Choose file text' }
        ];

        for (const element of uploadElements) {
            const isVisible = await page.locator(element.selector).isVisible({ timeout: 5000 });
            testResult.assertions.total++;

            if (isVisible) {
                testResult.assertions.passed++;
                console.log(`   ✓ ${element.name} found`);
            } else {
                testResult.assertions.failed++;
                testResult.errors.push(`${element.name} not found`);
                console.log(`   ❌ ${element.name} not found`);
            }
        }

        // Test Step 4: Upload file
        testResult.steps.push('Upload test image');
        console.log('📤 Step 4: Uploading test image...');

        // Try file input approach first
        const fileInput = page.locator('[data-testid="file-upload-input"]');
        const isInputVisible = await fileInput.isVisible({ timeout: 2000 });

        if (isInputVisible) {
            console.log('   📁 Using file input directly...');
            await fileInput.setInputFiles(TEST_CONFIG.testImagePath);
            testResult.uploadDetails.imageUploaded = true;
        } else {
            console.log('   📁 Using file chooser approach...');
            const fileChooserPromise = page.waitForEvent('filechooser');
            await page.click('[data-testid="file-upload-dropzone"]');

            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles(TEST_CONFIG.testImagePath);
            testResult.uploadDetails.imageUploaded = true;
        }

        console.log('   ⏳ Waiting for upload processing...');
        await page.waitForTimeout(5000);

        const screenshotPath3 = path.join(TEST_CONFIG.screenshotDir, 'upload-test-03-upload-processing.png');
        await page.screenshot({ path: screenshotPath3, fullPage: true });
        testResult.screenshots.push(screenshotPath3);

        // Test Step 5: Verify upload success indicators
        testResult.steps.push('Verify upload success indicators');
        console.log('✅ Step 5: Verifying upload success indicators...');

        const successIndicators = [
            { selector: 'text="✓ Image ready for processing"', name: 'Ready for processing message' },
            { selector: '[data-testid="image-preview"]', name: 'Image preview' },
            { selector: 'text="Preview"', name: 'Preview label' }
        ];

        let uploadSuccessful = false;
        for (const indicator of successIndicators) {
            const isVisible = await page.locator(indicator.selector).isVisible({ timeout: 10000 });
            testResult.assertions.total++;

            if (isVisible) {
                testResult.assertions.passed++;
                console.log(`   ✓ ${indicator.name} found`);
                uploadSuccessful = true;
                testResult.uploadDetails.processingComplete = true;
            } else {
                testResult.assertions.failed++;
                console.log(`   ❌ ${indicator.name} not found`);
            }
        }

        // Test Step 6: Verify parameter selection interface
        testResult.steps.push('Verify parameter selection interface');
        console.log('⚙️  Step 6: Verifying parameter selection interface...');

        const parameterElements = [
            { selector: 'text="Complexity"', name: 'Complexity section' },
            { selector: 'text="Line Thickness"', name: 'Line Thickness section' },
            { selector: 'input[type="radio"]', name: 'Radio button options' },
            { selector: 'text="Generate Coloring Page"', name: 'Generate button' }
        ];

        for (const element of parameterElements) {
            const isVisible = await page.locator(element.selector).isVisible({ timeout: 5000 });
            testResult.assertions.total++;

            if (isVisible) {
                testResult.assertions.passed++;
                console.log(`   ✓ ${element.name} found`);

                if (element.name === 'Complexity section' || element.name === 'Line Thickness section') {
                    testResult.uploadDetails.parametersVisible = true;
                }
                if (element.name === 'Generate button') {
                    testResult.uploadDetails.generateButtonReady = true;
                }
            } else {
                testResult.assertions.failed++;
                testResult.errors.push(`${element.name} not found`);
                console.log(`   ❌ ${element.name} not found`);
            }
        }

        const screenshotPath4 = path.join(TEST_CONFIG.screenshotDir, 'upload-test-04-final-state.png');
        await page.screenshot({ path: screenshotPath4, fullPage: true });
        testResult.screenshots.push(screenshotPath4);

        // Determine overall test result
        testResult.passed = uploadSuccessful &&
            testResult.uploadDetails.parametersVisible &&
            testResult.uploadDetails.generateButtonReady &&
            testResult.assertions.failed === 0;

        testResult.duration = Date.now() - startTime;

        console.log('');
        console.log('📊 Test Results Summary:');
        console.log(`   Status: ${testResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`   Duration: ${testResult.duration}ms`);
        console.log(`   Assertions: ${testResult.assertions.passed}/${testResult.assertions.total} passed`);
        console.log(`   Image Uploaded: ${testResult.uploadDetails.imageUploaded ? '✓' : '❌'}`);
        console.log(`   Processing Complete: ${testResult.uploadDetails.processingComplete ? '✓' : '❌'}`);
        console.log(`   Parameters Visible: ${testResult.uploadDetails.parametersVisible ? '✓' : '❌'}`);
        console.log(`   Generate Button Ready: ${testResult.uploadDetails.generateButtonReady ? '✓' : '❌'}`);
        console.log(`   Errors: ${testResult.errors.length}`);
        console.log(`   Screenshots: ${testResult.screenshots.length}`);

        return testResult;

    } catch (error) {
        testResult.errors.push(error.message);
        testResult.duration = Date.now() - startTime;

        console.error('❌ Test failed with error:', error.message);

        if (page) {
            const errorScreenshot = path.join(TEST_CONFIG.screenshotDir, 'upload-test-error.png');
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
    console.log('🧪 Upload Validation Test Runner');
    console.log('==================================');
    console.log('');

    ensureDirectories();

    const result = await runUploadValidationTest();

    // Write detailed test report
    const reportPath = path.join(TEST_CONFIG.logDir, `upload-validation-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

    console.log('');
    console.log('📄 Test Report Generated:');
    console.log(`   Report: ${reportPath}`);
    console.log(`   Screenshots: ${TEST_CONFIG.screenshotDir}/`);
    console.log('');

    if (result.passed) {
        console.log('🎉 Upload validation test completed successfully');
        process.exit(0);
    } else {
        console.log('❌ Upload validation test failed');
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

module.exports = { runUploadValidationTest, TEST_CONFIG };
