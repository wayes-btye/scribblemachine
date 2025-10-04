# Scribble Machine Authentication Refactor - Implementation Plan
**Document Version:** 1.0
**Date:** 2025-01-04
**Status:** Planning Complete - Awaiting Implementation Approval
**Project:** ColoringPage Generator (Scribble Machine)

---

## Table of Contents
1. [Executive Summary](#executive-summary)
2. [Strategic Rationale](#strategic-rationale)
3. [Discounted Options](#discounted-options)
4. [Implementation Checklist](#implementation-checklist)
5. [Technical Implementation Details](#technical-implementation-details)
6. [Testing & Validation](#testing--validation)
7. [Activity Log](#activity-log)

---

## Executive Summary

This document outlines a two-pronged authentication strategy improvement:

1. **Authentication Method Change:** From magic link-only to **Password + OTP Email Verification**
2. **Authentication Timing Change:** From up-front auth wall to **Delayed Authentication (post-upload)**

**Combined Benefits:**
- ✅ Email verification prevents free-tier API abuse (fraud protection)
- ✅ Password signin enables fast returning user access (gallery feature)
- ✅ Delayed auth increases conversion (reduced drop-off at entry)
- ✅ Client-side state management eliminates pre-auth storage costs
- ✅ No multi-window UX issues (OTP in-page, password signin instant)

**Implementation Timeline:** 4-6 days
**Complexity:** Medium
**Risk Level:** Low (backwards compatible with dev bypass)

---

## Strategic Rationale

### Problem 1: Free-Tier API Abuse Risk

**Context:**
- Gemini API costs: ~$0.05 per generation
- Free tier: 3 pages per user
- Target: Parents (non-technical users)

**Threat Vectors:**
```
1. Gmail Alias Abuse:
   parent@gmail.com → 3 free pages
   parent+1@gmail.com → 3 free pages (same inbox)
   parent+999@gmail.com → 2,997 free pages
   = $149.85 in stolen API costs from ONE person

2. Disposable Emails:
   user1@tempmail.com → 3 pages
   user2@guerrillamail.com → 3 pages
   = Infinite free pages, no barrier

3. Bot Farms:
   Script creates 1000 accounts
   3000 pages × $0.05 = $150 stolen per run
```

**Solution Required:** Email verification to prove ownership

**Why Magic Link Fails:**
- ❌ Email verified but user experience poor for returning users
- ❌ Requires email round-trip every single signin (gallery access)
- ❌ Multiple browser windows (confusing for parents)
- ❌ Doesn't work offline (playground with bad signal)

**Why Password + OTP Wins:**
- ✅ **Signup:** Email verified via 6-digit OTP (proves ownership)
- ✅ **Returning:** Password signin (instant, works offline)
- ✅ **Browser autofill:** One-tap signin on mobile (Face ID/Touch ID)
- ✅ **"Stay signed in":** 30-day sessions = nearly passwordless
- ✅ **Industry standard:** Canva, Figma, Notion (all gallery apps use passwords)

---

### Problem 2: High Drop-Off at Auth Wall

**Context:**
- User journey: Home → "Create" button → **🚫 Auth Required**
- Gallery feature not yet visible to anonymous users
- Value proposition not yet demonstrated

**Psychological Barriers:**
```
User thinking: "Why am I signing up?"
- Haven't seen the interface yet
- Don't know if it's good quality
- Don't trust the brand yet
- Creating another account feels like work
→ High abandonment rate
```

**Industry Pattern: "Try Before Trust"**

Examples:
- **Canva:** Design for 5 minutes → Auth at export
- **Remove.bg:** Upload image → See preview → Auth to download
- **Figma:** Explore files → Auth to save/collaborate

**Solution: Delayed Authentication**

```
OLD FLOW (Auth Wall):
Home → Click "Create" → 🚫 Auth Required → Drop-off
                         ↑ 40-60% drop-off here

NEW FLOW (Delayed Auth):
Home → Click "Create" → Upload → Settings → "Generate" → 🚫 Auth Required
                                                          ↑ 15-25% drop-off
                                                          (User invested time)
```

**Why This Works (Psychology):**
1. **Commitment & Consistency:** User uploaded image = invested effort = more likely to complete
2. **Demonstrated Value:** User sees professional interface = trust increases
3. **Just-In-Time Friction:** Auth request comes when value is clear ("to generate THIS page")
4. **Foot-in-the-Door:** Small initial action (upload) makes larger ask (signup) easier

**Technical Implementation:**
- Store uploaded file + settings in **browser memory (React state)**
- No server costs until authenticated
- No fraud risk (nothing persisted)
- After auth: automatically upload → create job → generate

---

### Combined Strategy Benefits

| Aspect | Old System | New System |
|--------|-----------|------------|
| **Fraud Protection** | ❌ None (magic link can be disposable email) | ✅ OTP verifies email + multi-layer fraud stack |
| **Returning User UX** | ❌ Email every time | ✅ Password autofill (instant) |
| **Mobile Experience** | ❌ Email app juggling | ✅ One-tap autofill + Face ID |
| **Offline Access** | ❌ Requires email | ✅ Password works offline |
| **Conversion Rate** | ❌ Auth wall at entry | ✅ Delayed auth (try before trust) |
| **Multi-Window Issues** | ❌ Magic link = new browser context | ✅ OTP in same page, password instant |
| **Dev Bypass Compatibility** | ✅ Works | ✅ Works (no changes needed) |

---

## Discounted Options

### Option A: Magic Link Only (Original PRD)
**Why Discounted:**
- ❌ Poor UX for gallery feature (returning users need email every time)
- ❌ Multi-window browser juggling (especially mobile email apps)
- ❌ No offline access (parent at playground with bad signal)
- ❌ Slow for returning users vs password autofill

**When It Makes Sense:**
- One-time use apps (no returning users)
- B2B apps with desktop-first users
- Apps without saved content/galleries

---

### Option B: Password-Only (No Email Verification)
**Why Discounted:**
- ❌ **Critical:** No email verification = free-tier abuse paradise
- ❌ Fake emails work (`doesntexist@nowhere.com`)
- ❌ Infinite bot signups with zero barrier
- ❌ API cost disaster (could lose $1000+ in first week)

**Deal-Breaker:** Email verification is mandatory for fraud prevention.

---

### Option C: Password + Magic Link Hybrid (Both Equally Presented)
**Why Discounted:**
- ❌ Decision paralysis ("Which method should I use?")
- ❌ Confusing recovery flows:
  - "Forgot password" → Reset email
  - "Use magic link" → Magic link email
  - User receives 2 similar emails, confused which to click
- ❌ Support burden ("Do I have a password or not?")
- ❌ Users don't remember which method they used

**Best Practice:** One primary auth method, one fallback (not two equal options)

---

### Option D: OTP-Only (No Password for Returning Users)
**Why Discounted:**
- ❌ Email dependency every single signin (same problem as magic link)
- ❌ Poor UX for gallery users (need email to view saved pages)
- ❌ Doesn't work offline
- ❌ No browser autofill benefit

**Issue:** Solves signup UX but doesn't solve returning user UX

---

### Option E: Temp Upload Storage (Server-Side Pre-Auth Upload)
**Why Discounted:**
- ❌ Storage costs for abandoned uploads
- ❌ **Fraud vector:** Bots can spam 1000 file uploads
- ❌ Requires cleanup job (delete temp files every 15 min)
- ❌ Requires rate limiting + CAPTCHA on upload endpoint
- ❌ More complex code (move files after auth, error handling)
- ❌ Security risk if temp bucket misconfigured

**Alternative:** Client-side state (file in browser memory) = zero costs, zero fraud risk

---

## Implementation Checklist

### Prerequisites
- [ ] Read and approve this implementation plan
- [ ] Backup current authentication code (create git branch)
- [ ] Notify team of upcoming auth changes
- [ ] Prepare test user accounts for validation

---

### Phase 1: Manual Configuration (User Tasks - Cannot be Automated)

**Estimated Time:** 30-45 minutes

#### Task 1.1: Supabase Email Template Configuration
**Location:** Supabase Dashboard → Authentication → Email Templates

- [ ] Navigate to: https://supabase.com/dashboard/project/htxsylxwvcbrazdowjys/auth/templates
- [ ] Select "Magic Link" template
- [ ] Replace template content with:
  ```html
  <h2>Your Scribble Machine Verification Code</h2>

  <p>Hello!</p>

  <p>Enter this code to verify your email address:</p>

  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
    <p style="font-size: 36px; font-weight: bold; letter-spacing: 8px; margin: 0; color: #1f2937;">
      {{ .Token }}
    </p>
  </div>

  <p>This code expires in 5 minutes.</p>

  <p>If you didn't request this code, you can safely ignore this email.</p>

  <p>Thanks,<br>The Scribble Machine Team</p>
  ```
- [ ] Click "Save"

#### Task 1.2: Configure OTP Settings
**Location:** Supabase Dashboard → Authentication → Settings

- [ ] Navigate to: https://supabase.com/dashboard/project/htxsylxwvcbrazdowjys/auth/settings
- [ ] Scroll to "Email Auth" section
- [ ] Set "OTP expiration time": **300 seconds (5 minutes)**
  - Default 60s is too short, causes user frustration
- [ ] Set "OTP rate limit": **60 seconds between requests**
  - Prevents abuse while allowing reasonable resends
- [ ] Click "Save"

#### Task 1.3: Verify SMTP Configuration
**Location:** Supabase Dashboard → Project Settings → Auth

- [ ] Navigate to: https://supabase.com/dashboard/project/htxsylxwvcbrazdowjys/settings/auth
- [ ] Check "SMTP Settings"
- [ ] If using Supabase default: ✅ No action needed
- [ ] If using custom SMTP: Verify settings are correct
- [ ] Send test email to confirm delivery

#### Task 1.4: Configure Session Settings
**Location:** Supabase Dashboard → Authentication → Settings

- [ ] Navigate to: https://supabase.com/dashboard/project/htxsylxwvcbrazdowjys/auth/settings
- [ ] Set "JWT expiry": **2592000 seconds (30 days)** for "Stay signed in" feature
- [ ] Set "Refresh token expiry": **2592000 seconds (30 days)**
- [ ] Click "Save"

#### Task 1.5: Setup Google reCAPTCHA v3
**Location:** External (Google)

- [ ] Visit: https://www.google.com/recaptcha/admin
- [ ] Click "Create" (+ icon)
- [ ] Label: "Scribble Machine"
- [ ] Type: **reCAPTCHA v3**
- [ ] Domains:
  - `localhost` (for local dev)
  - `scribblemachineweb.vercel.app` (production)
  - `*.vercel.app` (for preview deployments)
- [ ] Click "Submit"
- [ ] Copy **Site Key** → Save for Task 2.1
- [ ] Copy **Secret Key** → Save for Task 2.1
- [ ] Keep admin panel open for testing later

#### Task 1.6: Add Environment Variables
**Location:** Vercel Dashboard + Local

**Vercel:**
- [ ] Navigate to: https://vercel.com/your-team/scribblemachine/settings/environment-variables
- [ ] Add variables:
  ```
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<site_key_from_1.5>
  RECAPTCHA_SECRET_KEY=<secret_key_from_1.5>
  ```
- [ ] Apply to: Production, Preview, Development
- [ ] Click "Save"

**Local (.env.local):**
- [ ] Add to `apps/web/.env.local`:
  ```
  NEXT_PUBLIC_RECAPTCHA_SITE_KEY=<site_key_from_1.5>
  RECAPTCHA_SECRET_KEY=<secret_key_from_1.5>
  ```

#### Task 1.7: Verify Dev Bypass User Exists
**Location:** Supabase Dashboard → Authentication → Users

- [ ] Navigate to: https://supabase.com/dashboard/project/htxsylxwvcbrazdowjys/auth/users
- [ ] Search for: `wayes.appsmate@gmail.com`
- [ ] Verify:
  - ✅ User exists
  - ✅ Email confirmed (green checkmark)
  - ✅ Password set (can signin with password)
- [ ] If not exists or not confirmed:
  - Click "Add User" → Create manually
  - Email: `wayes.appsmate@gmail.com`
  - Password: `Test_123!`
  - Check "Auto Confirm Email"
  - Click "Create User"

---

### Phase 2: Database Schema (Automated via Supabase MCP)

**Estimated Time:** 10 minutes

#### Task 2.1: Create Rate Limiting Table
**Tool:** Supabase MCP → `execute_sql`

```sql
-- Create rate limits table for IP-based fraud prevention
create table if not exists public.rate_limits (
  id uuid primary key default gen_random_uuid(),
  ip_address inet not null,
  action text not null check (action in ('signup', 'generation')),
  created_at timestamp with time zone default now(),

  -- Unique constraint: one record per IP per action per day
  constraint unique_ip_action_date unique (ip_address, action, (created_at::date))
);

-- Index for fast lookups
create index if not exists idx_rate_limits_lookup
  on public.rate_limits(ip_address, action, created_at);

-- Enable RLS
alter table public.rate_limits enable row level security;

-- Service role only (no public access)
create policy "Service role can manage rate limits"
  on public.rate_limits
  for all
  using (auth.role() = 'service_role');

-- Auto-cleanup: delete records older than 7 days
create or replace function cleanup_old_rate_limits()
returns void as $$
begin
  delete from public.rate_limits
  where created_at < now() - interval '7 days';
end;
$$ language plpgsql security definer;

-- Schedule cleanup (optional - can run via cron)
comment on function cleanup_old_rate_limits is
  'Cleanup old rate limit records. Run daily via cron or Supabase scheduled functions.';
```

**Checklist:**
- [ ] Execute SQL via Supabase MCP
- [ ] Verify table created: Check dashboard → Database → Tables
- [ ] Verify indexes created
- [ ] Verify RLS enabled

#### Task 2.2: Add User Metadata Columns (Optional - for device fingerprinting)
**Tool:** Supabase MCP → `execute_sql`

```sql
-- Add device fingerprint tracking (Phase 2 fraud prevention)
alter table auth.users
  add column if not exists device_fingerprint text;

-- Create device tracking table
create table if not exists public.device_limits (
  fingerprint text primary key,
  account_count int default 1,
  last_seen timestamp with time zone default now(),
  flagged boolean default false,
  notes text
);

-- Enable RLS
alter table public.device_limits enable row level security;

-- Service role only
create policy "Service role can manage device limits"
  on public.device_limits
  for all
  using (auth.role() = 'service_role');

-- Index for fast lookups
create index if not exists idx_device_fingerprint
  on auth.users(device_fingerprint)
  where device_fingerprint is not null;
```

**Checklist:**
- [ ] Execute SQL via Supabase MCP
- [ ] Verify columns added
- [ ] Verify table created

---

### Phase 3: Frontend Components (Automated - Code Implementation)

**Estimated Time:** 4-6 hours

#### Task 3.1: Install Dependencies
**Tool:** Bash

```bash
cd apps/web
npm install react-google-recaptcha-v3 disposable-email-domains @fingerprintjs/fingerprintjs
```

**Checklist:**
- [ ] Execute npm install
- [ ] Verify packages in package.json
- [ ] Test import in a component (no errors)

#### Task 3.2: Create Signup Form Component
**File:** `apps/web/components/auth/signup-form.tsx`

**Features:**
- Email input with validation
- Password input with strength indicator
- OTP verification step (conditional render)
- CAPTCHA integration (invisible)
- Error handling
- Loading states

**Checklist:**
- [ ] Create file
- [ ] Implement email + password form
- [ ] Add password validation (min 8 chars)
- [ ] Add OTP verification UI (6-digit input)
- [ ] Integrate reCAPTCHA
- [ ] Add "Resend code" button (60s cooldown)
- [ ] Test component in isolation

#### Task 3.3: Create Password Signin Form Component
**File:** `apps/web/components/auth/signin-form.tsx`

**Features:**
- Email + password inputs
- "Stay signed in" checkbox (30-day session)
- "Forgot password?" link
- Browser autofill compatibility
- Keep dev bypass button (existing code)

**Checklist:**
- [ ] Rename `magic-link-form.tsx` to `signin-form.tsx`
- [ ] Replace magic link logic with password signin
- [ ] Add "Stay signed in" checkbox
- [ ] Keep dev bypass button (no changes)
- [ ] Add "Forgot password?" link
- [ ] Test autofill works on mobile browsers

#### Task 3.4: Create Forgot Password Flow
**Files:**
- `apps/web/components/auth/forgot-password-form.tsx`
- `apps/web/app/auth/reset-password/page.tsx`

**Features:**
- Email input → Send reset link
- Reset page with new password input
- Success confirmation
- Link back to signin

**Checklist:**
- [ ] Create forgot password form component
- [ ] Create reset password page
- [ ] Add password strength validation
- [ ] Add success/error states
- [ ] Test email delivery
- [ ] Test reset flow end-to-end

#### Task 3.5: Create Auth Dialog Component
**File:** `apps/web/components/auth/auth-dialog.tsx`

**Features:**
- Modal/dialog wrapper
- Tabs: "Sign Up" / "Sign In"
- Contextual messaging (accepts `contextMessage` prop)
- Value proposition bullets
- Close handler

**Checklist:**
- [ ] Create dialog component
- [ ] Add tabs for signup/signin
- [ ] Add contextual header (dynamic message)
- [ ] Add value proposition section
- [ ] Handle close events
- [ ] Test on mobile (responsive)

#### Task 3.6: Update Upload Interface (Delayed Auth)
**File:** `apps/web/components/upload/upload-interface.tsx` (or create page)

**Key Changes:**
- Remove auth wall at page load
- Store file in React state (not upload to Supabase yet)
- Store settings in React state
- On "Generate" click → Check auth → Show dialog if needed
- After auth success → Upload file + create job + call API

**Checklist:**
- [ ] Remove authentication check at page load
- [ ] Add `useState` for uploaded file (File object)
- [ ] Add `useState` for settings (complexity, line thickness)
- [ ] Add `useState` for auth dialog open/close
- [ ] Implement `handleGenerate` function:
  - [ ] Check if user authenticated
  - [ ] If not → Open auth dialog
  - [ ] If yes → Call `processGeneration`
- [ ] Implement `processGeneration` function:
  - [ ] Upload file to Supabase Storage
  - [ ] Create job in database
  - [ ] Call `/api/generate` endpoint
  - [ ] Redirect to gallery/results
- [ ] Add auth success callback → Continue generation
- [ ] Test file stays in memory during auth
- [ ] Test page refresh clears state (expected)

#### Task 3.7: Update Create Page
**File:** `apps/web/app/create/page.tsx`

**Changes:**
- Remove auth wall wrapper
- Allow anonymous access
- Render upload interface directly

**Checklist:**
- [ ] Remove `useAuth()` check that blocks page
- [ ] Allow page to render for unauthenticated users
- [ ] Test: Anonymous users can access /create
- [ ] Test: Authenticated users still work as before

---

### Phase 4: Auth Provider & API Routes (Automated - Code Implementation)

**Estimated Time:** 3-4 hours

#### Task 4.1: Update Auth Provider
**File:** `apps/web/lib/auth/auth-provider.tsx`

**New Methods:**
- `signUp(email, password)` → Triggers OTP email
- `verifyOTP(email, token)` → Verifies code + creates session
- `signInWithPassword(email, password)` → Direct signin (existing)
- `resetPasswordRequest(email)` → Sends reset email
- `resetPassword(newPassword)` → Updates password
- Keep `devBypassAuth()` unchanged

**Checklist:**
- [ ] Add `signUp` method
- [ ] Add `verifyOTP` method
- [ ] Verify `signInWithPassword` exists and works
- [ ] Add `resetPasswordRequest` method
- [ ] Add `resetPassword` method
- [ ] Keep dev bypass unchanged
- [ ] Update TypeScript types
- [ ] Export new methods from context

#### Task 4.2: Create Signup API Route
**File:** `apps/web/app/api/auth/signup/route.ts`

**Features:**
- Validate email format
- Validate password strength (min 8 chars)
- Check disposable email domain (block)
- Verify CAPTCHA token
- Check IP rate limit (max 3 signups/day)
- Call Supabase `auth.signUp()`
- Log signup event for analytics

**Checklist:**
- [ ] Create API route file
- [ ] Add email validation
- [ ] Add password validation
- [ ] Integrate disposable email checker
- [ ] Verify CAPTCHA token with Google API
- [ ] Check rate limit table (via Supabase client)
- [ ] Insert rate limit record on success
- [ ] Call `supabase.auth.signUp()`
- [ ] Handle errors gracefully
- [ ] Test with valid/invalid inputs

#### Task 4.3: Create OTP Verification API Route
**File:** `apps/web/app/api/auth/verify-otp/route.ts`

**Features:**
- Receive email + 6-digit token
- Call Supabase `auth.verifyOtp()`
- Create session on success
- Handle invalid/expired codes

**Checklist:**
- [ ] Create API route file
- [ ] Validate input (email + token)
- [ ] Call `supabase.auth.verifyOtp({ email, token, type: 'signup' })`
- [ ] Return session on success
- [ ] Handle errors (invalid code, expired, etc.)
- [ ] Test with valid/invalid codes

#### Task 4.4: Update/Create Signin API Route
**File:** `apps/web/app/api/auth/signin/route.ts`

**Features:**
- Receive email + password
- Call Supabase `auth.signInWithPassword()`
- Support "remember me" option (session duration)
- Return session on success

**Checklist:**
- [ ] Create or update route
- [ ] Call `supabase.auth.signInWithPassword()`
- [ ] Handle session duration based on "stay signed in"
- [ ] Return session data
- [ ] Handle errors (wrong password, user not found)
- [ ] Test signin flow

#### Task 4.5: Create Password Reset Request Route
**File:** `apps/web/app/api/auth/reset-password-request/route.ts`

**Features:**
- Receive email
- Call Supabase `auth.resetPasswordForEmail()`
- Set redirect URL to reset page

**Checklist:**
- [ ] Create API route
- [ ] Validate email format
- [ ] Call `supabase.auth.resetPasswordForEmail()`
- [ ] Set `redirectTo` option
- [ ] Return success message
- [ ] Test email delivery

#### Task 4.6: Update Auth Callback Route
**File:** `apps/web/app/auth/callback/route.ts`

**Changes:**
- Handle password reset token exchange
- Handle email verification callback
- Keep existing magic link callback (backwards compat)

**Checklist:**
- [ ] Add password reset token handling
- [ ] Keep existing code exchange logic
- [ ] Add redirect to intended destination (not just home)
- [ ] Test password reset callback
- [ ] Test email verification callback

---

### Phase 5: Fraud Prevention Layer (Automated - Code Implementation)

**Estimated Time:** 2-3 hours

#### Task 5.1: Implement CAPTCHA Verification
**File:** `apps/web/app/api/auth/signup/route.ts` (already created in Task 4.2)

**Logic:**
```typescript
// Verify CAPTCHA token with Google
const response = await fetch(
  `https://www.google.com/recaptcha/api/siteverify`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${RECAPTCHA_SECRET_KEY}&response=${captchaToken}`
  }
)

const data = await response.json()

if (!data.success || data.score < 0.5) {
  return NextResponse.json(
    { error: 'CAPTCHA verification failed' },
    { status: 400 }
  )
}
```

**Checklist:**
- [ ] Add CAPTCHA verification before signup
- [ ] Set score threshold: 0.5
- [ ] Log failed attempts
- [ ] Test with valid/invalid tokens
- [ ] Test with low score (bot behavior)

#### Task 5.2: Implement IP Rate Limiting
**File:** `apps/web/app/api/auth/signup/route.ts`

**Logic:**
```typescript
// Get user IP from request
const ip = request.headers.get('x-forwarded-for') ||
           request.headers.get('x-real-ip') ||
           'unknown'

// Check today's signup count
const { count } = await supabase
  .from('rate_limits')
  .select('*', { count: 'exact', head: true })
  .eq('ip_address', ip)
  .eq('action', 'signup')
  .gte('created_at', new Date().toISOString().split('T')[0]) // Today

if (count >= 3) {
  return NextResponse.json(
    { error: 'Too many signups from this IP. Try again tomorrow.' },
    { status: 429 }
  )
}

// After successful signup: Insert rate limit record
await supabase.from('rate_limits').insert({
  ip_address: ip,
  action: 'signup'
})
```

**Checklist:**
- [ ] Extract IP from request headers
- [ ] Check rate_limits table for IP + date
- [ ] Reject if count >= 3
- [ ] Insert record on successful signup
- [ ] Test: 3 signups succeed, 4th fails
- [ ] Test: New day resets counter

#### Task 5.3: Implement Disposable Email Blocking
**File:** `apps/web/app/api/auth/signup/route.ts`

**Logic:**
```typescript
import disposableDomains from 'disposable-email-domains'

const emailDomain = email.split('@')[1].toLowerCase()

if (disposableDomains.includes(emailDomain)) {
  return NextResponse.json(
    { error: 'Please use a permanent email address.' },
    { status: 400 }
  )
}
```

**Checklist:**
- [ ] Import disposable email domains list
- [ ] Extract domain from email
- [ ] Check if domain in blocklist
- [ ] Reject signup if match
- [ ] Test with tempmail.com, guerrillamail.com
- [ ] Test with valid domains (gmail.com, etc.)

#### Task 5.4: Implement Device Fingerprinting (Optional - Phase 2)
**Files:**
- `apps/web/components/auth/signup-form.tsx`
- `apps/web/app/api/auth/signup/route.ts`

**Logic:**
```typescript
// Client-side (signup form)
import FingerprintJS from '@fingerprintjs/fingerprintjs'

const fp = await FingerprintJS.load()
const result = await fp.get()
const fingerprint = result.visitorId

// Send with signup request
await fetch('/api/auth/signup', {
  body: JSON.stringify({ email, password, fingerprint })
})

// Server-side (API route)
const { data: deviceData } = await supabase
  .from('device_limits')
  .select('account_count')
  .eq('fingerprint', fingerprint)
  .single()

if (deviceData && deviceData.account_count >= 5) {
  // Flag for review or block
  console.warn(`Suspicious: ${fingerprint} has ${deviceData.account_count} accounts`)
}

// Update count
await supabase.from('device_limits').upsert({
  fingerprint,
  account_count: (deviceData?.account_count || 0) + 1
})
```

**Checklist:**
- [ ] Generate fingerprint on client
- [ ] Send fingerprint with signup
- [ ] Check device_limits table on server
- [ ] Log suspicious patterns (>5 accounts)
- [ ] Increment count on successful signup
- [ ] Test: Multiple signups from same device flagged

#### Task 5.5: Add Generation Rate Limiting
**File:** `apps/web/app/api/generate/route.ts`

**Logic:**
```typescript
const ip = request.headers.get('x-forwarded-for') || 'unknown'

const { count } = await supabase
  .from('rate_limits')
  .select('*', { count: 'exact', head: true })
  .eq('ip_address', ip)
  .eq('action', 'generation')
  .gte('created_at', new Date().toISOString().split('T')[0])

if (count >= 10) {
  return NextResponse.json(
    { error: 'Daily generation limit reached.' },
    { status: 429 }
  )
}

// After successful generation
await supabase.from('rate_limits').insert({
  ip_address: ip,
  action: 'generation'
})
```

**Checklist:**
- [ ] Add IP rate limit check to generate endpoint
- [ ] Limit: 10 generations per IP per day
- [ ] Insert record after successful generation
- [ ] Test limit enforcement

---

### Phase 6: UI/UX Polish (Automated - Code Implementation)

**Estimated Time:** 2-3 hours

#### Task 6.1: Update Header Navigation
**File:** `apps/web/components/layout/header.tsx`

**Changes:**
- "Sign In" button → Opens signin dialog
- "Sign Up" button → Opens signup dialog
- Show user avatar/initials when authenticated
- Dropdown menu: Gallery, Settings, Sign Out

**Checklist:**
- [ ] Add "Sign In" / "Sign Up" buttons for unauthenticated
- [ ] Open auth dialog on click (not redirect)
- [ ] Show user info when authenticated
- [ ] Test on desktop and mobile

#### Task 6.2: Update Authenticated Link Component
**File:** `apps/web/components/auth/authenticated-link.tsx`

**Changes:**
- Use new auth dialog (not magic link form)
- Show signup or signin based on context

**Checklist:**
- [ ] Replace magic link form with auth dialog
- [ ] Pass contextual message to dialog
- [ ] Test: Clicking protected link shows auth
- [ ] Test: After auth, navigates to intended destination

#### Task 6.3: Add Auth Success Redirects
**Files:** Multiple auth components

**Logic:**
- After signup → Redirect to /create or original intent
- After signin → Redirect to /gallery or original intent
- After password reset → Redirect to /gallery
- Store intended destination before auth

**Checklist:**
- [ ] Add redirect logic after auth success
- [ ] Store `returnUrl` in localStorage or state
- [ ] Clear `returnUrl` after redirect
- [ ] Test: Click gallery → Auth → Returns to gallery
- [ ] Test: Click create → Auth → Returns to create

#### Task 6.4: Improve Error Messages
**Files:** All auth components and API routes

**Examples:**
- "Email already registered" → "Already have an account? Sign in instead"
- "Invalid code" → "That code didn't work. Check your email or request a new one."
- "Password too weak" → "Password must be at least 8 characters"

**Checklist:**
- [ ] Update all error messages to be user-friendly
- [ ] Add helpful suggestions in errors
- [ ] Remove technical jargon
- [ ] Test error scenarios

#### Task 6.5: Add Loading States
**Files:** All auth components

**Elements:**
- Button loading spinners
- Disabled inputs during submission
- Progress indicators for multi-step flows

**Checklist:**
- [ ] Add loading state to "Sign Up" button
- [ ] Add loading state to "Send Code" button
- [ ] Add loading state to "Verify" button
- [ ] Disable form during submission
- [ ] Test: No double-submission possible

---

## Testing & Validation

### Pre-Deployment Testing

**Local Development:**
- [ ] **Task T1:** Test signup flow (email → password → OTP → verified)
- [ ] **Task T2:** Test OTP code entry (valid, invalid, expired)
- [ ] **Task T3:** Test OTP resend (works, rate limited after 60s)
- [ ] **Task T4:** Test signin flow (password autofill works)
- [ ] **Task T5:** Test "Stay signed in" (30-day session persists)
- [ ] **Task T6:** Test forgot password (email → reset → new password)
- [ ] **Task T7:** Test delayed auth (upload → generate → auth appears)
- [ ] **Task T8:** Test state preservation during auth (file stays in memory)
- [ ] **Task T9:** Test dev bypass (still works, no conflicts)
- [ ] **Task T10:** Test CAPTCHA (invisible, works)
- [ ] **Task T11:** Test IP rate limit (3 signups max, 4th blocked)
- [ ] **Task T12:** Test disposable email block (tempmail.com rejected)
- [ ] **Task T13:** Test generation rate limit (10 per day, 11th blocked)

**Mobile Testing (Critical):**
- [ ] **Task T14:** iOS Safari - Password autofill works
- [ ] **Task T15:** iOS Safari - Face ID autofill works
- [ ] **Task T16:** iOS Safari - OTP copy from notification works
- [ ] **Task T17:** Android Chrome - Password autofill works
- [ ] **Task T18:** Android Chrome - Fingerprint autofill works
- [ ] **Task T19:** Mobile - Auth dialog responsive, no scroll issues
- [ ] **Task T20:** Mobile - Upload interface works (no auth wall)

**Edge Cases:**
- [ ] **Task T21:** Page refresh during signup (state lost, acceptable)
- [ ] **Task T22:** Email already exists (shows "sign in instead")
- [ ] **Task T23:** Wrong password (clear error message)
- [ ] **Task T24:** Network error during auth (shows retry option)
- [ ] **Task T25:** Large file upload (10MB, stays in memory)

**Fraud Prevention:**
- [ ] **Task T26:** CAPTCHA blocks low score (bot-like behavior)
- [ ] **Task T27:** IP limit enforced (localhost blocked after 3)
- [ ] **Task T28:** Disposable email blocked (see specific error)
- [ ] **Task T29:** Device fingerprint tracked (check database)
- [ ] **Task T30:** Rate limits reset daily (test next day)

**Backwards Compatibility:**
- [ ] **Task T31:** Existing users can still sign in (if any exist)
- [ ] **Task T32:** Dev bypass unchanged (works in dev/preview)
- [ ] **Task T33:** No breaking changes to database schema

### Post-Deployment Validation

**Week 1 Metrics:**
- [ ] Monitor signup completion rate (target: >60%)
- [ ] Monitor OTP verification rate (target: >90%)
- [ ] Monitor CAPTCHA blocks (expect some bot attempts)
- [ ] Monitor IP rate limit hits (should be low, <5/day)
- [ ] Monitor disposable email blocks (track common domains)
- [ ] Monitor "Forgot password" usage (should be <5% of signins)
- [ ] Check error logs for unexpected issues
- [ ] Review user feedback/support tickets

**Performance:**
- [ ] Signup flow completes in <10 seconds (email → OTP → verified)
- [ ] Signin flow completes in <3 seconds (autofill)
- [ ] OTP email arrives in <30 seconds
- [ ] Password reset email arrives in <30 seconds

---

## Technical Implementation Details

### Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                   USER JOURNEY                       │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Home Page (Anonymous)        │
         │  - No auth required           │
         │  - "Create" button visible    │
         └───────────────────────────────┘
                         │
                         │ Click "Create"
                         ▼
         ┌───────────────────────────────┐
         │  Create Page (Anonymous OK)   │
         │  - Upload interface visible   │
         │  - No auth wall               │
         └───────────────────────────────┘
                         │
                         │ Upload file
                         ▼
         ┌───────────────────────────────┐
         │  React State (Client-Side)    │
         │  - File: Blob in memory       │
         │  - Settings: Object in state  │
         │  - No server upload yet       │
         └───────────────────────────────┘
                         │
                         │ Click "Generate"
                         ▼
         ┌───────────────────────────────┐
         │  Auth Check (Client)          │
         │  - supabase.auth.getUser()    │
         └───────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
      Not Auth'd                   Auth'd
           │                           │
           ▼                           ▼
   ┌───────────────┐         ┌──────────────────┐
   │  Auth Dialog  │         │  Upload to       │
   │  Opens        │         │  Supabase        │
   │  (In-page)    │         │  Storage         │
   └───────────────┘         └──────────────────┘
           │                           │
           │ Signup/Signin             │
           ▼                           │
   ┌───────────────┐                  │
   │  New User:    │                  │
   │  1. Email +   │                  │
   │     Password  │                  │
   │  2. CAPTCHA   │                  │
   │  3. OTP sent  │                  │
   │  4. Enter     │                  │
   │     code      │                  │
   │  5. Verified  │                  │
   └───────────────┘                  │
           │                           │
           │ Auth Success              │
           ▼                           ▼
   ┌─────────────────────────────────────┐
   │  Upload File to Supabase Storage    │
   │  - User authenticated               │
   │  - File moved from memory to DB     │
   └─────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Create Job in Database       │
         │  - Job status: queued         │
         │  - Credits checked            │
         └───────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Call /api/generate           │
         │  - Triggers Gemini API        │
         │  - Worker processes job       │
         └───────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Redirect to Gallery/Results  │
         │  - Show generated page        │
         │  - Download PDF               │
         └───────────────────────────────┘
```

### Fraud Prevention Flow

```
┌─────────────────────────────────────────────────────┐
│              SIGNUP REQUEST                          │
│  Email: user@example.com                            │
│  Password: ********                                 │
│  CAPTCHA Token: <token>                             │
│  IP: 192.168.1.1                                    │
│  Fingerprint: <hash>                                │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Layer 1: Input Validation    │
         │  - Email format valid?        │
         │  - Password >= 8 chars?       │
         └───────────────────────────────┘
                         │
                         ▼ Pass
         ┌───────────────────────────────┐
         │  Layer 2: Disposable Email    │
         │  - Check domain blocklist     │
         │  - tempmail.com? → BLOCK      │
         └───────────────────────────────┘
                         │
                         ▼ Pass
         ┌───────────────────────────────┐
         │  Layer 3: CAPTCHA             │
         │  - Verify token with Google   │
         │  - Score >= 0.5? → Pass       │
         │  - Score < 0.5? → BLOCK       │
         └───────────────────────────────┘
                         │
                         ▼ Pass
         ┌───────────────────────────────┐
         │  Layer 4: IP Rate Limit       │
         │  - Query rate_limits table    │
         │  - Count signups today        │
         │  - < 3? → Pass                │
         │  - >= 3? → BLOCK (429)        │
         └───────────────────────────────┘
                         │
                         ▼ Pass
         ┌───────────────────────────────┐
         │  Layer 5: Device Fingerprint  │
         │  - Query device_limits table  │
         │  - Account count < 5? → Pass  │
         │  - >= 5? → Flag/Log           │
         └───────────────────────────────┘
                         │
                         ▼ All Passed
         ┌───────────────────────────────┐
         │  Create User in Supabase      │
         │  - auth.signUp()              │
         │  - Send OTP email             │
         │  - Email confirmed: false     │
         └───────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  User Verifies OTP            │
         │  - Enter 6-digit code         │
         │  - auth.verifyOtp()           │
         │  - Email confirmed: true      │
         │  - Session created            │
         └───────────────────────────────┘
                         │
                         ▼
         ┌───────────────────────────────┐
         │  Insert Rate Limit Record     │
         │  - IP + 'signup' + today      │
         │  - Count towards daily limit  │
         └───────────────────────────────┘
                         │
                         ▼
                ✅ Signup Complete
```

---

## Activity Log

**Instructions:** This section is append-only. Add entries chronologically as tasks are completed, challenges encountered, or decisions made during implementation.

**Format:**
```
[YYYY-MM-DD HH:MM] - [Task ID] - [Status] - [Notes]
```

**Status codes:**
- ✅ COMPLETE
- 🔄 IN PROGRESS
- ⚠️ BLOCKED
- ❌ FAILED
- 📝 NOTE

---

### Log Entries

_[Entries will be added here as implementation progresses]_

---

**END OF IMPLEMENTATION PLAN**
