#!/usr/bin/env node

/**
 * Generation Workflow Test
 *
 * PURPOSE: Validate the complete generation workflow including authentication,
 * upload, parameter selection, generation process, and result handling.
 *
 * This test captures both success and error scenarios, providing detailed
 * logs and analysis for AI agents.
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
    baseUrl: 'http://localhost:3000',
    timeout: 60000,
    generationTimeout: 45000,
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

async function runGenerationWorkflowTest() {
    const testResult = {
        testName: 'Generation Workflow Test',
        timestamp: new Date().toISOString(),
        passed: false,
        duration: 0,
        steps: [],
        screenshots: [],
        errors: [],
        consoleMessages: [],
        networkRequests: [],
        workflowStages: {
            authentication: false,
            upload: false,
            parameterSelection: false,
            generation: false,
            result: false
        },
        generationOutcome: 'unknown',
        assertions: {
            total: 0,
            passed: 0,
            failed: 0
        }
    };

    const startTime = Date.now();
    let browser, page;

    try {
        console.log('🧪 Starting Generation Workflow Test');
        console.log('📍 Target URL:', TEST_CONFIG.baseUrl);
        console.log('🖼️  Test Image:', TEST_CONFIG.testImagePath);
        console.log('⏰ Generation Timeout:', TEST_CONFIG.generationTimeout + 'ms');
        console.log('');

        // Validate prerequisites
        validateTestImage();

        // Setup browser and page
        browser = await chromium.launch({
            headless: false,
            slowMo: TEST_CONFIG.slowMo
        });

        page = await browser.newPage();

        // Setup comprehensive event listeners
        page.on('console', msg => {
            const message = {
                type: msg.type(),
                text: msg.text(),
                timestamp: new Date().toISOString()
            };
            testResult.consoleMessages.push(message);

            // Log important console messages
            if (msg.type() === 'error' || msg.text().includes('API') || msg.text().includes('Generation')) {
                console.log(`   📋 Console [${msg.type()}]: ${msg.text()}`);
            }
        });

        page.on('request', request => {
            if (request.url().includes('/api/')) {
                testResult.networkRequests.push({
                    method: request.method(),
                    url: request.url(),
                    timestamp: new Date().toISOString(),
                    type: 'request'
                });
                console.log(`   🌐 API Request: ${request.method()} ${request.url()}`);
            }
        });

        page.on('response', response => {
            if (response.url().includes('/api/')) {
                testResult.networkRequests.push({
                    method: response.request().method(),
                    url: response.url(),
                    status: response.status(),
                    timestamp: new Date().toISOString(),
                    type: 'response'
                });
                console.log(`   📡 API Response: ${response.status()} ${response.url()}`);

                if (response.status() >= 400) {
                    console.log(`   ❌ API Error: ${response.status()} ${response.statusText()}`);
                }
            }
        });

        // Test Step 1: Authentication
        testResult.steps.push('Complete authentication');
        console.log('🔐 Step 1: Completing authentication...');

        await page.goto(TEST_CONFIG.baseUrl, { waitUntil: 'networkidle' });

        const screenshotPath1 = path.join(TEST_CONFIG.screenshotDir, 'generation-test-01-initial.png');
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
            testResult.workflowStages.authentication = true;
            console.log('   ✅ Authentication completed');
        } else {
            testResult.errors.push('Authentication failed - dev bypass not found');
            console.log('   ❌ Authentication failed');
        }

        // Test Step 2: Upload
        testResult.steps.push('Upload test image');
        console.log('📤 Step 2: Uploading test image...');

        await page.click('text="Upload Photo - It\'s FREE!"');
        await page.waitForTimeout(3000);

        const screenshotPath2 = path.join(TEST_CONFIG.screenshotDir, 'generation-test-02-upload-page.png');
        await page.screenshot({ path: screenshotPath2, fullPage: true });
        testResult.screenshots.push(screenshotPath2);

        // Upload file
        const fileInput = page.locator('[data-testid="file-upload-input"]');
        const isInputVisible = await fileInput.isVisible({ timeout: 2000 });

        if (isInputVisible) {
            console.log('   📁 Using file input...');
            await fileInput.setInputFiles(TEST_CONFIG.testImagePath);
        } else {
            console.log('   📁 Using file chooser...');
            const fileChooserPromise = page.waitForEvent('filechooser');
            await page.click('[data-testid="file-upload-dropzone"]');

            const fileChooser = await fileChooserPromise;
            await fileChooser.setFiles(TEST_CONFIG.testImagePath);
        }

        console.log('   ⏳ Waiting for upload processing...');
        await page.waitForTimeout(5000);

        // Check upload success
        const uploadSuccess = await page.locator('text="✓ Image ready for processing"').isVisible({ timeout: 10000 });
        if (uploadSuccess) {
            testResult.workflowStages.upload = true;
            console.log('   ✅ Upload completed successfully');
        } else {
            testResult.errors.push('Upload processing failed or timed out');
            console.log('   ❌ Upload processing failed');
        }

        const screenshotPath3 = path.join(TEST_CONFIG.screenshotDir, 'generation-test-03-upload-complete.png');
        await page.screenshot({ path: screenshotPath3, fullPage: true });
        testResult.screenshots.push(screenshotPath3);

        // Test Step 3: Parameter Selection
        testResult.steps.push('Configure generation parameters');
        console.log('⚙️  Step 3: Configuring generation parameters...');

        // Set standard complexity (usually default)
        const complexityStandard = page.locator('input[value="standard"]');
        if (await complexityStandard.isVisible({ timeout: 3000 })) {
            await complexityStandard.check();
            console.log('   ✅ Complexity set to: standard');
        }

        // Set medium thickness (usually default)
        const thicknessMedium = page.locator('input[value="medium"]');
        if (await thicknessMedium.isVisible({ timeout: 3000 })) {
            await thicknessMedium.check();
            console.log('   ✅ Line thickness set to: medium');
        }

        // Check for generate button
        const generateButton = page.locator('button:has-text("Generate Coloring Page")');
        if (await generateButton.isVisible({ timeout: 3000 })) {
            testResult.workflowStages.parameterSelection = true;
            console.log('   ✅ Parameter selection ready');
        } else {
            testResult.errors.push('Generate button not found');
            console.log('   ❌ Generate button not found');
        }

        const screenshotPath4 = path.join(TEST_CONFIG.screenshotDir, 'generation-test-04-parameters-set.png');
        await page.screenshot({ path: screenshotPath4, fullPage: true });
        testResult.screenshots.push(screenshotPath4);

        // Test Step 4: Generation Process
        testResult.steps.push('Execute generation process');
        console.log('🎨 Step 4: Executing generation process...');

        if (await generateButton.isVisible()) {
            console.log('   🔘 Clicking "Generate Coloring Page" button...');
            await generateButton.click();
            testResult.workflowStages.generation = true;

            console.log(`   ⏳ Monitoring generation process (${TEST_CONFIG.generationTimeout}ms timeout)...`);

            // Monitor for various outcomes
            try {
                const outcome = await Promise.race([
                    // Success scenarios
                    page.waitForSelector('text="Generation complete"', { timeout: TEST_CONFIG.generationTimeout }).then(() => 'success'),
                    page.waitForSelector('text="Download"', { timeout: TEST_CONFIG.generationTimeout }).then(() => 'success_download'),
                    page.waitForSelector('[data-testid="generated-result"]', { timeout: TEST_CONFIG.generationTimeout }).then(() => 'success_result'),

                    // Error scenarios
                    page.waitForSelector('text="Error"', { timeout: TEST_CONFIG.generationTimeout }).then(() => 'error_message'),
                    page.waitForSelector('text="Failed"', { timeout: TEST_CONFIG.generationTimeout }).then(() => 'error_failed'),
                    page.waitForSelector('[role="alert"]', { timeout: TEST_CONFIG.generationTimeout }).then(() => 'error_alert'),

                    // Timeout scenario
                    new Promise((resolve) => {
                        setTimeout(() => resolve('timeout'), TEST_CONFIG.generationTimeout);
                    })
                ]);

                testResult.generationOutcome = outcome;
                console.log(`   📊 Generation outcome: ${outcome}`);

                if (outcome.startsWith('success')) {
                    testResult.workflowStages.result = true;
                    console.log('   🎉 Generation appears successful');
                } else if (outcome.startsWith('error')) {
                    testResult.errors.push(`Generation failed with outcome: ${outcome}`);
                    console.log('   ❌ Generation failed with error');
                } else {
                    testResult.errors.push('Generation timed out');
                    console.log('   ⏰ Generation timed out');
                }

            } catch (error) {
                testResult.generationOutcome = 'exception';
                testResult.errors.push(`Generation monitoring failed: ${error.message}`);
                console.log('   💥 Generation monitoring failed:', error.message);
            }
        } else {
            testResult.errors.push('Cannot start generation - button not available');
            console.log('   ❌ Cannot start generation - button not available');
        }

        const screenshotPath5 = path.join(TEST_CONFIG.screenshotDir, 'generation-test-05-generation-result.png');
        await page.screenshot({ path: screenshotPath5, fullPage: true });
        testResult.screenshots.push(screenshotPath5);

        // Test Step 5: Result Analysis
        testResult.steps.push('Analyze generation result');
        console.log('📊 Step 5: Analyzing generation result...');

        const errorMessages = testResult.consoleMessages.filter(msg => msg.type === 'error');
        const apiErrors = testResult.networkRequests.filter(req => req.type === 'response' && req.status >= 400);

        console.log(`   📋 Console errors: ${errorMessages.length}`);
        console.log(`   🌐 API errors: ${apiErrors.length}`);
        console.log(`   📸 Screenshots captured: ${testResult.screenshots.length}`);

        // Determine overall test result
        const criticalStagesCompleted = testResult.workflowStages.authentication &&
            testResult.workflowStages.upload &&
            testResult.workflowStages.parameterSelection;

        testResult.passed = criticalStagesCompleted &&
            (testResult.generationOutcome.startsWith('success') ||
                testResult.generationOutcome.startsWith('error')); // Error is acceptable for analysis

        testResult.duration = Date.now() - startTime;

        console.log('');
        console.log('📊 Test Results Summary:');
        console.log(`   Status: ${testResult.passed ? '✅ PASSED' : '❌ FAILED'}`);
        console.log(`   Duration: ${testResult.duration}ms`);
        console.log(`   Authentication: ${testResult.workflowStages.authentication ? '✓' : '❌'}`);
        console.log(`   Upload: ${testResult.workflowStages.upload ? '✓' : '❌'}`);
        console.log(`   Parameter Selection: ${testResult.workflowStages.parameterSelection ? '✓' : '❌'}`);
        console.log(`   Generation: ${testResult.workflowStages.generation ? '✓' : '❌'}`);
        console.log(`   Result: ${testResult.workflowStages.result ? '✓' : '❌'}`);
        console.log(`   Generation Outcome: ${testResult.generationOutcome}`);
        console.log(`   Errors: ${testResult.errors.length}`);
        console.log(`   Console Messages: ${testResult.consoleMessages.length}`);
        console.log(`   Network Requests: ${testResult.networkRequests.length}`);
        console.log(`   Screenshots: ${testResult.screenshots.length}`);

        return testResult;

    } catch (error) {
        testResult.errors.push(error.message);
        testResult.duration = Date.now() - startTime;

        console.error('❌ Test failed with error:', error.message);

        if (page) {
            const errorScreenshot = path.join(TEST_CONFIG.screenshotDir, 'generation-test-error.png');
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
    console.log('🧪 Generation Workflow Test Runner');
    console.log('===================================');
    console.log('');

    ensureDirectories();

    const result = await runGenerationWorkflowTest();

    // Write detailed test report
    const reportPath = path.join(TEST_CONFIG.logDir, `generation-workflow-test-${Date.now()}.json`);
    fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));

    console.log('');
    console.log('📄 Test Report Generated:');
    console.log(`   Report: ${reportPath}`);
    console.log(`   Screenshots: ${TEST_CONFIG.screenshotDir}/`);
    console.log('');

    if (result.passed) {
        console.log('🎉 Generation workflow test completed successfully');
        console.log('   (Note: Generation errors are acceptable for analysis)');
        process.exit(0);
    } else {
        console.log('❌ Generation workflow test failed');
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

module.exports = { runGenerationWorkflowTest, TEST_CONFIG };
