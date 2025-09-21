# Playwright MCP Testing Strategy

**Date**: 2025-09-21
**Purpose**: Comprehensive end-to-end testing using Playwright MCP for authenticated workflows

## Overview

The Playwright MCP enables automated browser testing that can:
- Navigate the web application
- Interact with UI elements (click, type, upload files)
- Take screenshots for UX analysis
- Monitor console logs and network requests
- Test complete user workflows

## Authentication Testing Strategy

### Magic Link Flow Automation
```typescript
// 1. Navigate to login
await browser_navigate({ url: "http://localhost:3000" })

// 2. Enter email and request magic link
await browser_type({
  element: "email input",
  ref: "input[type=email]",
  text: "test@example.com"
})
await browser_click({
  element: "send magic link button",
  ref: "button[type=submit]"
})

// 3. Check email (would need email service integration)
// 4. Click magic link in test email
// 5. Verify successful authentication and redirect
```

### Session Persistence Testing
- Verify auth state persists across page reloads
- Test logout functionality
- Validate protected route access

## Core Workflow Testing

### Upload → Generate → Download Flow
```typescript
// 1. Upload test image
await browser_file_upload({
  paths: ["/path/to/test-image.jpg"]
})

// 2. Verify image preview appears
await browser_wait_for({ text: "Image ready for processing" })

// 3. Select generation parameters
await browser_click({
  element: "complexity standard option",
  ref: "input[value=standard]"
})
await browser_click({
  element: "line thickness medium option",
  ref: "input[value=medium]"
})

// 4. Start generation
await browser_click({
  element: "generate coloring page button",
  ref: "button:has-text('Generate Coloring Page')"
})

// 5. Monitor job progress
await browser_wait_for({ text: "Generation complete" })

// 6. Verify download availability
await browser_wait_for({ text: "Download" })
```

## Error Scenario Testing

### API Error Handling
- Test 401 authentication failures
- Test 500 server errors
- Test network timeout scenarios
- Verify user-friendly error messages

### File Upload Edge Cases
- Test unsupported file types
- Test oversized files (>10MB)
- Test corrupted image files
- Verify proper error feedback

## Console & Network Monitoring

### Console Error Detection
```typescript
// Monitor for JavaScript errors
const consoleMessages = await browser_console_messages()
const errors = consoleMessages.filter(msg => msg.type === 'error')
```

### Network Request Analysis
```typescript
// Monitor API calls
const networkRequests = await browser_network_requests()
const apiCalls = networkRequests.filter(req =>
  req.url.includes('/api/')
)
```

## Multi-Agent Integration

### UX Review Agent
- Take screenshots at key interaction points
- Analyze visual feedback and loading states
- Identify usability issues
- Validate responsive design

### UI Designer Agent
- Review visual consistency
- Check component styling
- Validate brand adherence
- Assess animation quality

## Test Data Management

### Test Image Assets
- Maintain collection of test images
- Various sizes (small, medium, large)
- Different formats (JPG, PNG, HEIC)
- Edge cases (very dark, very light, complex scenes)

### Test User Accounts
- Dedicated test email accounts
- Various credit balance scenarios
- Different user states (new, returning, premium)

## Implementation Priority

1. **Authentication Flow** - Critical foundation
2. **Core Upload Workflow** - Primary user journey
3. **Error Scenarios** - Edge case coverage
4. **Performance Testing** - Load time validation
5. **Mobile Responsive** - Cross-device testing

## Benefits for Future Sessions

- **Faster Debugging**: Automated reproduction of issues
- **Regression Prevention**: Catch UI breaks immediately
- **UX Validation**: Consistent user experience testing
- **API Integration**: End-to-end flow verification
- **Development Confidence**: Comprehensive test coverage

## Integration with Current Session

For the current 400 error on job creation:
1. Use Playwright to automate the upload flow
2. Monitor network requests to see exact API call
3. Capture console logs for detailed error info
4. Take screenshots of error states
5. Test various parameter combinations

This approach would provide complete context without manual back-and-forth testing.