# Gallery Part 2: Improvements & Fixes

**Created**: 2025-10-02
**Status**: Planning Phase
**Priority**: High (Fixes critical UX issues)

---

## Executive Summary

Phase 1 of the Gallery feature is functional but has several UX and performance issues that need addressing:
1. **CRITICAL**: Titles show "Untitled Coloring Page" (prompts exist but not used)
2. **CRITICAL**: PDF downloads don't work
3. **HIGH**: Mobile UI has purple background issue (narrow viewport styling)
4. **HIGH**: Slow image loading (no thumbnails, full-size PNGs)
5. **MEDIUM**: Gallery gets stuck on loading screen (performance/error handling)
6. **MEDIUM**: Too many Supabase API calls (169 items × 2-3 queries each)

---

## Issue Analysis

### 1. Title Display Issue ✅ FIXABLE

**Current Behavior**: All items show "Untitled Coloring Page"

**Root Cause**:
- API extracts `params.title` from `params_json` (line 168 in gallery/route.ts)
- Database shows `params_json` contains:
  - `text_prompt`: "a chicken running down the street" (text-to-image jobs)
  - `edit_prompt`: "add some stars on the girls top" (edit jobs)
  - `asset_id`: UUID (upload jobs - no prompt)
- **NO `title` field exists** in params_json

**Solution**: Extract prompts and generate smart titles
- **Text prompt jobs**: Use first 50 chars of `text_prompt`
- **Edit jobs**: Use `edit_prompt`
- **Upload jobs**: Use creation date or "Photo Upload - Oct 2"
- Add title generation logic to API

**Feasibility**: ✅ **100% - Easy fix** (data exists, just needs extraction)

**Estimated Time**: 30 minutes

---

### 2. PDF Download Failure ✅ FIXABLE

**Current Behavior**: "Download PDF" button doesn't work

**Root Cause**:
- Modal tries to fetch `/api/jobs/${job_id}` to get PDF signed URL
- Looking at the data: PDFs DO exist (kind='pdf' in assets table)
- Issue: `/api/jobs/[id]/route.ts` might not return signed URLs for PDFs, or format differs

**Solution**:
- Option A: Pre-fetch PDF signed URLs in gallery API (add pdf_url field)
- Option B: Fix `/api/jobs/[id]` to return PDF signed URLs
- Option C: Direct PDF download endpoint

**Feasibility**: ✅ **100% - Medium complexity**

**Estimated Time**: 45 minutes - 1 hour

---

### 3. Mobile Purple Background ✅ FIXABLE

**Current Behavior**: Background turns solid purple on narrow viewports

**Root Cause**:
- Gallery page uses `bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50`
- On narrow screens, gradient might not cover full height
- Or grid items cause layout issues

**Solution**:
- Ensure min-height on main container
- Add `min-h-screen` to wrapper
- Test background behavior on narrow viewports

**Feasibility**: ✅ **100% - Easy CSS fix**

**Estimated Time**: 15 minutes

---

### 4. Slow Image Loading ⚠️ PARTIAL FIX

**Current Behavior**: Images load slowly, sometimes very slow

**Root Cause**:
- Loading full-size PNG files (edge_map assets are ~1-5MB each)
- No thumbnail generation
- Signed URL generation adds latency (1 Supabase call per item)
- 12 images per page = 12 full-size PNGs to download

**Immediate Solutions**:
1. **Add image optimization** - Use Next.js Image component with blur placeholder
2. **Lazy loading** - Already implemented but can improve
3. **Reduce initial page size** - Show 8 items instead of 12
4. **Add loading skeleton** - Better visual feedback

**Long-term Solutions** (requires backend work):
1. **Thumbnail generation** - Worker creates 400x400px thumbnails during job processing
2. **Store thumbnails** - New asset kind: `thumbnail`
3. **CDN caching** - Supabase Storage has CDN but signed URLs bypass it

**Feasibility**:
- ✅ Immediate fixes: **100% - 1-2 hours**
- ⚠️ Thumbnail generation: **Requires worker changes** (4-6 hours)

**Estimated Time**:
- Quick wins: 1-2 hours
- Full solution: 6-8 hours

---

### 5. Loading Screen Stuck 🔴 NEEDS INVESTIGATION

**Current Behavior**: Gallery sometimes gets stuck on loading screen

**Possible Causes**:
1. **API timeout** - Too many database queries (169 jobs × 3 queries = 507 DB calls!)
2. **Network timeout** - Slow signed URL generation
3. **Error not caught** - Silent failure, spinner never stops
4. **Race condition** - Multiple renders causing state issues

**Investigation Needed**:
- Check browser console for errors
- Check network tab for failed requests
- Add error logging to API
- Test with smaller datasets

**Solutions**:
1. **Add timeout handling** - Show error after 10 seconds
2. **Better error messages** - "Failed to load gallery" with retry button
3. **Optimize API queries** - Batch operations, reduce DB calls
4. **Add request cancellation** - Cancel pending requests on unmount

**Feasibility**: ⚠️ **Needs diagnosis first**

**Estimated Time**:
- Error handling improvements: 1 hour
- Performance optimization: 2-4 hours

---

### 6. Too Many Supabase API Calls 🔴 PERFORMANCE ISSUE

**Current Behavior**: Gallery API makes 3 queries per item × 12 items = 36+ queries per page load

**Breakdown per item**:
1. Get edge_map asset (`.single()`)
2. Get PDF asset (`.maybeSingle()`)
3. Generate signed URL for edge_map
4. Plus: 1 total count query at start

**Solutions**:

#### Option A: Batch Asset Queries (Recommended)
```typescript
// Instead of querying per job:
const allAssets = await supabase
  .from('assets')
  .select('*')
  .eq('user_id', user.id)
  .in('kind', ['edge_map', 'pdf'])
  .in('job_id_extracted_from_path', jobIds) // If we add job_id column

// Then match in memory
```

#### Option B: Database View
Create a materialized view that joins jobs + assets

#### Option C: Denormalize Data
Store asset URLs directly in jobs table (requires schema change)

**Feasibility**:
- ✅ Option A: **100% - No schema changes** (2-3 hours)
- ⚠️ Option B/C: Requires migration (4-6 hours)

**Estimated Time**: 2-4 hours for Option A

---

## Priority Matrix

| Issue | Priority | Impact | Effort | Feasibility |
|-------|----------|--------|--------|-------------|
| 1. Titles | 🔴 **CRITICAL** | High | Low (30min) | ✅ 100% |
| 2. PDF Downloads | 🔴 **CRITICAL** | High | Medium (1hr) | ✅ 100% |
| 3. Mobile Background | 🟡 **HIGH** | Medium | Low (15min) | ✅ 100% |
| 4. Image Loading | 🟡 **HIGH** | High | Medium (2hr) | ✅ 90% |
| 5. Loading Stuck | 🟡 **MEDIUM** | Medium | Medium (2hr) | ⚠️ 70% |
| 6. API Performance | 🟡 **MEDIUM** | High | High (3hr) | ✅ 80% |

---

## Recommended Implementation Plan

### **Phase 2A: Critical Fixes** (2-3 hours)
**Goal**: Fix broken functionality and worst UX issues

1. **Fix Titles** (30 min)
   - Extract `text_prompt`, `edit_prompt` from params_json
   - Generate smart titles (first 50 chars + "...")
   - Fallback to "Photo Upload - [Date]" for uploads

2. **Fix PDF Downloads** (1 hour)
   - Add `pdf_url` field to GalleryItemResponse
   - Pre-generate PDF signed URLs in gallery API
   - Update modal to use direct URL

3. **Fix Mobile Background** (15 min)
   - Add `min-h-screen` to gallery wrapper
   - Test on 375px, 768px, 1024px widths

4. **Add Better Error Handling** (30 min)
   - Timeout after 15 seconds
   - Show retry button
   - Log errors to console

**Total**: ~2.5 hours

---

### **Phase 2B: Performance Improvements** (3-4 hours)
**Goal**: Make gallery fast and smooth

1. **Optimize Image Loading** (2 hours)
   - Add loading skeletons (fade-in effect)
   - Reduce page size to 9 items (3×3 grid)
   - Add `priority` to first 3 images
   - Implement progressive loading

2. **Batch API Queries** (2 hours)
   - Fetch all assets in one query
   - Match assets to jobs in memory
   - Reduce DB calls from 36+ to ~4 per page

**Total**: ~4 hours

---

### **Phase 2C: Polish & Enhancement** (4-6 hours)
**Goal**: Professional-grade UX

1. **Thumbnail Generation** (4 hours) - **OPTIONAL**
   - Modify worker to create 400×400px thumbnails
   - Store as new asset kind
   - Update gallery to use thumbnails
   - Fallback to full image if thumbnail missing

2. **Search & Filter** (2 hours) - **OPTIONAL**
   - Add search bar (filter by prompt text)
   - Filter by complexity dropdown
   - Filter by date range

**Total**: ~6 hours (optional)

---

## Quick Wins (Do First)

These can be done in **1 hour total** for immediate improvement:

1. **Titles from prompts** (30 min) - Huge UX win
2. **Mobile background** (15 min) - Fixes visual bug
3. **Error timeout** (15 min) - Prevents infinite loading

---

## Technical Debt & Future Considerations

### Data Architecture
- **Current**: Assets linked via storage_path pattern matching (`LIKE '%/{job_id}/%'`)
- **Issue**: No foreign key, slow queries
- **Future**: Add `job_id` column to assets table for proper JOIN

### Caching Strategy
- **Current**: Signed URLs expire after 1 hour, no caching
- **Future**: Implement Redis/memory cache for signed URLs (refresh every 30 min)

### Scalability
- **Current**: Works for 100-500 items per user
- **Issue**: Pagination alone won't scale to 10,000+ items
- **Future**: Implement cursor-based pagination, virtual scrolling

---

## Testing Plan

### Manual Testing Checklist
- [ ] Titles display correctly (prompts, not "Untitled")
- [ ] PDF download works
- [ ] Mobile background looks good (375px, 768px)
- [ ] Gallery loads within 3 seconds
- [ ] No infinite loading spinner
- [ ] Error messages show on failure
- [ ] Pagination works (all 15 pages)
- [ ] Images load progressively
- [ ] Detail modal shows correct data

### Performance Testing
- [ ] API response time < 2 seconds
- [ ] First image visible < 1 second
- [ ] All images loaded < 5 seconds
- [ ] No memory leaks (test 10 page navigations)

---

## Success Criteria

**Phase 2A Complete When**:
- ✅ Titles show prompts, not "Untitled"
- ✅ PDF downloads work
- ✅ Mobile background fixed
- ✅ No infinite loading screens

**Phase 2B Complete When**:
- ✅ Gallery loads < 3 seconds
- ✅ Images load progressively
- ✅ API makes < 10 DB queries per page

**Phase 2C Complete When**:
- ✅ Thumbnails load instantly
- ✅ Search/filter works
- ✅ Professional polish

---

## Additional Issues Found

### Minor Issues
1. **DialogTitle accessibility warning** - Cosmetic, but should fix for screen readers
2. **No loading state for pagination** - Clicking "Next" has no feedback
3. **No empty search results state** - If we add search
4. **No delete functionality** - Users can't remove unwanted pages

### Enhancement Ideas
1. **Bulk download** - Download multiple as ZIP
2. **Title editing** - Let users rename pages
3. **Favorites/starring** - Mark favorites
4. **Share links** - Generate public links (requires new table per PRD)
5. **Print button** - Direct print from gallery
6. **Grid size toggle** - 2/3/4 columns

---

## File Changes Required

### Phase 2A (Critical Fixes)
**Modified**:
- `apps/web/app/api/gallery/route.ts` - Extract prompts, add pdf_url
- `apps/web/lib/types/api.ts` - Add pdf_url to GalleryItemResponse
- `apps/web/components/gallery/gallery-detail-modal.tsx` - Use direct pdf_url
- `apps/web/app/gallery/page.tsx` - Fix background, add error timeout

**No new files needed**

### Phase 2B (Performance)
**Modified**:
- `apps/web/app/api/gallery/route.ts` - Batch queries
- `apps/web/components/gallery/gallery-grid.tsx` - Reduce to 9 items
- `apps/web/components/gallery/gallery-item.tsx` - Add skeleton loader

### Phase 2C (Optional)
**New files if implemented**:
- `services/worker/src/thumbnail-generator.ts`
- Migration: Add job_id to assets table

---

## Estimated Total Time

| Phase | Time | Priority |
|-------|------|----------|
| Phase 2A: Critical Fixes | **2-3 hours** | 🔴 Must Do |
| Phase 2B: Performance | **3-4 hours** | 🟡 Should Do |
| Phase 2C: Polish | **4-6 hours** | 🟢 Nice to Have |
| **TOTAL** | **9-13 hours** | |

**Minimum Viable Improvement**: Phase 2A only (2-3 hours)
**Recommended**: Phase 2A + 2B (5-7 hours)
**Full Polish**: All phases (9-13 hours)

---

## Next Steps

1. **Review this document** - Approve priority order
2. **Start with Quick Wins** - Titles + Mobile + Error handling (1 hour)
3. **Test each fix** - Use Playwright MCP after each change
4. **Deploy incrementally** - Don't wait for all fixes
5. **Monitor performance** - Check Supabase metrics after changes

---

## Notes

- All fixes are backward compatible (no breaking changes)
- No database migrations required for Phase 2A/2B
- Can deploy fixes incrementally (don't need to wait for full completion)
- Thumbnail generation (Phase 2C) is the only change requiring worker modification

**Recommendation**: Start with **Phase 2A** (critical fixes) immediately. These are high-impact, low-effort changes that will dramatically improve UX.
