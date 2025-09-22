# Playwright Staging Scripts

This directory contains Playwright scripts that get AI agents to specific application states for testing and analysis.

## Quick Start

```bash
# Install dependencies (if not already done)
pnpm install

# Ensure app is running on localhost:3000
pnpm dev

# Run individual staging scripts
node scripts/staging/auth-bypass.js          # Get to authenticated home page
node scripts/staging/upload-ready.js         # Get to upload interface with image
node scripts/staging/generation-complete.js  # Test full generation workflow
```

## Scripts Overview

### `/staging/` - Quick State Scripts

**Purpose**: Get AI agents past critical barriers to specific application states

| Script | Purpose | What it does | Output |
|--------|---------|--------------|--------|
| `auth-bypass.js` | Authentication | Navigate → click dev bypass → verify auth | `stage1-authenticated-home.png` |
| `upload-ready.js` | File Upload | Auth → navigate → upload test image | `stage2-upload-ready.png` |
| `generation-complete.js` | Generation Flow | Upload → set params → generate → capture errors | `stage3-generation-result.png` |

**Key Features:**
- **Fast execution** (< 60 seconds each)
- **Self-contained** - can run independently
- **Error handling** - captures failures for debugging
- **Screenshot capture** - provides visual handoff to AI agents
- **Console/network monitoring** - logs API calls and errors

### `/testing/` - Future Test Suite

**Purpose**: Proper end-to-end tests with assertions and expected results

*Currently contains legacy files - proper test suite to be implemented*

## Usage Patterns

### For AI Agents

**Single State Access:**
```bash
# Jump directly to specific state
node scripts/staging/upload-ready.js
# AI can then analyze the uploaded image interface
```

**Sequential Analysis:**
```bash
# Run stages in sequence for complete workflow analysis
node scripts/staging/auth-bypass.js
# → Analyze authentication state
node scripts/staging/upload-ready.js
# → Analyze upload interface
node scripts/staging/generation-complete.js
# → Analyze generation errors
```

**Error Investigation:**
```bash
# Focus on specific workflow issues
node scripts/staging/generation-complete.js
# → Captures current generation errors for debugging
```

### For Developers

**Quick Manual Testing:**
```bash
# Fast way to test authentication flow
node scripts/staging/auth-bypass.js

# Test file upload without manual clicking
node scripts/staging/upload-ready.js
```

**Debugging Generation Issues:**
```bash
# Captures detailed logs and screenshots of generation errors
node scripts/staging/generation-complete.js
# Check console output and stage3-generation-result.png
```

## Technical Details

### Authentication Method
- Uses development bypass button: "🧪 Dev Bypass (wayes.appsmate@gmail.com)"
- Provides real user session with 50 credits
- Only works in development environment

### File Upload Method
- Uses test image: `services/worker/test-images/blue-girl-smile.jpg`
- Direct input file selection (faster than file chooser)
- Waits for upload processing and preview

### Error Handling
- **Console monitoring**: Captures all JavaScript errors
- **Network monitoring**: Logs API requests/responses
- **Screenshot capture**: Visual state at failure points
- **Graceful fallbacks**: Alternative approaches when primary method fails

### Browser Configuration
- **Headless**: `false` (shows browser for debugging)
- **SlowMo**: `500ms` (visual feedback during execution)
- **Timeouts**: Conservative timeouts for reliable execution

## Expected Current Behavior

### ✅ Working (Tested)
- **Stage 1**: Authentication bypass works perfectly
- **Stage 2**: File upload and preview works perfectly
- **Stage 3**: Parameter selection works

### ⚠️ Known Issues (Expected)
- **Generation workflow**: Has current implementation issues
- **API errors**: `/api/jobs` returns errors that are captured for analysis
- **Console warnings**: Dialog accessibility warnings (non-critical)

### 📊 Generation Script Analysis
The `generation-complete.js` script successfully captures:
- ✅ API call to `/api/jobs`
- ✅ Error detection (`error_alert` outcome)
- ✅ Console error logging
- ✅ Network request monitoring
- ✅ Screenshot capture of error states

This provides complete data for debugging the generation workflow.

## Integration with Claude Code

These scripts are designed to work with Claude Code's Playwright MCP and can be:
- **Called directly** by AI agents for fast state access
- **Used as reference** for manual MCP command sequences
- **Extended** for custom testing scenarios
- **Integrated** into CI/CD pipelines for automated testing

## File Structure

```
scripts/
├── README.md                              # This file
├── staging/                               # Quick staging scripts
│   ├── auth-bypass.js                     # Authentication bypass
│   ├── upload-ready.js                    # Upload interface ready
│   ├── generation-complete.js             # Generation workflow test
│   └── stage2-upload-staging-legacy.js   # Legacy MCP instructions
└── testing/                               # Future proper tests
    └── legacy-end-to-end.js              # Outdated test approach
```

Generated screenshots are saved to `scripts/screenshots/` directory to keep project root clean.

## Screenshot Management

```bash
# View generated screenshots
ls scripts/screenshots/

# Clean up screenshots after analysis
rm scripts/screenshots/*.png

# Screenshots are automatically ignored by git (.gitignore)
```