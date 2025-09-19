# ColoringPage-BMAD — Full‑Stack Architecture v0.1 (with Mini Spikes 1 & 2)

**Owner:** Architect (Winston)\
**Source Inputs:** PM PRD (MVP), team conventions\
**Decision Mode:** Defaults selected for MVP unless marked [OPEN]

---

## 0) Executive Summary

We’re shipping a web app that turns a user photo into crisp line‑art and exports a **print‑perfect 300 DPI PDF (A4/Letter)**. MVP targets: **E2E ≤45 s**, **p90 generation ≤30 s**, **≥90% first‑attempt print‑quality**, **fallback usage <2%**, **≤\$0.05 per page** all‑in (model + infra + egress). Stack is **Next.js + Supabase + Stripe** with a small image/AI worker and server‑side PDF generation.

Two bounded pre‑work spikes (≤2 dev‑days each) de‑risk the USP and fallback path:

- **Mini Spike 1:** Server‑side **PDF @300 DPI** (PDFKit + sharp vs headless Chromium). Lock engine, timings, and typical file size.
- **Mini Spike 2:** **Fallback quality** comparison (**OpenCV edge‑detect** vs **ControlNet preprocessor**). Decide the MVP fallback toggle and default (OFF unless quality is clearly superior at low cost).

---

## 1) System Context & User Flow

**Happy path:**

1. User signs in via **magic link**.
2. Uploads JPG/PNG/HEIC (≤10 MB). We fix EXIF orientation, strip GPS.
3. Picks **Complexity** + **Line Thickness**; clicks **Generate**.
4. Backend calls **Primary Model (Gemini Flash, image→line‑art)**. We cache intermediates.
5. User can **re‑edit** (within 2 quick retries w/o extra credits) and then **Export PDF (300 DPI)**.
6. Credits decrement on successful generation; payment via **Stripe** for packs/subs.

**Fallback path:** if primary model fails or quality < threshold → **feature‑flagged fallback** path (OpenCV or ControlNet preprocessor). Default **OFF** at MVP; seam designed.

---

## 2) Architecture Overview

### 2.1 Components

- **Web App (Next.js on Vercel)**

  - Pages: `/` (landing), `/app` (single‑screen flow), `/billing`, `/history` (optional MVP), `/legal`.
  - Client: upload component w/ image preview, controls, progress, AI Title suggestion.
  - Calls internal APIs via `/api/*` (server routes / edge routes where suitable).

- **API Layer (Next.js API Routes)**

  - `/api/upload` → presigned URL from Supabase; triggers image intake worker (EXIF/HEIC fix) if needed.
  - `/api/generate` → enqueue job; orchestrates model call; returns `job_id` for polling/streaming.
  - `/api/title/suggest` → text‑only LLM for 1–3 short title options.
  - `/api/pdf/export` → server‑side PDF @300 DPI with margins/title.
  - `/api/credits/*` → read/decrement ledger; protected.
  - `/api/stripe/*` → checkout/session creation; webhooks receiver.

- **Workers**

  - **Image Ingest Worker** (Supabase Function / Vercel Cron): HEIC→JPG, EXIF fix, safety pre‑checks.
  - **Generation Worker**: calls **Gemini Flash** (primary). Optional fallback branch.
  - **PDF Worker**: raster→PDF @300 DPI using **PDFKit + sharp** (candidate #1) or Chromium (candidate #2).

- **Data/Infra**

  - **Supabase**: Auth (magic link), Postgres (core tables), Storage (originals, intermediates, artifacts) via signed URLs, RLS on per‑user paths.
  - **Stripe**: Checkout, Billing Portal, Webhooks (credit grants, invoices).
  - **Feature Flags**: simple table in Postgres + in‑memory cache (e.g., `app_flags(name primary key, on boolean, variant text, updated_at)`). **Seed flags:** `engine.fallback=false`, `feature.promptPath=false`, `ui.quickEdits=false`, `safety.facesWarnCopy=true`.
  - **Monitoring**: Log drains → Logflare/Datadog; metrics via tiny collector (p90 latency, success rate, cost per page, egress, retries).

### 2.2 Deployment Topology

- **Vercel**: Next.js (UI + API routes).
- **Supabase**: managed Postgres + Storage + Functions (edge close to Vercel region). Choose region with lower egress to model endpoint.
- **Model Provider**: Google AI (Gemini Flash). Keep provider URL configurable.
- **Queue**: **pg-boss** on Supabase Postgres (managed). Retries: **max 2** with backoff **1s → 5s**; dead‑letter to `jobs_failed`. **Idempotency:** `/api/generate` accepts `Idempotency-Key` (UUID). Jobs table enforces uniqueness on `(user_id, asset_id, hash(params_json))` when key present. Stripe webhook handlers are idempotent by `stripe_event_id` unique index in `credit_events`.

### 2.3 Repo & Deployment Layout (Standard Practice)

**Repo strategy: Monorepo, multi-service deploys.** One GitHub repo with clearly separated deployables; CI builds two Docker images and deploys them independently.

```
coloringpage-bmad/
├─ apps/
│  └─ web/                  # Next.js front-end + light API (auth/checkout/status)
│     ├─ app/api/*          # Only thin endpoints (upload-url, jobs, stripe)
│     └─ Dockerfile         # Image A → Web host (e.g., Vercel/Containers)
├─ services/
│  └─ worker/               # Long-running back-end (ingest, model, 300-DPI PDF)
│     ├─ src/{ingest,generate,pdf}
│     └─ Dockerfile         # Image B → Worker host (Fly/Render/Railway/VM)
├─ packages/                # Shared code (types, db, prompts, config)
└─ supabase/                # SQL, RLS policies, optional edge functions
```

**Deployment mapping**

- **Service A — Web** → serves the UI and a few light APIs; scales for requests; short timeouts are OK (no heavy work).
- **Service B — Worker** → consumes jobs from DB/queue; runs AI & PDF; private network access to DB/Storage; no public endpoints required.

**Request flow (simplified)**

1. Web issues presigned upload URL; user uploads to Storage.
2. Web creates a `job` (DB/queue) and returns `job_id`.
3. Worker processes job → writes artifacts to Storage and updates status.
4. Web polls `/api/jobs/{id}` and serves signed URLs for preview/PDF.

**CI/CD (GitHub Actions example)**

- Path filters build only what changed:
  - Changes under `apps/web/**` → build & push **web image**, deploy **Service A**.
  - Changes under `services/worker/**` → build & push **worker image**, deploy **Service B**.
- Shared packages trigger both if they affect both services, or use per-app lockfiles to scope builds.

**Env & secrets isolation**

- Separate env files/variables:
  - `WEB__*` (public-safe subset via `NEXT_PUBLIC_*`), Stripe Checkout URL, domain, analytics keys.
  - `WORKER__*` (model keys, service role key, storage service creds, PDF engine flags).
- Both point to the same **Supabase** project (Auth/DB/Storage), same region.

**Security defaults**

- Private buckets, **time-scoped signed URLs** only.
- Web never holds service-role key; Worker uses service-role for server tasks.
- Optional tiny gateway if you later want a single public API domain; not required for MVP.

### 2.4 Analytics Plumbing (from PRD)

- **Browser → sGTM → GA4/Ads/Meta/TikTok**. Web emits browser events and respects **Consent Mode v2**; stores UTM & click IDs; attaches them to key events.
- **Server (Worker) → CAPI/Events API** with `event_id` deduplication. Worker emits `generate_*`, `fallback_used`, `pdf_downloaded`, and Stripe conversion events when consent allows.
- **Shared schema** (see PRD): `sign_up`, `upload_*`, `generate_*`, `title_*`, `fallback_used`, `pdf_downloaded`, `credits_changed`, `checkout_*`, `thumbs_up_down`, `cost_tracked`.

---

## 3) Detailed Design

### 3.1 Data Model (Postgres)

- `users(id, email, created_at, last_login_at)`
- `credits(user_id, balance, updated_at)` — ledger reflected via `credit_events`.
- `credit_events(id, user_id, delta, reason, stripe_event_id, created_at)`
- `assets(id, user_id, kind, storage_path, width, height, bytes, hash, created_at)`
  - `kind ∈ {original, preprocessed, edge_map, pdf}`
- `jobs(id, user_id, status, params_json, cost_cents, model, started_at, ended_at, error)`
  - `status ∈ {queued, running, succeeded, failed}`
- `flags(name primary key, on boolean, variant text, updated_at)`
- `titles(id, user_id, job_id, suggestion text, accepted boolean, created_at)`

Row‑Level Security (RLS): enforce `user_id = auth.uid()` for reads/writes except webhooks.

### 3.2 Storage Layout (Supabase)

- `originals/{userId}/{assetId}.jpg` — **TTL 30 days** (policy rule).
- `intermediates/{userId}/{jobId}/edge.png` — **TTL 48 h**, LRU purge.
- `artifacts/{userId}/{jobId}/page.pdf` — **TTL 90 days**.
- `artifacts_previews/{userId}/{jobId}/preview.png` — **TTL 90 days** (optional image preview bucket).

Signed, short‑lived URLs for client download; no public bucket exposure.

**Nightly maintenance:** `scripts/purge-intermediates.ts` enforces TTLs and emits `storage_purge` metrics.

### 3.3 Job Orchestration

1. Client `POST /api/generate {asset_id, controls}`.
2. API validates credits; creates `job` row (`queued`) and decrements credits **optimistically** (refund on failure).
3. Worker picks job → fetch original via signed URL → run **primary model (Gemini Flash)** with `Complexity`, `Line Thickness` controls mapped to prompts/params.
4. Save `edge_map` (PNG) to `intermediates` bucket; update job to `running` → `succeeded`.
5. **MVP status delivery:** Client **polls every 1.5–2.0 s** `GET /api/jobs/{id}`. **SSE/WebSockets deferred** to post‑MVP.
6. Re‑edits: reuse intermediate within 48 h for 2 quick parameter tweaks (no extra credit). After that, charge.

### 3.4 PDF Generation (Server‑Side)

- Inputs: `edge_map`, paper size (A4/Letter), margins, optional **Title**.
- Process: raster to 300 DPI canvas → center/fit with safe margins → embed as one page.
- Output: `page.pdf` stored in `artifacts`. Watermark if user has zero credits/free tier.

### 3.5 AI Title Suggestion

- Endpoint: `/api/title/suggest` with short prompt seeded by subject cues from the edge map filename or user hint. Returns 1–3 concise options (≤40 chars). Toggleable.

### 3.6 Moderation

- Tier 1 (local): basic nudity/violence heuristic + face detection → show privacy warning if faces.
- Tier 2 (vendor): only for borderline cases or when user contests a block.
- All moderation decisions logged to `jobs.error`/audit table.

**Provider seam:** Define `ModerationProvider` with `checkImage(inputUrl) → { verdict: allow|block|review, reasons[] }`. Pipeline: after ingest, before generation. If `review`, escalate to vendor and decide; on `block`, surface friendly error and emit `moderation_blocked`.

### 3.7 Security & Privacy

- Strip **GPS EXIF** at intake; force re‑encode.
- All downloads via time‑scoped signed URLs; private buckets.
- Webhook endpoints whitelisted and signed (Stripe secret).
- Limit uploads to ≤10 MB; **cap dimensions to ≤24 MP**; validate mime & magic bytes.
- Rate‑limit `/api/generate` by user and IP.
- If any worker HTTP endpoints are exposed, **CORS: deny by default**, allow only web origin.
- Supabase JWT **aud/iss** checks enforced in server helpers; web never handles service‑role key.

### 3.8 Observability & SLOs

- **SLOs:** E2E ≤45 s (99%), p90 generation ≤30 s, success ≥98%, cost/page ≤\$0.05, fallback <2%.
- Emit events: `upload_ok`, `gen_start`, `gen_ok|gen_fail`, `pdf_ok`, `credit_dec`, `refund`, with durations and byte counts.
- Dashboards: p50/90/99 latencies, job outcomes, costs, egress per user cohort.

---

## 4) API Surface (MVP)

```
POST /api/upload-url {ext} -> {url, asset_id}
POST /api/generate {asset_id, complexity, line_thickness} -> {job_id}
GET  /api/jobs/{id} -> {status, preview_url?, error?}
POST /api/pdf/export {job_id, paper:"A4|Letter", title?} -> {pdf_url}
POST /api/title/suggest {job_id|hint} -> {titles:["…"]}
GET  /api/credits -> {balance}
POST /api/stripe/checkout {pack|plan} -> {checkout_url}
POST /api/stripe/webhook (server-to-server)
```

Auth: Supabase/JWT on all user endpoints; webhook is unauth’d but signed.

**Idempotency**

- `/api/generate` accepts `Idempotency-Key` header. Server ensures single job creation per key.
- Stripe webhook handlers dedupe by `stripe_event_id` unique index in `credit_events`.

**Error codes (align with PRD)** `UPLOAD_TOO_LARGE`, `UNSUPPORTED_FORMAT`, `MODERATION_BLOCKED`, `MODEL_TIMEOUT`, `NO_CREDITS`, `PDF_FAIL`, `WEBHOOK_SIG_INVALID`.

---

## 5) Front‑End Architecture (High‑level)

- Single‑page flow under `/app` with states: **Empty → Uploading → Tuning → Generating → Preview → Exported**.
- Local state via React Query (server state) + minimal client state (controls, title selection).
- Drag‑and‑drop uploader with HEIC warning; image preview; basic histogram for exposure hint (optional polish).
- Accessibility: keyboard flow, alt text, WCAG‑AA contrast; no motion‑only affordances.

---

## 6) Cost & Performance Controls

- Cache intermediates for 48 h; allow 2 re‑edits free → after that, charge.
- Stream model responses where possible; avoid large base64 payloads (use URLs).
- Prefer regional proximity (Vercel/Supabase in same region close to model).
- Use WebP/PNG‑8 for previews, PNG for final edge map, PDF for export.

---

## 7) Risks & Mitigations

1. **PDF speed/fidelity** → Spike 1; choose engine; memoize renderer; cap page size <5 MB typical.
2. **Fallback complexity** → Spike 2; if OpenCV is “good enough,” adopt as cheap fallback; else keep flag OFF for MVP.
3. **HEIC/EXIF variability** → Centralize in Ingest Worker using `libvips`/`sharp`.
4. **Moderation false‑positives** → Provide override path with audit + vendor check.
5. **Cost creep** → Track per‑job model cost + egress; stop‑loss if over budget.

---

## 8) Mini Spikes — Plans & Acceptance Criteria

### 8.1 Mini Spike 1 — PDF @300 DPI

**Goal:** Validate server‑side PDF generation that is fast, small, and faithful.

**Candidates:**

- **A. PDFKit + sharp (Node)** — raster pipeline, full control.
- **B. Headless Chromium** — render to PDF; simpler layout but heavier.

**Procedure:**

1. Use 5 diverse edge maps (portrait, busy background, thin lines, thick lines, grayscale photo).
2. Generate A4 & Letter PDFs at 300 DPI with 10–12 mm margins.
3. Measure: generation time (p50/p90), output size, visual crispness (manual), memory usage.

**Acceptance:**

- p90 PDF step **≤800 ms** on small instance.
- Typical file size **≤5 MB** (target 1–3 MB).
- No visible resampling artifacts when printed.
- Programmatic DPI metadata present; page boxes correct.

**Decision rule:** Choose **PDFKit** if p90 ≤ **800 ms** and typical size ≤ **5 MB** on test set; **otherwise choose Chromium**. Record results in `/spikes/pdf-300dpi/samples/summary.md`.

**Deliverables:** sample PDFs, timing table, engine recommendation.

### 8.2 Mini Spike 2 — Fallback Quality (OpenCV vs ControlNet Preprocessor)

**Goal:** Decide if OpenCV‑only pipeline is sufficient as MVP fallback, or if ControlNet preprocessor is required.

**Pipelines:**

- **A. OpenCV** — Canny/auto‑Canny, bilateral filter, adaptive threshold; optional morphology.
- **B. ControlNet Preprocessor** — e.g., `lineart`, `scribble` preprocessors.

**Procedure:**

1. Run same 8 photos through A & B with 2–3 parameter sweeps.
2. Create a 2×8 side‑by‑side grid at print scale; have 3 rubrics: **Printability**, **Detail retention**, **Coloring friendliness** (large closed regions, minimal speckle).
3. Note runtime and cost per image.

**Acceptance:**

- If **OpenCV** scores ≥4/5 average on all rubrics and adds <\$0.005/image infra cost → adopt OpenCV as MVP fallback.
- Else keep fallback feature flag OFF for MVP and revisit after launch.

**Deliverables:** gallery, short write‑up, default decision.

---

## 9) Open Decisions (Defaults Proposed)

- **Hosting**: Vercel + Supabase (DEFAULT ✅).
- **PDF Engine**: **PDFKit + sharp** (DEFAULT ✅, pending Spike 1).
- **Queue**: Postgres‑backed jobs (DEFAULT ✅; revisit at scale).
- **Title Model**: Gemini (text‑only) (DEFAULT ✅).
- **Fallback**: Flag present but **OFF** by default (DEFAULT ✅; toggle after Spike 2 if OpenCV passes).

---

## 10) Build Plan (MVP Sequencing)

1. **Spike 1 (PDF)** + **Spike 2 (Fallback)** — 1–2 days each.
2. Auth + Upload + Ingest Worker.
3. Generate API + Primary Model integration + Intermediates storage.
4. UI flow + Progress + Preview.
5. PDF Export + AI Title.
6. Credits + Stripe checkout + webhooks.
7. Moderation + logs + dashboards.
8. Polish: re‑edit path, empty/error states, basic history (optional).

---

## 11) Definition of Done (MVP)

- 95%+ of uploads produce a printable PDF first try; E2E ≤45 s p99 on test set.
- Stripe live; credits persist; webhooks verified; refunds on failed jobs.
- Security: EXIF GPS stripped; all buckets private; signed URLs only; rate limits in place.
- Docs: this architecture, API README, env vars, runbooks for failures.

---

*End of v0.1. Mark comments inline; I’ll roll them into v0.2 and lock decisions after the spikes.*

