# Gallery Feature Feasibility Analysis

**Date**: 2025-10-02
**Status**: Research & Planning (No code changes or Supabase updates made)

## Executive Summary

**✅ HIGHLY FEASIBLE** - A basic user gallery can be implemented with **primarily front-end work** using existing Supabase infrastructure. The current database schema, RLS policies, and storage buckets are already gallery-ready.

### Quick Assessment
- **Backend Changes Required**: Minimal (1 new API endpoint)
- **Database Schema Changes**: None required for basic gallery
- **Front-end Complexity**: Low-to-Medium (new page + components)
- **Estimated Effort**: 3-5 hours for MVP gallery
- **Risk Level**: Low (existing patterns can be reused)

---

## Previous Gallery Investigations

### PRD Reference (docs/initial_documents/prd.md)
The original PRD outlined a **post-MVP gallery feature** with advanced capabilities:

```
Gallery (post‑MVP sketch)
- Table: gallery_items(id, user_id, artifact_id, title, created_at, visibility[private|link], expires_at?)
- Plan‑based quotas
- Expiring share tokens
- Show export/share warning if faces detected before enabling public link
```

**Key Insights from PRD:**
- Gallery was always planned but deferred post-MVP
- Advanced features envisioned: visibility controls, sharing, quotas
- **Our assessment**: Those advanced features require a new table, but a **basic private gallery doesn't**

### Navigation Structure (docs/PHASE_3B_SESSION_PLAN.md)
The app navigation already includes a "Gallery" placeholder:
```
Navigation structure (Home, Gallery, How It Works)
```

This suggests gallery was anticipated in the UI architecture.

---

## Current Supabase Infrastructure Assessment

### ✅ Database Schema - Ready for Gallery

#### Assets Table
```sql
CREATE TABLE public.assets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  kind asset_kind NOT NULL,  -- 'edge_map' | 'pdf' (our outputs)
  storage_path TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Gallery-Ready Indexes (Already Exist):**
```sql
CREATE INDEX idx_assets_user_id_kind ON public.assets(user_id, kind);
CREATE INDEX idx_assets_created_at ON public.assets(created_at DESC);
```

These indexes are **perfect** for gallery queries like:
```sql
-- Get user's generated coloring pages (most recent first)
SELECT * FROM assets
WHERE user_id = $1 AND kind = 'edge_map'
ORDER BY created_at DESC
LIMIT 20;
```

#### Jobs Table
```sql
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  status job_status,  -- 'succeeded' | 'failed' | 'queued' | 'running'
  params_json JSONB,  -- Contains: title, complexity, line_thickness
  created_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ
);
```

**What We Can Extract for Gallery:**
- `params_json.title` - User's title for the coloring page
- `status` - Filter to only show successful generations
- `created_at` - Sort by generation date
- Can join `jobs` ↔ `assets` via storage_path pattern matching

**Current Linking Pattern:**
```javascript
// From apps/web/app/api/jobs/[id]/route.ts
const { data: jobAssets } = await supabase
  .from('assets')
  .select('*')
  .eq('user_id', user.id)
  .in('kind', ['edge_map', 'pdf'])
  .like('storage_path', `%/${jobId}/%`)
```

### ✅ Row Level Security (RLS) - Already Configured

**Assets RLS Policies (from supabase/migrations/20240101000001_rls_policies.sql):**
```sql
CREATE POLICY "Users can view own assets" ON public.assets
  FOR SELECT USING (auth.uid() = user_id);
```

**✅ Perfect for gallery** - users automatically only see their own images, no additional security work needed.

### ✅ Storage Buckets - Ready for Gallery

**Current Buckets (from supabase/migrations/20240101000002_storage_setup.sql):**
- `intermediates` - Contains edge_map (coloring page PNG)
- `artifacts` - Contains PDF exports
- Both are **private buckets** with user-based RLS

**Storage RLS Policies:**
```sql
CREATE POLICY "Users can view own intermediates" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'intermediates' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

**✅ Already secure** - signed URLs with 1-hour expiry already implemented (see `apps/web/app/api/jobs/[id]/route.ts:89-96`).

---

## What's Needed for Gallery Implementation

### 🟢 Backend Changes (MINIMAL)

#### 1. New API Endpoint: `/api/gallery` (Recommended)

**Purpose**: Fetch paginated list of user's successful generations

**Implementation Pattern** (based on existing code):
```typescript
// apps/web/app/api/gallery/route.ts (NEW FILE)

export async function GET(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()

  // Parse query params for pagination
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const offset = (page - 1) * limit

  // Get successful jobs with their assets
  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id,
      status,
      params_json,
      created_at,
      ended_at
    `)
    .eq('user_id', user.id)
    .eq('status', 'succeeded')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  // For each job, fetch edge_map asset and generate signed URL
  const galleryItems = await Promise.all(
    jobs.map(async (job) => {
      const { data: assets } = await supabase
        .from('assets')
        .select('*')
        .eq('user_id', user.id)
        .eq('kind', 'edge_map')
        .like('storage_path', `%/${job.id}/%`)
        .single()

      if (assets) {
        const { data: signedUrl } = await supabase.storage
          .from('intermediates')
          .createSignedUrl(assets.storage_path, 3600)

        return {
          job_id: job.id,
          title: job.params_json.title || 'Untitled',
          image_url: signedUrl?.signedUrl,
          created_at: job.created_at,
          complexity: job.params_json.complexity,
          line_thickness: job.params_json.line_thickness,
        }
      }
    })
  )

  return NextResponse.json({
    items: galleryItems.filter(Boolean),
    page,
    limit,
    has_more: jobs.length === limit
  })
}
```

**Why This Approach:**
- ✅ Reuses existing auth/security patterns
- ✅ Leverages existing indexes (no DB performance impact)
- ✅ Uses established signed URL generation
- ✅ Follows pagination pattern from current API routes
- ✅ No new database tables or migrations needed

**Estimated Effort**: 1-2 hours

#### 2. Alternative: Enhance Existing `/api/user/profile` (Optional)

Could add gallery data to existing profile endpoint:
```typescript
// Add to apps/web/app/api/user/profile/route.ts

// Get recent successful jobs (last 6 for preview)
const { data: recentJobs } = await supabase
  .from('jobs')
  .select('id, params_json, created_at')
  .eq('user_id', user.id)
  .eq('status', 'succeeded')
  .order('created_at', { ascending: false })
  .limit(6)

// Return in response
return NextResponse.json({
  ...existingData,
  recent_generations: recentJobs // Can expand with asset URLs if needed
})
```

**Trade-off**: Simpler but less flexible than dedicated gallery endpoint.

---

### 🟡 Front-end Changes (PRIMARY WORK)

#### 1. New Gallery Page: `/app/gallery/page.tsx`

**Requirements:**
- Grid layout (responsive: 1-4 columns based on screen size)
- Thumbnail previews with titles
- Click to view full image
- Pagination or infinite scroll
- Empty state ("No coloring pages yet")

**Estimated Complexity**: Medium
**Estimated Effort**: 2-3 hours (reusing existing component patterns)

**Existing Components to Reuse:**
- Image loading patterns from `components/workspace/result-preview.tsx`
- Grid layouts from existing workspace components
- Signed URL handling from `components/workspace/version-comparison.tsx`

#### 2. Gallery Item Component: `/components/gallery/gallery-item.tsx`

**Features:**
- Thumbnail display with lazy loading
- Title overlay or caption
- Click handler to open detail view
- Loading/error states

**Estimated Effort**: 1 hour

#### 3. Gallery Detail Modal (Optional)

**Features:**
- Full-size image view
- Download button (reuse from `components/workspace/result-preview.tsx`)
- PDF export option (reuse existing flow)
- Edit/regenerate options (link to workspace)

**Estimated Effort**: 1-2 hours

#### 4. Navigation Integration

**Update**: `apps/web/components/layout/header.tsx` (or wherever nav lives)
- Add "Gallery" link to main navigation
- Set active state for current page

**Estimated Effort**: 15 minutes

---

## Implementation Approaches: Two Options

### Option A: MVP Gallery (Recommended for First Iteration)

**Scope:**
- Single page showing grid of successful generations
- Basic pagination (12 items per page)
- Click to view full image in modal
- Reuse existing download/export buttons

**Database Changes**: ❌ None
**Backend Work**: ✅ 1 new API endpoint (`/api/gallery`)
**Front-end Work**: ✅ New page + 2-3 components

**Total Estimated Effort**: 3-5 hours
**Risk**: Low (all patterns already exist in codebase)

**Pros:**
- Quick to implement
- Uses existing infrastructure
- Low risk of bugs
- Can iterate based on user feedback

**Cons:**
- No sharing features
- No organization/folders
- No filtering by complexity/date

---

### Option B: Advanced Gallery (Matches PRD Vision)

**Scope:**
- All MVP features PLUS:
- Public/private visibility toggle
- Share links with expiration
- Organize into collections/folders
- Filter by complexity, date, tags
- Face detection warnings before sharing

**Database Changes**: ✅ New `gallery_items` table required
**Backend Work**: ✅ New table migration + 3-4 API endpoints
**Front-end Work**: ✅ Gallery page + sharing UI + settings

**Total Estimated Effort**: 12-20 hours
**Risk**: Medium (new table design, sharing security concerns)

**Pros:**
- Matches original PRD vision
- Enables social features
- Better organization for power users

**Cons:**
- Requires database migration
- More complex security (public URLs, expiration)
- Longer development time
- May be over-engineered for initial use

---

## Recommended Approach: Phased Implementation

### Phase 1: Basic Private Gallery (Week 1)
**Implement Option A** - Get working gallery in front of users quickly

**Deliverables:**
1. `/api/gallery` endpoint with pagination
2. `/gallery` page with grid view
3. Click-to-view modal with download
4. Navigation link

**Success Metrics:**
- Users can view all their generations in one place
- Loading time < 2 seconds for 12 images
- Mobile responsive

---

### Phase 2: Enhanced Features (Week 2-3, Based on Feedback)

**Add incrementally based on user requests:**
- Search/filter (by date, complexity, title)
- Sorting options (newest, oldest, alphabetical)
- Bulk actions (delete multiple, download as zip)
- Title editing from gallery view

**Database Changes**: Still none (just front-end enhancements)

---

### Phase 3: Sharing & Advanced (Future, If Needed)

**Only implement if users request sharing:**
- New `gallery_items` table (per PRD)
- Public/private visibility
- Shareable links with expiration
- Collections/folders

**Database Changes**: Yes (new table + RLS policies)

---

## Risk Assessment

### Low-Risk Items (Ready to Implement)
✅ **Fetching user's assets** - RLS policies ensure security
✅ **Pagination** - Indexes support efficient queries
✅ **Image display** - Signed URL pattern already works
✅ **Download/export** - Existing buttons can be reused

### Medium-Risk Items (Needs Attention)
⚠️ **Performance with many images** - Mitigate with pagination + lazy loading
⚠️ **Mobile layout** - Test grid responsiveness on various devices

### High-Risk Items (Defer to Later Phase)
🔴 **Public sharing** - Requires careful security review, face detection integration
🔴 **Large-scale deletion** - Need cascade rules + storage cleanup

---

## Technical Decisions

### Decision 1: Join Jobs & Assets in API vs Database View?

**Recommendation**: **API-level join** (as shown in sample code)

**Why:**
- Flexibility to change response format
- Easier to add pagination/filtering
- No migration required

**Alternative**: Create database view
```sql
CREATE VIEW user_gallery AS
SELECT
  j.id as job_id,
  j.user_id,
  j.params_json->>'title' as title,
  j.created_at,
  a.storage_path,
  a.kind
FROM jobs j
JOIN assets a ON a.storage_path LIKE '%' || j.id || '%'
WHERE j.status = 'succeeded' AND a.kind = 'edge_map';
```

**Trade-off**: Slightly better performance but less flexible.

---

### Decision 2: Pagination vs Infinite Scroll?

**Recommendation**: **Pagination** (for MVP)

**Why:**
- Simpler to implement
- Better for users with many images (easier to find specific items)
- Lower memory usage on mobile

**Future Enhancement**: Add infinite scroll as option in settings

---

### Decision 3: Thumbnail Generation?

**Current**: Store only full-size edge_map PNG

**Options:**
1. **Generate thumbnails on-the-fly** (current approach via signed URLs + CSS)
2. **Store separate thumbnail assets** (requires worker changes + storage bucket)

**Recommendation**: **On-the-fly** for MVP

**Why:**
- No backend changes
- Signed URLs already support browser-side resizing
- Can add thumbnail storage later if performance becomes issue

---

## Questions for Product Owner

Before implementing, clarify these decisions:

1. **Sorting preference**: Default to newest-first, or let users choose?
2. **Items per page**: 12? 24? Infinite scroll?
3. **Empty state**: Encourage upload, show example gallery, or just simple message?
4. **Failed generations**: Show in gallery (grayed out) or hide completely?
5. **Title handling**: If no title, show "Untitled", generation date, or nothing?
6. **Mobile priority**: Optimize for mobile-first, or desktop-first?

---

## File Structure for Implementation

```
apps/web/
├── app/
│   └── api/
│       └── gallery/
│           └── route.ts                    # NEW: Gallery API endpoint
│   └── gallery/
│       └── page.tsx                        # NEW: Gallery page
│
└── components/
    └── gallery/
        ├── gallery-grid.tsx                # NEW: Grid layout
        ├── gallery-item.tsx                # NEW: Individual item card
        ├── gallery-detail-modal.tsx        # NEW: Full-view modal
        └── gallery-empty-state.tsx         # NEW: Empty state component
```

**Estimated Files**: 5 new files
**Estimated LoC**: ~400-500 lines total

---

## Conclusion

### ✅ Verdict: Highly Feasible, Primarily Front-End Work

**Why This Is Easy:**
1. ✅ Database schema already supports it (no migrations)
2. ✅ RLS policies already secure it (users can't see others' images)
3. ✅ Storage infrastructure ready (signed URLs, private buckets)
4. ✅ Existing code patterns to follow (asset fetching, pagination)

**What Makes It a Front-End Exercise:**
- 80% of work is UI components (grid, modal, empty states)
- 15% is new API endpoint (using existing patterns)
- 5% is navigation integration

**Backend/Supabase Updates Needed:**
- ❌ No schema changes
- ❌ No new tables
- ❌ No RLS policy updates
- ✅ Just 1 new API route following existing patterns

**Confidence Level**: High (95%)
**Recommended Timeline**:
- MVP: 3-5 hours
- Enhanced: +3-5 hours
- Advanced (with sharing): +12-20 hours

---

## Next Steps (When Approved)

1. ✅ **Create `/api/gallery` endpoint** (1-2 hours)
2. ✅ **Build gallery page + components** (2-3 hours)
3. ✅ **Test with various data scenarios** (empty, 1 item, 100 items)
4. ✅ **Mobile responsiveness testing**
5. ✅ **Add to main navigation**
6. 📋 **Write user documentation** (optional)

**No Supabase updates required. No database migrations required. Ready to implement!** 🚀
