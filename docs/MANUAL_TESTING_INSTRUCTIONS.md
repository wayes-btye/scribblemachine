# Manual Testing Instructions - Phase 2 API Endpoints

## Overview

This document provides step-by-step instructions for manually testing the Phase 2 backend API implementation. These tests validate that all API endpoints, authentication, database integration, and security measures are working correctly.

## Prerequisites

### 1. Environment Setup
- ✅ Web app running on `http://localhost:3000`
- ✅ Supabase project configured and accessible
- ✅ Environment variables properly set in `apps/web/.env.local`
- ✅ Database migrations applied

### 2. Required Tools
- **HTTP Client**: Postman, Insomnia, or curl
- **Browser**: For authentication flow testing
- **Email Access**: For magic link testing (optional)

### 3. Test Data
- Test email address (for authentication)
- Sample image file (JPEG/PNG, <10MB)
- Valid file data for upload testing

## Test Suite

### Test 1: Health Check & Server Status

**Purpose**: Verify the web application is running and accessible.

**Steps**:
1. Open browser to `http://localhost:3000`
2. Verify the application loads without errors
3. Check browser console for any JavaScript errors

**Expected Results**:
- ✅ Application loads successfully
- ✅ No critical console errors
- ✅ Basic Next.js application is responsive

### Test 2: Magic Link Authentication

**Purpose**: Test the authentication flow end-to-end.

#### 2.1 Send Magic Link
**Endpoint**: `POST /api/auth/magic-link`

**Test Cases**:

```bash
# Test 1: Valid email
curl -X POST http://localhost:3000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test 2: Missing email
curl -X POST http://localhost:3000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{}'

# Test 3: Invalid email format
curl -X POST http://localhost:3000/api/auth/magic-link \
  -H "Content-Type: application/json" \
  -d '{"email": "invalid-email"}'
```

**Expected Results**:
- ✅ Valid email: 200 OK with success message
- ✅ Missing email: 400 Bad Request
- ✅ Invalid email: 400 Bad Request or validation error

#### 2.2 Authentication Callback
**Manual Steps**:
1. If email service is configured, check email for magic link
2. Click the magic link (should redirect to `/auth/callback`)
3. Verify redirect to `/app` after successful authentication
4. Check that user session is established

**Expected Results**:
- ✅ Magic link redirects correctly
- ✅ User is authenticated and redirected to app
- ✅ Browser session cookies are set

### Test 3: Upload API Validation

**Purpose**: Test file upload endpoint validation and security.

**Endpoint**: `POST /api/upload`

#### 3.1 Unauthenticated Requests
```bash
# Test: Upload without authentication
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "test.jpg",
    "contentType": "image/jpeg",
    "size": 1048576
  }'
```

**Expected Results**:
- ✅ 401 Unauthorized error
- ✅ Clear error message about authentication required

#### 3.2 Input Validation Tests
```bash
# Test: Missing required fields
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d '{}'

# Test: File too large (>10MB)
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "large.jpg",
    "contentType": "image/jpeg",
    "size": 11534336
  }'

# Test: Unsupported file type
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "document.pdf",
    "contentType": "application/pdf",
    "size": 1048576
  }'
```

**Expected Results**:
- ✅ Missing fields: 400 Bad Request
- ✅ File too large: 400 Bad Request with size limit message
- ✅ Unsupported type: 400 Bad Request with supported types list

#### 3.3 Authenticated Upload Test
**Manual Steps**:
1. First, authenticate using magic link (Test 2)
2. Extract session cookies from browser
3. Make upload request with session cookies

**Browser Test**:
1. Open browser developer tools (Network tab)
2. Navigate to authenticated page
3. Use JavaScript console to test API:

```javascript
// Test authenticated upload
fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    filename: 'test-image.jpg',
    contentType: 'image/jpeg',
    size: 1048576
  })
}).then(r => r.json()).then(console.log);
```

**Expected Results**:
- ✅ 200 OK with upload URL and asset ID
- ✅ Response includes `uploadUrl`, `assetId`, and `storagePath`
- ✅ Upload URL is a valid Supabase signed URL

### Test 4: Job Management API

**Purpose**: Test job creation and status endpoints.

**Endpoint**: `POST /api/jobs`

#### 4.1 Unauthenticated Job Creation
```bash
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "test-asset-id",
    "complexity": "standard",
    "lineThickness": "medium"
  }'
```

**Expected Results**:
- ✅ 401 Unauthorized error

#### 4.2 Invalid Parameter Validation
```bash
# Test: Invalid complexity
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "test-asset-id",
    "complexity": "invalid",
    "lineThickness": "medium"
  }'

# Test: Missing required fields
curl -X POST http://localhost:3000/api/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "assetId": "test-asset-id"
  }'
```

**Expected Results**:
- ✅ 400 Bad Request with validation error messages
- ✅ Clear indication of valid parameter values

#### 4.3 Job Status Check
**Endpoint**: `GET /api/jobs/[id]`

```bash
# Test: Job status without authentication
curl http://localhost:3000/api/jobs/nonexistent-job-id
```

**Expected Results**:
- ✅ 401 Unauthorized error

### Test 5: Credits API

**Purpose**: Test credit balance and transaction history.

**Endpoint**: `GET /api/credits`

#### 5.1 Unauthenticated Request
```bash
curl http://localhost:3000/api/credits
```

**Expected Results**:
- ✅ 401 Unauthorized error

#### 5.2 Authenticated Credits Check
**Browser Test** (after authentication):
```javascript
fetch('/api/credits')
  .then(r => r.json())
  .then(console.log);
```

**Expected Results**:
- ✅ 200 OK with credit balance (should be 3 for new users)
- ✅ Response includes `balance`, `updated_at`, and `recent_events`
- ✅ Initial signup bonus event should be present

### Test 6: User Profile API

**Purpose**: Test user profile data retrieval.

**Endpoint**: `GET /api/user/profile`

#### 6.1 Unauthenticated Request
```bash
curl http://localhost:3000/api/user/profile
```

**Expected Results**:
- ✅ 401 Unauthorized error

#### 6.2 Authenticated Profile Check
**Browser Test** (after authentication):
```javascript
fetch('/api/user/profile')
  .then(r => r.json())
  .then(console.log);
```

**Expected Results**:
- ✅ 200 OK with user profile data
- ✅ Response includes user `id`, `email`, `created_at`, `credits`, and `stats`
- ✅ Statistics show correct job counts (should be 0 for new users)

### Test 7: Rate Limiting

**Purpose**: Verify rate limiting is working correctly.

#### 7.1 Rate Limit Testing
**Manual Steps**:
1. Make multiple rapid requests to the upload endpoint
2. Monitor response headers for rate limiting information
3. Exceed the rate limit (10 requests/hour for uploads)
4. Verify rate limit error response

**Browser Test**:
```javascript
// Make multiple upload requests rapidly
for (let i = 0; i < 12; i++) {
  fetch('/api/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: `test-${i}.jpg`,
      contentType: 'image/jpeg',
      size: 1048576
    })
  }).then(r => {
    console.log(`Request ${i}: ${r.status}`);
    return r.json();
  }).then(console.log);
}
```

**Expected Results**:
- ✅ First 10 requests succeed (or return 401 if not authenticated)
- ✅ Subsequent requests return 429 Too Many Requests
- ✅ Rate limit headers present: `X-RateLimit-Remaining`, `X-RateLimit-Reset`

### Test 8: Database Integration

**Purpose**: Verify database operations are working correctly.

#### 8.1 User Creation Test
**Manual Steps**:
1. Complete authentication flow (Test 2)
2. Check Supabase dashboard for new user record
3. Verify credit balance initialized to 3
4. Check credit_events table for signup bonus

**Expected Results**:
- ✅ User record created in `users` table
- ✅ Credits record created with balance = 3
- ✅ Credit event recorded with reason = 'signup_bonus'

#### 8.2 Row Level Security Test
**Manual Steps**:
1. Authenticate as user A
2. Note the user ID from profile response
3. Try to access another user's data (if available)

**Expected Results**:
- ✅ Users can only see their own data
- ✅ Attempts to access other user data return empty results or errors

### Test 9: Storage Integration

**Purpose**: Test Supabase Storage integration.

#### 9.1 Storage Bucket Test
**Manual Steps**:
1. Complete upload flow (Test 3.3)
2. Check Supabase Storage dashboard
3. Verify file appears in correct bucket (`originals`)
4. Check folder structure follows `userId/assetId.ext` pattern

**Expected Results**:
- ✅ File appears in Supabase Storage
- ✅ File stored in correct user folder
- ✅ Asset record created in database

#### 9.2 Signed URL Test
**Manual Steps**:
1. Get upload URL from upload API response
2. Attempt to upload a file to the signed URL
3. Verify upload succeeds

**Expected Results**:
- ✅ Signed URL accepts file upload
- ✅ File appears in storage after upload

### Test 10: Error Handling

**Purpose**: Test comprehensive error handling.

#### 10.1 Malformed Requests
```bash
# Test: Invalid JSON
curl -X POST http://localhost:3000/api/upload \
  -H "Content-Type: application/json" \
  -d 'invalid json'

# Test: Missing Content-Type header
curl -X POST http://localhost:3000/api/upload \
  -d '{"test": "data"}'
```

**Expected Results**:
- ✅ 400 Bad Request for malformed JSON
- ✅ Appropriate error messages
- ✅ No server crashes or unhandled errors

## Automated Testing

### Quick Test Script

Run the automated test script:
```bash
cd apps/web
node test-api-endpoints.js
```

**Expected Results**:
- ✅ All basic validation tests pass
- ✅ Authentication endpoints respond correctly
- ✅ Error handling works as expected

## Troubleshooting

### Common Issues

1. **401 Errors on All Endpoints**
   - Check Supabase configuration in `.env.local`
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY are correct
   - Check Supabase project is active

2. **500 Errors**
   - Check application logs in terminal
   - Verify database migrations have been applied
   - Check Supabase service status

3. **Rate Limiting Not Working**
   - Check `rate_limits` table exists in database
   - Verify rate limiting migration was applied
   - Check for console errors in application

4. **Magic Link Not Sending**
   - Verify Supabase Auth configuration
   - Check email template settings in Supabase dashboard
   - Ensure SMTP configuration is correct (if using custom SMTP)

### Success Criteria

After completing all tests:
- ✅ All authentication flows work correctly
- ✅ All API endpoints respond with appropriate status codes
- ✅ Input validation prevents invalid requests
- ✅ Rate limiting protects against abuse
- ✅ Database integration stores and retrieves data correctly
- ✅ Storage integration handles file uploads securely
- ✅ Error handling provides useful feedback

## Next Steps

Once manual testing is complete:
1. Run automated test suite to confirm results
2. Proceed with Phase 1 integration testing
3. Begin frontend development when designs are available

## Test Log Template

Use this template to record test results:

```
Date: ___________
Tester: ___________

Test Results:
[ ] Test 1: Health Check
[ ] Test 2: Magic Link Authentication
[ ] Test 3: Upload API Validation
[ ] Test 4: Job Management API
[ ] Test 5: Credits API
[ ] Test 6: User Profile API
[ ] Test 7: Rate Limiting
[ ] Test 8: Database Integration
[ ] Test 9: Storage Integration
[ ] Test 10: Error Handling

Issues Found:
_________________________________
_________________________________

Additional Notes:
_________________________________
_________________________________
```