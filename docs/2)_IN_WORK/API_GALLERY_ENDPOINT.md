# Gallery API Endpoint Documentation

**Version**: 1.0
**Created**: 2025-10-02
**Status**: Production Ready (Backend)

---

## Overview

The Gallery API endpoint provides paginated access to a user's generated coloring pages. It returns metadata and signed URLs for all successfully completed coloring page generation jobs.

**Endpoint**: `GET /api/gallery`
**Authentication**: Required (Supabase session cookie)
**Rate Limiting**: Not currently implemented

---

## Request

### HTTP Method
```
GET /api/gallery
```

### Authentication

This endpoint requires a valid Supabase authentication session. The session cookie is automatically included by the browser after user login.

**Auth Method**: Cookie-based (Supabase session)
**Unauthorized Response**: `401 Unauthorized`

### Query Parameters

| Parameter    | Type   | Required | Default | Description                                    | Valid Values           |
|--------------|--------|----------|---------|------------------------------------------------|------------------------|
| `page`       | number | No       | `1`     | Page number for pagination (1-indexed)         | Positive integer ≥ 1   |
| `limit`      | number | No       | `12`    | Number of items per page (max: 50)             | Positive integer 1-50  |
| `sort_by`    | string | No       | `created_at` | Field to sort results by                  | `created_at`, `title`  |
| `sort_order` | string | No       | `desc`  | Sort direction (ascending or descending)       | `asc`, `desc`          |

**Examples**:
```
GET /api/gallery
GET /api/gallery?page=2&limit=24
GET /api/gallery?sort_by=title&sort_order=asc
GET /api/gallery?page=1&limit=12&sort_by=created_at&sort_order=desc
```

### Query Parameter Validation

- **page**: Must be ≥ 1. Returns `400 Bad Request` if invalid.
- **limit**: Must be ≥ 1 and ≤ 50. Values > 50 are clamped to 50.
- **sort_by**: Must be `created_at` or `title`. Returns `400 Bad Request` if invalid.
- **sort_order**: Must be `asc` or `desc`. Returns `400 Bad Request` if invalid.

---

## Response

### Success Response (200 OK)

**Content-Type**: `application/json`

```typescript
{
  items: GalleryItemResponse[],
  pagination: {
    page: number,
    limit: number,
    total_count: number,
    has_more: boolean
  }
}
```

### GalleryItemResponse

Each item in the `items` array contains:

| Field             | Type    | Description                                           | Example                          |
|-------------------|---------|-------------------------------------------------------|----------------------------------|
| `job_id`          | string  | Unique identifier for the generation job              | `"4a7da40b-c584-4844-8338-..."` |
| `title`           | string\|null | User-provided title for the coloring page        | `"My Coloring Page"` or `null`   |
| `image_url`       | string  | Signed URL for the coloring page image (1hr expiry)   | `"https://..."` |
| `thumbnail_url`   | string\|null | Reserved for future thumbnail support             | `null` (future enhancement)      |
| `created_at`      | string  | ISO 8601 timestamp of job creation                    | `"2025-10-02T15:00:00.000Z"`    |
| `complexity`      | string  | Complexity level used for generation                  | `"simple"`, `"standard"`, `"detailed"` |
| `line_thickness`  | string  | Line thickness setting used                           | `"thin"`, `"medium"`, `"thick"`  |
| `has_pdf`         | boolean | Whether a PDF export exists for this generation       | `true` or `false`                |

### Pagination Metadata

| Field         | Type    | Description                                           |
|---------------|---------|-------------------------------------------------------|
| `page`        | number  | Current page number (echoed from request)             |
| `limit`       | number  | Items per page (echoed from request)                  |
| `total_count` | number  | Total number of gallery items available               |
| `has_more`    | boolean | Whether more pages are available beyond current page  |

---

## Example Responses

### Example 1: First Page with Results

**Request**:
```bash
curl -X GET "http://localhost:3000/api/gallery?page=1&limit=2" \
  -H "Cookie: sb-access-token=..." \
  -H "Content-Type: application/json"
```

**Response** (200 OK):
```json
{
  "items": [
    {
      "job_id": "4a7da40b-c584-4844-8338-76a0a63b5501",
      "title": "Cute Puppy Coloring Page",
      "image_url": "https://htxsylxwvcbrazdowjys.supabase.co/storage/v1/object/sign/intermediates/271722b1-4013-4467-b4d9-1e2309a6f830/4a7da40b-c584-4844-8338-76a0a63b5501/edge.png?token=...",
      "thumbnail_url": null,
      "created_at": "2025-10-01T14:23:15.123Z",
      "complexity": "standard",
      "line_thickness": "medium",
      "has_pdf": true
    },
    {
      "job_id": "16004920-3bd0-4490-bb0a-a3189007a7c9",
      "title": null,
      "image_url": "https://htxsylxwvcbrazdowjys.supabase.co/storage/v1/object/sign/intermediates/271722b1-4013-4467-b4d9-1e2309a6f830/16004920-3bd0-4490-bb0a-a3189007a7c9/edge.png?token=...",
      "thumbnail_url": null,
      "created_at": "2025-09-30T10:15:42.456Z",
      "complexity": "detailed",
      "line_thickness": "thin",
      "has_pdf": false
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 2,
    "total_count": 15,
    "has_more": true
  }
}
```

### Example 2: Empty Gallery

**Request**:
```bash
curl -X GET "http://localhost:3000/api/gallery" \
  -H "Cookie: sb-access-token=..." \
  -H "Content-Type: application/json"
```

**Response** (200 OK):
```json
{
  "items": [],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total_count": 0,
    "has_more": false
  }
}
```

### Example 3: Last Page

**Request**:
```bash
curl -X GET "http://localhost:3000/api/gallery?page=3&limit=10" \
  -H "Cookie: sb-access-token=..." \
  -H "Content-Type: application/json"
```

**Response** (200 OK):
```json
{
  "items": [
    {
      "job_id": "c2031092-b404-4000-9749-9829f6cdf4f8",
      "title": "Dinosaur Scene",
      "image_url": "https://...",
      "thumbnail_url": null,
      "created_at": "2025-09-15T08:30:00.000Z",
      "complexity": "simple",
      "line_thickness": "thick",
      "has_pdf": true
    }
  ],
  "pagination": {
    "page": 3,
    "limit": 10,
    "total_count": 21,
    "has_more": false
  }
}
```

---

## Error Responses

### 401 Unauthorized

**Cause**: Missing or invalid authentication session

**Response**:
```json
{
  "error": "Unauthorized"
}
```

**Example**:
```bash
curl -X GET "http://localhost:3000/api/gallery"
# No auth cookie provided
```

---

### 400 Bad Request

**Cause**: Invalid query parameters

**Response**:
```json
{
  "error": "Invalid pagination parameters. Page and limit must be positive integers."
}
```

**Other 400 Error Messages**:
- `"Invalid sort_by parameter. Must be 'created_at' or 'title'."`
- `"Invalid sort_order parameter. Must be 'asc' or 'desc'."`

**Examples**:
```bash
# Invalid page
curl "http://localhost:3000/api/gallery?page=-1"

# Invalid sort_by
curl "http://localhost:3000/api/gallery?sort_by=invalid_field"
```

---

### 500 Internal Server Error

**Cause**: Database error, signed URL generation failure, or unexpected server error

**Response**:
```json
{
  "error": "Internal server error"
}
```

**Note**: Details are logged server-side but not exposed to client for security reasons.

---

## Data Filtering & Behavior

### Included Jobs
- Only jobs with `status = 'succeeded'` are included
- Only jobs belonging to the authenticated user
- Jobs must have at least one `edge_map` asset

### Excluded Jobs
- Jobs with `status = 'queued'`, `'running'`, or `'failed'`
- Jobs without `edge_map` assets (logged as warnings server-side)
- Jobs belonging to other users (enforced by RLS)

### Signed URL Expiry
- All `image_url` values are signed URLs with **1 hour expiry**
- After 1 hour, the URL becomes invalid (403 Forbidden from storage)
- Frontend should refresh gallery data periodically or handle 403 gracefully

---

## Performance Considerations

### Database Queries
- Uses existing indexes:
  - `idx_jobs_user_id_status` for job filtering
  - `idx_assets_user_id_kind` for asset lookup
  - `idx_assets_created_at` for sorting
- Pagination limits memory usage (max 50 items per request)

### Sorting Performance
- **created_at sorting**: Efficient (database-level sort)
- **title sorting**: Currently done in-memory (less efficient for large datasets)
  - Future optimization: Add computed column or materialized view for title

### Signed URL Generation
- Each item requires 1-2 storage API calls (edge_map + optional PDF check)
- For 12 items: ~24 storage API calls
- Requests are parallelized using `Promise.all()`

---

## Frontend Integration Guide

### React Query Example

```typescript
import { useQuery } from '@tanstack/react-query'
import type { GalleryResponse } from '@/lib/types/api'

export function useGallery(page = 1, limit = 12) {
  return useQuery<GalleryResponse>({
    queryKey: ['gallery', page, limit],
    queryFn: async () => {
      const res = await fetch(
        `/api/gallery?page=${page}&limit=${limit}`,
        { credentials: 'include' } // Include auth cookies
      )
      if (!res.ok) {
        throw new Error('Failed to fetch gallery')
      }
      return res.json()
    },
    staleTime: 5 * 60 * 1000, // 5 minutes (within signed URL expiry)
  })
}
```

### Next.js Server Component Example

```typescript
import { cookies } from 'next/headers'

export default async function GalleryPage() {
  const cookieStore = cookies()
  const res = await fetch('http://localhost:3000/api/gallery', {
    headers: {
      cookie: cookieStore.toString(),
    },
  })

  if (!res.ok) {
    return <div>Failed to load gallery</div>
  }

  const gallery: GalleryResponse = await res.json()

  return (
    <div>
      {gallery.items.map(item => (
        <img key={item.job_id} src={item.image_url} alt={item.title || 'Coloring Page'} />
      ))}
    </div>
  )
}
```

---

## Security Notes

1. **Authentication**: All requests must include valid Supabase session cookie
2. **Row Level Security**: Database enforces user isolation (users cannot see others' data)
3. **Signed URLs**: Storage URLs expire after 1 hour to prevent unauthorized access
4. **Input Validation**: All query parameters are validated before database queries
5. **Error Messages**: Internal errors do not leak sensitive information to client

---

## Future Enhancements

### Planned Features
- [ ] Thumbnail generation and `thumbnail_url` support
- [ ] Efficient title sorting (database-level)
- [ ] Search/filter by complexity, line thickness, date range
- [ ] Bulk operations (delete multiple, download as ZIP)
- [ ] Rate limiting
- [ ] Caching strategy (Redis or in-memory)

### Optimization Opportunities
- Add computed column for `title` (extracted from `params_json`)
- Implement database view for common gallery queries
- Add connection pooling for high-traffic scenarios
- Implement cursor-based pagination for large datasets

---

## Troubleshooting

### Issue: 401 Unauthorized (authenticated user)
**Solution**: Check that Supabase session cookie is included in request. Verify session hasn't expired.

### Issue: Empty items array (user has generations)
**Possible Causes**:
- Jobs still in `queued` or `running` status (not yet `succeeded`)
- Jobs failed (status = `'failed'`)
- Jobs missing `edge_map` assets (check server logs for warnings)

### Issue: Signed URLs return 403 Forbidden
**Cause**: URLs expired (> 1 hour old)
**Solution**: Refresh gallery data to get new signed URLs

### Issue: Slow response times
**Possible Causes**:
- Large page size (reduce `limit` parameter)
- Title sorting on large dataset (use `created_at` instead)
- Database performance (check query execution plans)

---

## Testing

### Automated Test Suite

**Recommended**: Run the automated test script for comprehensive endpoint validation.

```bash
# From project root
pnpm --filter @coloringpage/web test:gallery

# From apps/web directory
pnpm test:gallery
```

**Test Coverage** (8 test cases):
- ✅ Auth protection (401 without token)
- ✅ Invalid page parameter handling
- ✅ Invalid sort_by parameter handling
- ✅ Invalid sort_order parameter handling
- ✅ Valid parameters without auth
- ✅ Pagination parameters
- ✅ Title sorting
- ✅ Edge cases (page=0)

**Test Results** (as of 2025-10-02):
```
📊 Test Summary:
   Total Tests: 8
   Passed: 8
   Failed: 0
   Success Rate: 100.0%

✅ All tests passed!
```

**Test Script Location**: `apps/web/test-gallery-api.ts`

**Observations from Automated Testing**:
- Endpoint responding correctly at http://localhost:3000/api/gallery
- Auth-first security design confirmed (401 before param validation)
- All routes return proper JSON error responses
- No server errors or crashes detected

### Manual Testing with cURL

```bash
# Test without auth (should return 401)
curl -X GET "http://localhost:3000/api/gallery"

# Test with auth (requires valid session cookie)
curl -X GET "http://localhost:3000/api/gallery?page=1&limit=12" \
  -H "Cookie: sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH_TOKEN"

# Test invalid parameters
curl -X GET "http://localhost:3000/api/gallery?page=-1"
curl -X GET "http://localhost:3000/api/gallery?sort_by=invalid"
```

### Testing in Browser

1. Login to the application
2. Open browser DevTools > Network tab
3. Navigate to: `http://localhost:3000/api/gallery`
4. Inspect response JSON

---

## Related Documentation

- [Gallery Implementation Tracker](./GALLERY_IMPLEMENTATION_TRACKER.md) - Full implementation log
- [Gallery Feasibility Analysis](./GALLERY_FEATURE_FEASIBILITY_ANALYSIS.md) - Technical design doc
- [API Types Reference](../apps/web/lib/types/api.ts) - TypeScript type definitions

---

**Last Updated**: 2025-10-02 (Added automated test suite)
**Maintainer**: Backend Team
**Status**: Tested & Ready for Frontend Integration
