# Phase 3B Context - Frontend Development

**Date**: 2025-09-20
**Status**: READY TO EXECUTE
**Prerequisites**: Phase 3A (Backend Integration) ✅ COMPLETE

## Current Status: Phase 3A COMPLETE ✅

### What We Just Accomplished (Phase 3A)
- ✅ **API Integration**: Connected `POST /api/jobs` endpoint to worker processing
- ✅ **Worker Service**: Database polling worker processing generation jobs
- ✅ **Credit System**: Full credit deduction/refund logic implemented
- ✅ **End-to-End Flow**: API → Database → Worker → Gemini → Storage → Completion
- ✅ **Services Running**: Web app (localhost:3000) + Worker service active

### Key Implementation Details
- **Job Creation**: API creates jobs with `queued` status for worker pickup
- **Worker Polling**: Simple worker polls database every 5 seconds
- **Credit Handling**: Optimistic deduction with refund on failure
- **Storage**: Supabase Storage with TTL policies (originals, intermediates, artifacts)

## Phase 3B Goal: Frontend Development (8-12 hours)

### Objective
Build a complete user interface on top of the working API foundation, prioritizing **backend compatibility** over design perfection.

### Critical Principle: Backend-First Approach
**Priority**: Adapt frontend to match working backend rather than modifying backend to match UI designs.

- If UI mockups suggest different data structures → adapt UI to existing API
- If designs show different workflows → follow existing API patterns
- If visual designs conflict with backend reality → prioritize working functionality

## Technical Stack (Already Configured)

### Current Setup ✅
- **Next.js 14**: App Router already configured
- **Tailwind CSS**: Installed and working
- **shadcn/ui**: Ready for component installation
- **TypeScript**: Full type definitions in `@coloringpage/types`
- **Supabase**: Auth and API clients configured

### To Add
- **React Query**: For API state management
- **React Hook Form + Zod**: Form validation
- **Framer Motion**: Subtle animations
- **react-dropzone**: File upload handling

## Backend API Reality (Adapt UI to This)

### Authentication Flow
```typescript
// Magic Link Auth (working)
POST /api/auth/magic-link
// User sessions handled by Supabase Auth
```

### Core API Endpoints (Working)
```typescript
// Upload presigned URL
POST /api/upload → { uploadUrl, assetId }

// Create generation job
POST /api/jobs → { jobId, status }
Body: { assetId, complexity: 'simple'|'standard'|'detailed', lineThickness: 'thin'|'medium'|'thick' }

// Job status polling
GET /api/jobs/[id] → { id, status, progress, downloadUrl? }

// User credits
GET /api/credits → { balance, history }

// PDF export
POST /api/pdf/export → { pdfUrl }
```

### Data Types (Use These Exactly)
```typescript
// From @coloringpage/types
type Complexity = 'simple' | 'standard' | 'detailed'
type LineThickness = 'thin' | 'medium' | 'thick'
type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed'
```

## UI Plan Implementation Strategy

### Core Pages
1. **Landing Page** (`/`)
   - Hero with upload CTA
   - Magic link authentication
   - Credit balance display

2. **Workspace** (`/create`)
   - Left: Preview area (generated image/PDF)
   - Right: Controls (parameters, actions)
   - Mobile: Sheet overlay for controls

### Key Components to Build

#### 1. Authentication Components
- `MagicLinkForm`: Email input + send link
- `AuthProvider`: Session management wrapper
- `UserProfile`: Credit balance + logout

#### 2. Upload Components
- `FileUploader`: Drag-and-drop with react-dropzone
- `ImagePreview`: Display uploaded image
- `UploadProgress`: During upload state

#### 3. Generation Controls
- `ParameterForm`: Complexity + line thickness selectors
- `GenerationProgress`: Job status polling with progress
- `ResultPreview`: Display generated coloring page

#### 4. Download Components
- `PDFExport`: Generate and download PDF
- `DownloadButton`: Asset download handling

### Implementation Phases

#### Phase 1: Project Setup (30 min)
```bash
# Add required dependencies
npm install @tanstack/react-query react-hook-form @hookform/resolvers zod framer-motion react-dropzone

# Install shadcn components
npx shadcn-ui add button card textarea input label radio-group slider sheet dialog alert toast progress skeleton badge
```

#### Phase 2: Authentication Foundation (1-2 hours)
- Magic link authentication flow
- Session management with Supabase
- Protected routes and auth state

#### Phase 3: Core Workspace (3-4 hours)
- File upload with preview
- Parameter selection form
- Job creation and polling
- Result display

#### Phase 4: Polish & Mobile (2-3 hours)
- Mobile responsive design
- Loading states and error handling
- PDF export functionality
- Toast notifications

#### Phase 5: Integration Testing (1-2 hours)
- End-to-end user flow testing
- Error scenario handling
- Performance optimization

## Backend Integration Points

### Critical Considerations

1. **Job Status Polling**
   - Poll `GET /api/jobs/[id]` every 2-3 seconds during processing
   - Handle all status states: queued, running, succeeded, failed
   - Show appropriate UI for each state

2. **Credit Management**
   - Display credit balance prominently
   - Handle insufficient credits gracefully
   - Show credit deduction/refund in real-time

3. **File Handling**
   - Use `POST /api/upload` for presigned URLs
   - Upload directly to Supabase Storage
   - Handle large file uploads with progress

4. **Error Handling**
   - Network errors during upload/generation
   - Insufficient credits scenarios
   - Job failure and retry logic
   - Rate limiting responses

## Mobile Strategy

### Responsive Breakpoints
- Desktop: Side-by-side layout (preview | controls)
- Tablet: Stacked layout with collapsible controls
- Mobile: Sheet overlay with FAB for controls

### Touch Interactions
- Large touch targets (44px minimum)
- Swipe gestures for sheet navigation
- Pull-to-refresh for job status

## Performance Considerations

### Optimization Priorities
1. **Fast Initial Load**: Minimize bundle size
2. **Responsive Upload**: Chunked upload with progress
3. **Efficient Polling**: Smart polling intervals
4. **Image Optimization**: Proper image sizing and formats

### Caching Strategy
- React Query for API state caching
- Image caching for previews
- Optimistic updates for credits

## Success Criteria

### Functional Requirements ✅
- [ ] User can authenticate with magic link
- [ ] User can upload images successfully
- [ ] User can set generation parameters
- [ ] User can create generation jobs
- [ ] User can monitor job progress in real-time
- [ ] User can download generated coloring pages
- [ ] User can export to PDF
- [ ] All flows work on mobile devices

### Technical Requirements ✅
- [ ] All API endpoints integrated correctly
- [ ] Error handling for all failure scenarios
- [ ] Responsive design across all devices
- [ ] Accessible UI with proper ARIA labels
- [ ] Loading states for all async operations
- [ ] Type safety with TypeScript

## Files to Reference

### UI Design & Plan
- **UI Plan**: `docs/initial_documents/ui_plan_shadcn_ui.md`
- **Component Examples**: Use shadcn/ui documentation

### Backend Integration
- **API Types**: `apps/web/lib/types/api.ts`
- **Supabase Client**: `apps/web/lib/supabase/`
- **Authentication**: `apps/web/lib/auth/`

### Testing & Validation
- **API Tests**: `apps/web/test-api-endpoints.js`
- **Manual Testing**: `docs/MANUAL_TESTING_INSTRUCTIONS.md`

## Architectural Decisions Context

### Key ADRs to Consider
- **[ADR-001](./architecture-decisions/ADR-001-database-polling-vs-pgboss.md)**: Database polling approach
- **[ADR-002](./architecture-decisions/ADR-002-simplified-worker-architecture.md)**: Simplified worker architecture

### Design Implications
- UI should reflect job processing reality (sequential, not parallel)
- Show realistic timing expectations (6-12 seconds per generation)
- Handle worker service interruptions gracefully

## Ready to Execute Phase 3B

**Current State**: All backend services running and tested
**Next Steps**: Begin UI implementation with authentication foundation
**Estimated Duration**: 8-12 hours for complete user-facing application
**Priority**: Working functionality over visual perfection

The backend foundation is solid and ready for beautiful UI to be built on top of it!