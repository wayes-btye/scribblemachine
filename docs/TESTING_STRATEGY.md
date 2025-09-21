# Playwright MCP Testing Strategy for Authenticated Workflows

## Overview
This document outlines the testing strategy for the ColorigePage Generator app using Playwright MCP, with focus on authenticated user workflows required for Session 2 (Core Workspace) testing.

## Test Environment Setup

### 1. Test User Account
**Create dedicated test user:**
- Email: `test-user@example.com`
- Purpose: Consistent authentication for automated tests
- Credits: Pre-loaded with test credits for generation testing
- Setup: Created manually in Supabase Auth dashboard

### 2. Test Data Preparation
**Existing Test Images (Use These):**
- Location: `services/worker/test-images/`
- Available: `blue-girl-smile.jpg`, `fathers-day.png`, `gangsta-dog.png`, `purple-car.jpg`, `Teddy.png`, `tree.jpg`
- Validated: Already used in backend API testing with confirmed generation results
- Purpose: Consistent inputs that avoid duplicating existing test coverage

### 3. Authentication Strategy

#### Option A: Session Token Bypass (Primary - Development)
```typescript
// Direct session injection for faster testing (bypasses email dependency)
async function injectTestSession(page) {
  await page.goto('http://localhost:3000');
  await page.evaluate(() => {
    localStorage.setItem('supabase.auth.token', TEST_SESSION_TOKEN);
  });
  await page.reload();
}
```

#### Option B: Magic Link Automation (Future Enhancement)
```typescript
// Playwright script for magic link authentication (for production-like testing)
async function authenticateWithMagicLink(page) {
  // 1. Navigate to app
  await page.goto('http://localhost:3000');

  // 2. Enter test email
  await page.fill('[data-testid="email-input"]', 'test-user@example.com');
  await page.click('[data-testid="send-magic-link"]');

  // 3. Intercept magic link (using test email service or local interception)
  // 4. Navigate directly to auth callback with token
  // 5. Verify authentication state
}
```

## Core Workflow Testing

### 1. Upload Interface Testing
**Test Cases:**
- Valid image upload (JPEG, PNG, WebP)
- Invalid file type rejection
- File size limit validation
- Drag-and-drop functionality
- Progress indicator display

**Playwright Implementation:**
```typescript
test('Upload valid image file', async ({ page }) => {
  await injectTestSession(page);

  // Test file upload using existing validated image
  const fileInput = page.locator('[data-testid="file-upload"]');
  await fileInput.setInputFiles('services/worker/test-images/blue-girl-smile.jpg');

  // Verify preview
  await expect(page.locator('[data-testid="image-preview"]')).toBeVisible();

  // Verify upload success
  await expect(page.locator('[data-testid="upload-success"]')).toBeVisible();
});
```

### 2. Parameter Selection Testing
**Test Cases:**
- Complexity slider interaction (Simple/Standard/Detailed)
- Line thickness selection (Thin/Medium/Thick)
- Parameter combination validation
- Visual preview updates

**Playwright Implementation:**
```typescript
test('Parameter selection workflow', async ({ page }) => {
  await authenticateUser(page);
  await uploadTestImage(page);

  // Test complexity selection
  await page.click('[data-testid="complexity-standard"]');
  await expect(page.locator('[data-testid="complexity-preview"]')).toHaveText('Standard');

  // Test line thickness
  await page.click('[data-testid="thickness-medium"]');
  await expect(page.locator('[data-testid="thickness-preview"]')).toHaveText('Medium');
});
```

### 3. Job Processing Testing
**Test Cases:**
- Job creation and submission
- Real-time status polling
- Progress indicator updates
- Error handling for failures
- Credit deduction tracking

**Playwright Implementation:**
```typescript
test('End-to-end generation workflow', async ({ page }) => {
  await authenticateUser(page);
  await uploadTestImage(page);
  await selectParameters(page, 'standard', 'medium');

  // Start generation
  await page.click('[data-testid="generate-button"]');

  // Verify job status polling
  await expect(page.locator('[data-testid="job-status"]')).toHaveText('Processing...');

  // Wait for completion (with timeout)
  await expect(page.locator('[data-testid="job-status"]')).toHaveText('Complete', { timeout: 30000 });

  // Verify result display
  await expect(page.locator('[data-testid="generated-image"]')).toBeVisible();
});
```

### 4. Download & Export Testing
**Test Cases:**
- Image download functionality
- PDF export with paper size options
- File format validation
- Download progress tracking

## Visual Regression Testing

### Screenshot Comparison
**Key UI States:**
1. Landing page (unauthenticated)
2. Dashboard (authenticated, with credits)
3. Upload interface (empty state)
4. Upload interface (with file)
5. Parameter selection panel
6. Generation in progress
7. Results display
8. Error states

**Implementation:**
```typescript
test('Visual regression - Upload interface', async ({ page }) => {
  await authenticateUser(page);
  await page.goto('/upload');

  // Screenshot empty state
  await expect(page).toHaveScreenshot('upload-empty-state.png');

  // Screenshot with file
  await uploadTestImage(page);
  await expect(page).toHaveScreenshot('upload-with-file.png');
});
```

## Mobile Responsive Testing

### Device Testing
**Target Devices:**
- iPhone 12 (390x844)
- iPad (768x1024)
- Desktop (1920x1080)

**Key Interactions:**
- Touch-friendly file upload
- Mobile navigation
- Parameter selection on small screens
- Sheet overlays functionality

## Error Scenario Testing

### Network Conditions
- Slow 3G simulation for upload testing
- Offline mode for error handling
- API timeout simulation

### Edge Cases
- Session expiration during upload
- File upload interruption
- Worker service unavailable
- Credit insufficient scenarios

## Test Data Management

### Credit System Testing
```typescript
async function setupTestCredits(userId: string, amount: number) {
  // Use Supabase MCP to set test user credits
  await supabase.rpc('set_user_credits', { user_id: userId, amount });
}
```

### Database State Management
- Before each test: Reset test user state
- After test suite: Cleanup generated assets
- Test isolation: Separate test database schema

## Continuous Integration

### Test Categories
1. **Smoke Tests**: Basic auth + upload (fast)
2. **Integration Tests**: Full workflows (medium)
3. **Visual Tests**: UI regression (slow)

### CI Configuration
```yaml
# GitHub Actions integration
- name: Run Playwright Tests
  run: |
    npm run test:e2e:auth
    npm run test:e2e:upload
    npm run test:e2e:generation
```

## Implementation Priority

### Phase 1: Authentication Foundation
- [ ] Set up test user account
- [ ] Implement magic link automation
- [ ] Basic navigation testing

### Phase 2: Upload Workflow
- [ ] File upload automation
- [ ] Parameter selection testing
- [ ] Form validation testing

### Phase 3: Generation Workflow
- [ ] Job creation testing
- [ ] Status polling validation
- [ ] Result verification

### Phase 4: Visual & Mobile
- [ ] Screenshot regression tests
- [ ] Mobile responsive testing
- [ ] Cross-browser validation

## Success Criteria

✅ **Ready for Session 2 Implementation** when:
- Test user account configured
- Basic auth flow automated with Playwright
- Test image assets prepared
- Upload automation working
- Framework for status polling tests ready

This strategy ensures we can test authenticated workflows confidently as we implement the core workspace features.