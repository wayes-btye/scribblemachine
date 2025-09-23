# Scripts Directory

This directory contains two types of scripts for different purposes:

## 📋 Staging Scripts (`/staging/`)

**Purpose**: Generate MCP (Model Context Protocol) instructions for AI agents to reach specific application states.

**How they work**: These scripts output exact Playwright MCP commands that AI agents can copy and execute in their own browser sessions.

### Available Staging Scripts

- **`auth-bypass-mcp.js`** - Get to authenticated home page state
- **`upload-ready-mcp.js`** - Get to upload interface with test image uploaded  
- **`generation-complete-mcp.js`** - Complete full workflow including generation

### Usage

```bash
# Generate MCP instructions for authentication
node scripts/staging/auth-bypass-mcp.js

# Generate MCP instructions for upload ready state  
node scripts/staging/upload-ready-mcp.js

# Generate MCP instructions for complete generation workflow
node scripts/staging/generation-complete-mcp.js
```

**Output**: Each script outputs step-by-step MCP commands that AI agents can execute:

```javascript
// Example output:
await mcp_playwright_browser_navigate({
  "url": "http://localhost:3000"
});

await mcp_playwright_browser_click({
  "element": "Upload Photo - It's FREE! button",
  "ref": "FIND_BY_TEXT"
});
// ... more commands
```

## 🧪 Testing Scripts (`/testing/`)

**Purpose**: Run automated tests and generate detailed reports for AI agents to analyze.

**How they work**: These scripts execute actual Playwright tests, capture screenshots, logs, and generate JSON reports.

### Available Testing Scripts

- **`auth-flow-test.js`** - Validate authentication workflow
- **`upload-validation-test.js`** - Validate file upload functionality
- **`generation-workflow-test.js`** - Test complete generation workflow

### Usage

```bash
# Test authentication flow
node scripts/testing/auth-flow-test.js

# Test upload validation
node scripts/testing/upload-validation-test.js

# Test complete generation workflow  
node scripts/testing/generation-workflow-test.js
```

**Output**: Each test generates:
- **JSON Report**: Detailed test results in `scripts/logs/testing/`
- **Screenshots**: Visual evidence in `scripts/screenshots/testing/`
- **Console Output**: Real-time test progress and summary

### Test Report Format

```json
{
  "testName": "Authentication Flow Test",
  "timestamp": "2025-09-23T05:45:16.870Z", 
  "passed": false,
  "duration": 12285,
  "steps": ["Navigate to application", "Verify initial page load", ...],
  "screenshots": ["auth-test-01-initial-load.png", ...],
  "errors": [],
  "consoleMessages": [...],
  "networkRequests": [...],
  "assertions": {
    "total": 6,
    "passed": 4, 
    "failed": 2
  }
}
```

## 🔄 Workflow Integration

### For AI Agents

1. **Use Staging Scripts** when you need to reach a specific application state:
   - Copy the generated MCP commands
   - Execute them in your MCP session
   - Proceed with your analysis

2. **Use Testing Scripts** when you need to validate functionality:
   - Run the test script
   - Analyze the generated reports and screenshots
   - Investigate any failures or issues

### Prerequisites

- Application must be running on `http://localhost:3000`
- Playwright must be installed (available in project dependencies)
- Test image must exist: `services/worker/test-images/blue-girl-smile.jpg`

### Directory Structure

```
scripts/
├── staging/                    # MCP instruction generators
│   ├── auth-bypass-mcp.js     # Authentication state
│   ├── upload-ready-mcp.js    # Upload ready state  
│   └── generation-complete-mcp.js # Complete workflow
├── testing/                    # Automated test runners
│   ├── auth-flow-test.js       # Auth workflow validation
│   ├── upload-validation-test.js # Upload functionality test
│   └── generation-workflow-test.js # Complete workflow test
├── screenshots/                # Generated during testing
│   └── testing/               # Test screenshots
├── logs/                      # Generated during testing  
│   └── testing/               # Test reports (JSON)
└── README.md                  # This file
```

## 🚨 Important Notes

- **Staging scripts** don't run browsers - they generate instructions
- **Testing scripts** do run browsers and require the app to be running
- Both types capture screenshots for analysis
- Test failures are often acceptable - the goal is comprehensive analysis
- Clean up screenshots periodically: `rm scripts/screenshots/testing/*.png`

## 🔧 Troubleshooting

### App Not Running
```bash
# Check if app is running
netstat -ano | findstr ":3000"

# Start the app if needed
pnpm dev
```

### Missing Test Image
```bash
# Verify test image exists
ls services/worker/test-images/blue-girl-smile.jpg
```

### Playwright Issues
```bash
# Install browsers if needed
npx playwright install
```