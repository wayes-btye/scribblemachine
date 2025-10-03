# Testing Reference - Complete Testing Guide

## Overview

This document consolidates all testing approaches for the ScribbleMachine coloring page generator, covering backend API testing, frontend UI testing, and manual testing workflows.

---

## Backend Testing (Gemini API & Worker)

### Quick Reference Commands

```bash
# RECOMMENDED: Cost-effective single test
cd services/worker
pnpm test:gemini:single              # 1 API call, fast validation

# Basic connectivity test
pnpm test:gemini                     # Connection test only

# PDF generation test
pnpm test:pdf                        # No API calls

# EXPENSIVE: Full parameter suite (use sparingly)
pnpm test:gemini:generate            # 18 API calls, $0.70+
```

### Testing Strategy

**Regular Development:**
- Run `test:gemini:single` before commits
- Validates API connectivity and basic generation
- Cost: ~$0.039 per run (1 API call)

**When to Run Full Suite:**
- After prompt changes
- Before production deployment
- Weekly validation
- Cost: ~$0.70 per run (18 API calls)

### Understanding Test Results

**Good Results:**
```
✅ Successful generations: 12/12 (or 1/1 for single test)
⏱️ Average response time: 5-15 seconds
💰 Cost: $0.039 per generation
```

**Warning Signs:**
```
❌ Failed generations: >10% failure rate
⏱️ Response time: >30 seconds
💰 Cost: $0.000 (API not being called)
```

### Test Image Requirements

**Good Test Images:**
- Portrait photo (person/pet) - tests facial features
- Landscape/nature - tests background complexity
- Object photo (toy/vehicle) - tests solid shapes
- High contrast - tests line detection
- Low contrast - tests enhancement

**Format:**
- JPG/PNG
- 1-10MB
- Good quality (not blurry)
- Mix of simple and complex subjects

**Location:** `services/worker/test-images/`

---

## Manual Testing (UI Workflows)

### Complete Testing Checklist

See `MANUAL_TESTING_INSTRUCTIONS.md` for detailed 10-test checklist.

**Quick Validation:**
1. Auth bypass works (`/workspace` → "Sign In" → "🧪 Dev Bypass")
2. Upload image (drag-drop or click)
3. Select parameters (complexity + thickness)
4. Generate coloring page
5. Download PNG and PDF
6. Test edit workflow
7. Check gallery view

**Test User:**
- Access via dev bypass (no email required)
- Pre-loaded test credits
- Isolated from production data

---

## Automated UI Testing (Playwright MCP)

### Quick Start

**Staging Scripts (Get to Specific State):**
```bash
# Generate MCP commands to reach app states
node scripts/staging/auth-bypass-mcp.js           # Auth instructions
node scripts/staging/upload-ready-mcp.js          # Upload state
node scripts/staging/generation-complete-mcp.js   # Complete workflow
```

**Testing Scripts (Automated Validation):**
```bash
# Run automated tests and generate reports
node scripts/testing/auth-flow-test.js            # Auth workflow
node scripts/testing/upload-validation-test.js    # Upload functionality
node scripts/testing/generation-workflow-test.js  # End-to-end test
```

**Outputs:**
- Test reports: `scripts/logs/testing/`
- Screenshots: `scripts/screenshots/testing/`
- MCP session data: `.playwright-mcp/`

### Manual MCP Testing

**Authentication:**
1. Navigate to `/workspace`
2. Click "Upload Photo"
3. Click "Sign In"
4. Click "🧪 Dev Bypass"

**File Upload:**
- Use: `services/worker/test-images/blue-girl-smile.jpg`
- Test drag-drop and click upload

**Complete Flow:**
Navigate → authenticate → upload → generate → download

### UI Update Verification Protocol

**MANDATORY after any UI changes:**
1. Use staging scripts to reach affected state
2. Take screenshots before and after
3. Test key user flows involving changed UI
4. Verify responsive design if layout changed
5. Document any breaking changes

---

## Testing Best Practices

### Before Making Changes
1. Run baseline test: `pnpm test:gemini:single`
2. Note current performance (response times, success rate)
3. Make changes
4. Re-run tests
5. Compare results

### Red Flags (Stop and Investigate)
- Success rate drops below 90%
- Response times increase >50%
- Cost per generation changes unexpectedly
- Previously passing tests now fail

### What to Test After Changes

| Change Type | Test Command |
|-------------|--------------|
| Code changes | `pnpm test:gemini:single` |
| Prompt changes | `pnpm test:gemini:generate` (full suite) |
| Database changes | Integration testing |
| UI changes | Playwright MCP verification |
| Configuration | All tests |

---

## Test Environment Setup

### Backend Testing
```bash
# Prerequisites
cd services/worker
pnpm install

# Environment
# Ensure .env has GEMINI_API_KEY

# Test images
# Add 1-2 test images to test-images/ folder
```

### Frontend Testing
```bash
# Prerequisites
pnpm web:dev  # Start dev server on port 3000

# Supabase auth configured
# Test images in public/assets/

# MCP server configured (optional)
```

---

## Test Data Management

### Backend Test Images
**Location:** `services/worker/test-images/`
**Existing:**
- `blue-girl-smile.jpg`
- `fathers-day.png`
- `gangsta-dog.png`
- `purple-car.jpg`
- `Teddy.png`
- `tree.jpg`

### Frontend Test Images
**Location:** `apps/web/public/assets/`
**For Dev Pages:**
- `chicken-eating-a-frog.png` (original version)
- `peppa-and-chase-holding-hands.png` (edited version)

### Credits
**Test User:**
- Access via dev bypass
- Pre-loaded credits for testing
- Isolated from production

---

## Continuous Integration (Future)

### Planned CI/CD Integration

**Pre-Commit Hooks:**
```bash
# Run before each commit
pnpm test:gemini:single
```

**GitHub Actions:**
```yaml
on: [push, pull_request]
jobs:
  test:
    - Run parameter testing on sample
    - Validate cost tracking
    - Check response time benchmarks
    - Run Playwright UI tests
```

**Production Monitoring:**
- Track success rates
- Alert if <95% success
- Monitor average response times
- Cost tracking per generation

---

## Cost Management

### API Call Costs

| Test Type | API Calls | Cost | When to Use |
|-----------|-----------|------|-------------|
| `test:gemini:single` | 1 | $0.039 | Regular development |
| `test:gemini:generate` | 18 | ~$0.70 | Before deployment |
| Full parameter test | 12 | ~$0.47 | Weekly validation |

**Budget-Conscious Testing:**
- Use `test:gemini:single` for daily work
- Reserve full suite for critical changes
- Monitor API usage in Google Cloud Console
- Set budget alerts

---

## Visual Regression Testing

### Screenshot Comparison

**Key UI States to Capture:**
1. Landing page (unauthenticated)
2. Dashboard (authenticated, with credits)
3. Upload interface (empty)
4. Upload interface (with file)
5. Parameter selection panel
6. Generation in progress
7. Results display
8. Error states

**Playwright Implementation:**
```typescript
test('Visual regression - Upload interface', async ({ page }) => {
  await page.goto('/workspace')
  await authenticateDevBypass(page)

  // Screenshot empty state
  await expect(page).toHaveScreenshot('upload-empty.png')

  // Screenshot with file
  await uploadTestImage(page)
  await expect(page).toHaveScreenshot('upload-with-file.png')
})
```

---

## Mobile Testing

### Target Devices
- iPhone 12 (390x844)
- iPad (768x1024)
- Desktop (1920x1080)

### Key Touch Interactions
- Touch-friendly file upload
- Mobile navigation
- Parameter selection on small screens
- Sheet overlays functionality
- Swipe gestures (if applicable)

### Responsive Testing
```typescript
test('Mobile upload workflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  // Test mobile-specific interactions
})
```

---

## Error Scenario Testing

### Network Conditions
- Slow 3G simulation
- Offline mode
- API timeout simulation

### Edge Cases
- Session expiration during upload
- File upload interruption
- Worker service unavailable
- Insufficient credits
- Invalid file types
- File size limits
- Concurrent job limits

---

## Troubleshooting Common Issues

### Backend Tests

**API Connection Fails:**
- Check `GEMINI_API_KEY` in `.env`
- Verify Google Cloud project active
- Check API quotas

**All Tests Fail:**
- Verify test images exist in `test-images/`
- Check network connectivity
- Review worker service logs

**Inconsistent Results:**
- Run tests multiple times
- Check for API rate limiting
- Verify test image quality

### Frontend Tests

**Auth Bypass Not Working:**
- Verify dev server on port 3000
- Check Supabase configuration
- Clear browser localStorage

**Upload Fails:**
- Verify test image path
- Check file size limits
- Review browser console errors

**Playwright MCP Issues:**
- Install Playwright: `npx playwright install`
- Check MCP server configuration
- Review `.playwright-mcp/` logs

---

## Testing Checklist (Production Readiness)

**Backend:**
- [ ] All parameter combinations tested
- [ ] Cost tracking verified
- [ ] Error handling tested
- [ ] Performance benchmarks met
- [ ] PDF generation validated

**Frontend:**
- [ ] Authentication flow works
- [ ] Upload validation correct
- [ ] Parameter selection functional
- [ ] Generation polling works
- [ ] Download/export functional
- [ ] Mobile responsive verified
- [ ] Error states display properly

**Integration:**
- [ ] End-to-end workflow tested
- [ ] Credit system validated
- [ ] Gallery view functional
- [ ] Edit workflow works
- [ ] Multi-device tested

---

## Quick Reference

### Daily Development
```bash
# Backend changes
pnpm test:gemini:single

# UI changes
# Use Playwright MCP or manual testing
node scripts/staging/upload-ready-mcp.js
```

### Before Commit
```bash
# Run cost-effective validation
pnpm test:gemini:single

# Verify UI (if changed)
# Manual test or automated script
```

### Before Deployment
```bash
# Full backend validation
pnpm test:gemini:generate

# Complete UI testing
node scripts/testing/generation-workflow-test.js

# Manual testing checklist
# See MANUAL_TESTING_INSTRUCTIONS.md
```

---

## Confidence Level

**Current Status:** ✅ High Confidence

- Comprehensive backend test suite
- Parameter validation confirms PRD compliance
- Cost tracking accurate
- Error handling tested
- Performance benchmarks established
- UI testing framework in place
- Manual testing procedures documented

**What This Means:**
- Safe for production deployment
- Testing framework catches regressions
- Quality standards measurable and repeatable
- Budget-conscious testing approach

---

## Additional Resources

**Detailed Guides:**
- `MANUAL_TESTING_INSTRUCTIONS.md` - 10 comprehensive manual tests
- `TEST_EXECUTION_GUIDE.md` - Step-by-step execution guide
- `PLAYWRIGHT_MCP_TESTING_STRATEGY.md` - Automated testing strategy

**Scripts:**
- `scripts/staging/` - MCP staging commands
- `scripts/testing/` - Automated test runners
- `services/worker/src/test-*.ts` - Backend test files
