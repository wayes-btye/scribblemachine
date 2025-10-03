# Port 3000 Dependency Analysis

## Critical Finding

Web app requires port 3000 due to hardcoded Supabase authentication configuration. Port migration breaks login functionality.

## Dependencies Found

1. **Supabase auth**: `site_url = "http://127.0.0.1:3000"` in supabase/config.toml
2. **Environment**: `NEXT_PUBLIC_APP_URL=http://localhost:3000`
3. **Testing**: All test scripts expect localhost:3000

## Impact

**Port migration → Authentication completely broken**
- Magic links redirect to wrong port
- User cannot log in
- Development flow broken

## Solution Implemented

**Force port 3000**: Modified `apps/web/package.json` to use `next dev -p 3000`

**CLAUDE.md updated**: Added port 3000 requirement with clear instructions.

## Validation

User correctly identified flaw in assuming port migration is harmless. Some "startup issues" were real authentication failures, not false positives.