# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
This is a Children's Coloring Page Generator web application that converts images into printable coloring pages using Google Gemini's image generation API. The app is built as a monorepo with separate web app and worker services, targeting parents/caregivers as primary users.

**Supabase Project Name**: `scribblemachine`

## Tech Stack & Architecture
- **Frontend**: Next.js 14 with App Router, Tailwind CSS, shadcn/ui components
- **Worker Service**: Node.js/TypeScript with pg-boss job queue
- **Database**: Supabase (PostgreSQL) with Row Level Security
- **Storage**: Supabase Storage for images with signed URLs
- **AI**: Google Gemini image generation API
- **Payments**: Stripe integration
- **Auth**: Supabase Auth with magic links
- **Package Manager**: pnpm with workspace configuration

## Monorepo Structure
```
├── apps/
│   └── web/                    # Next.js web application
├── services/
│   └── worker/                 # Background processing service
├── packages/
│   ├── types/                  # Shared TypeScript types
│   ├── database/               # Database utilities and client
│   └── config/                 # Shared configuration
└── supabase/                   # Database migrations and setup
```

## ⚠️ Process Management: Restart Only When Necessary

**RESTART WEB APP (`pnpm web:dev`) ONLY when:**
- Environment changes (.env files)
- Config changes (next.config.js, package.json)
- New dependencies installed
- Port conflicts or server errors

**RESTART WORKER (`pnpm worker:dev`) ONLY when:**
- Database schema changes
- Worker code changes (src/index.ts, job handlers)
- Environment changes affecting database/AI APIs

**RESTART BOTH (`pnpm dev`) ONLY when:**
- First time starting development
- Major dependency or config changes

**Normal code changes** (React components, pages, styles) use hot reload - no restart needed.

## ⚠️ CRITICAL WARNING: Process Killing

**NEVER USE `taskkill /F /IM node.exe`** - This will kill Claude Code itself!

**Safe process management:**
- Use Ctrl+C to stop individual services
- Use `pnpm dev` to restart cleanly
- Use KillShell tool with shell ID for background processes

## 🔴 CRITICAL: Port 3000 Dependency & Process Management

**Web app MUST run on port 3000** - Supabase auth hardcoded to this port.

**To kill process using port 3000 (WORKING COMMANDS):**

```bash
# 1. Find process using port 3000
netstat -ano | findstr ":3000"

# 2. Kill process using PowerShell (RELIABLE - works in Git Bash)
powershell "Stop-Process -Id <PID> -Force"

# 3. Alternative: CMD wrapper (if PowerShell not available)
cmd /c "taskkill /PID <PID> /F"

# 4. Verify port is free
netstat -ano | findstr ":3000"
# Should return nothing if successful

# 5. Start services
pnpm dev
```

**Example workflow:**
```bash
netstat -ano | findstr ":3000"        # Find PID (e.g., 31460)
powershell "Stop-Process -Id 31460 -Force"    # Kill process
pnpm dev                               # Start services
```

Port migration = authentication broken. Always verify `http://localhost:3000` responds.

## Key Commands

### Development
- `pnpm dev` - Start all services in parallel (web app + worker)
- `pnpm web:dev` - Start only web app on http://localhost:3000
- `pnpm worker:dev` - Start only worker service
- `pnpm build` - Build all services for production
- `pnpm lint` - Run linting across all packages
- `pnpm type-check` - Type check all packages

### Database (Supabase)
- `npx supabase start` - Start local Supabase (optional for development)
- `npx supabase db push` - Apply migrations to database
- `npx supabase db push --linked` - Deploy migrations to production

### Testing
- `pnpm test` - Run all tests across packages
- `pnpm --filter @coloringpage/types test` - Test specific package

#### Backend/Worker Testing (Gemini API)
⚠️ **API Cost Warning**: Always use cost-effective tests for routine validation

**RECOMMENDED (Cost-Effective):**
- `pnpm --filter @coloringpage/worker test:gemini:single` - Single image test (1 API call)

**USE SPARINGLY (Expensive):**
- `pnpm --filter @coloringpage/worker test:gemini:generate` - Full test suite (18 API calls)
- `pnpm --filter @coloringpage/worker test:gemini:generate:full` - Same as above

**Other Worker Tests:**
- `pnpm --filter @coloringpage/worker test:gemini` - Basic Gemini connectivity
- `pnpm --filter @coloringpage/worker test:pdf` - PDF generation testing

## Architecture Details

### Web App (`apps/web`)
- Next.js 14 with App Router architecture
- shadcn/ui component library with Radix UI primitives
- React Query for server state management
- Supabase client for auth and API calls
- React Dropzone for file uploads

### Worker Service (`services/worker`)
- pg-boss PostgreSQL-based job queue
- Three main worker types:
  - `ingest` - Process uploaded images
  - `generate` - Generate coloring pages with Gemini API
  - `pdf` - Create PDF exports with PDFKit
- Sharp for image preprocessing
- Graceful shutdown handling

### Shared Packages
- `@coloringpage/types` - TypeScript interfaces for Jobs, Assets, Users, etc.
- `@coloringpage/database` - Supabase client and utilities
- `@coloringpage/config` - Environment validation with Zod

### Database Schema
Key types defined in `packages/types/src/index.ts`:
- `User` - User accounts and authentication
- `Job` - Processing jobs with status tracking
- `Asset` - Stored files (original, preprocessed, edge_map, pdf)
- `Credits` - User credit balances and events

## Development Workflow

### Environment Setup
1. Copy environment files:
   - `.env.example` → `.env`
   - `apps/web/.env.example` → `apps/web/.env.local`
   - `services/worker/.env.example` → `services/worker/.env`
2. Configure Supabase, Gemini API, and Stripe keys
3. Run `pnpm install` to install all dependencies

### Code Organization
- All packages use workspace dependencies (`workspace:*`)
- Strict TypeScript configuration across all packages
- shared types prevent duplication between web and worker
- Environment validation ensures consistent configuration

### Job Processing Pipeline
1. **Ingest**: Upload handling, image preprocessing with Sharp
2. **Generate**: Gemini API integration for coloring page generation
3. **PDF**: Export to PDF with proper DPI for printing (A4/Letter sizes)

## Critical Implementation Notes

1. **Job Queue**: Uses pg-boss with PostgreSQL for reliable job processing
2. **Error Handling**: Retry limit of 2 with 1-second delay, 1-hour expiration
3. **Type Safety**: Shared types package ensures consistency between services
4. **Environment**: Zod validation for all environment variables
5. **Graceful Shutdown**: SIGINT handling for clean worker shutdown

## Work Log & Scratchpad
**IMPORTANT**: Always maintain `docs/work_log.md` following the tasklog-instructions format:

### Usage Rules
- **NEVER create new log/summary files** - always use `docs/work_log.md`
- **After any meaningful action** (code change, command, file creation, major decision), append an entry at the END
- **Always keep entries in chronological order** (oldest at top, newest at bottom)
- **Update "Last 5 Entries" section** at the top by copying the most recent 5 entries verbatim

### Entry Templates
Use one of two templates:

**SESSION SUMMARY:**
```
### [<ISO8601 timestamp with timezone>] — Session Summary
**Focus:** <one-liner>
**Done:**
- <up to 3 bullets>
**Next:**
- <1–2 bullets>
**Decisions:**
- <0–2 bullets>
**Notes:**
- <optional>
```

**TASK/EVENT:**
```
### [<ISO8601 timestamp with timezone>] — Task/Event
**Context:** <short one-liner>
**What changed:**
- <1–3 bullets>
**Leftover:**
- <1–2 bullets>
```

### Constraints
- Max 3 bullets per list
- Do not paste large code or logs; link to diffs/PRs/issues instead
- Do not overwrite existing entries; append only
- Every time you update, refresh the "Last 5 Entries" section at the top

## MCP Server Usage

The project is configured to work with these MCP servers:

### Context7 MCP
- **Use for**: Documentation lookup and API reference checking
- **Best practice**: When implementing new features, use Context7 to look up latest API documentation for Gemini, Supabase, or other services
- **Example**: "Look up Gemini API image generation endpoints" before implementing AI features

### Supabase MCP
- **Use for**: Database operations, schema management, and real-time features
- **Best practice**: Use for complex database queries, migration management, and debugging Supabase-specific issues
- **Example**: Managing RLS policies, storage bucket configurations, or complex joins

### Playwright MCP
- **Use for**: End-to-end testing and user flow validation
- **UI Staging Scripts Available**: Use these BEFORE manual Playwright MCP testing
  - `node scripts/staging/auth-bypass.js` - Get to authenticated home page (< 30s)
  - `node scripts/staging/upload-ready.js` - Get to upload interface with image (< 60s)
  - `node scripts/staging/generation-complete.js` - Test full workflow with error capture (< 90s)
  - **Benefits**: Faster than manual MCP, handles authentication/upload barriers, captures errors
  - **Screenshots**: Saved to `scripts/screenshots/` (can be cleaned with `rm scripts/screenshots/*.png`)
- **Authentication**: Use development bypass for authenticated testing:
  1. Navigate to `http://localhost:3000`
  2. Click "Upload Photo - It's FREE!" to trigger sign-in
  3. Click "Sign In" button to open auth dialog
  4. Click "🧪 Dev Bypass (wayes.appsmate@gmail.com)" for instant authentication
  5. User now has full access with 50 credits for testing
- **Best practice**:
  - **START with staging scripts** to quickly reach desired application state
  - If staging fails, fall back to manual MCP commands following the steps above
  - Test complete authenticated workflows (upload → generate → download)
  - Validate responsive design across different screen sizes
  - Test payment flows when Stripe integration is added
  - Screenshot comparison for UI regression testing
  - Clean up screenshots: `rm scripts/screenshots/*.png` after analysis
- **When to use**: After implementing new UI features or before production deployments

