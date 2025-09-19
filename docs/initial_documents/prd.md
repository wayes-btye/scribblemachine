# Scribble Machine — PRD (MVP)

**Status:** Draft v0.4 • **Owner:** PM • **Date:** 18 Sep 2025

> Source: BA‑Final brief approved 18 Sep 2025. This PRD operationalises the MVP. BA decisions are **locked**; any proposed change must be raised as a change request.

---

## 0) Traceability to BA Decisions (Locked)

- **Golden path:** Photo → Line‑art → Download PDF (optimise E2E). **Now defined as ≤45s end‑to‑end, ≥90% first‑attempt print‑quality thumbs‑up, fallback usage <2%.**
- **Primary age band:** 4–8 → Impacts defaults (UX‑DEF‑01..03), complexity presets (FR‑GEN‑03), copy tone (UX‑COPY‑01).
- **Faces policy:** Family photos allowed; private by default; **clear export warning when faces detected**; upload only photos you own.
- **Free tier:** 3 pages total with watermark text: “Made with Scribble Machine.” → FR‑PAY‑07..10, UX‑WATER‑01.
- **Monetisation:** Credits + packs/sub; low entry price → FR‑PAY‑01..06.
- **Scope release valve:** Defer Prompt input to v1.1 if schedule risk → FLAG‑PROMPT‑MVP.

---

## 1) Objective & Success Metrics

**Objective:** Ship a delightful, trustworthy MVP that converts first‑session users to a print‑ready PDF in **≤45 seconds**.

**North‑stars** (first 30 days post‑launch):

- **D0 Activation:** ≥75% of new users generate ≥1 page in first session.
- **TTV (time‑to‑value):** ≤45s from upload to downloadable PDF.
- **Conversion:** ≥12% free→paid within 7 days.
- **Quality:** ≥90% first‑attempt “usable print” thumbs‑up.
- **Fallback reliability:** <2% of generations require fallback engine.
- **Ops cost:** Avg **all‑in generation cost ≤ \$0.05** per completed page (tracked in analytics).

---

## 2) Scope

**In‑scope (MVP):**

- Auth via email magic link (Supabase Auth).
- Upload (JPG/PNG/HEIC ≤10MB), EXIF orientation fix, HEIC→JPG.
- Image moderation (tiered: local/OSS → paid only if borderline).
- Generation primary: Google Gemini **Flash** image→line‑art.
- Fallback: Free AI **ControlNet (Lineart/HED/Scribble) preprocessor**; **optional behind a feature flag (default OFF)**. If disabled, failures show a friendly **Retry**; not required for MVP.
- Controls: **Complexity** (Simple/Standard/Detailed), **Line Thickness** (Thin/Medium/Thick).
- Output: **A4 (210×297mm) / US Letter (8.5×11in)** at **300 DPI**, safe margins (10mm / 0.25in), auto fit + centre w/ white padding, no crop of critical subject.
- **AI Title suggestion** after generation (opt-in). User can press “Suggest title” to get 1–3 options (text-only); toggle include/exclude in PDF header. Small credit line; watermark on free tier.
- Preview on web + **Download PDF**.
- Credits, Stripe checkout for packs/sub; counter + gating; webhooks.
- Basic analytics & logs.

**Out‑of‑scope:** Voice co‑creation; book fulfilment; multi‑page composer; mobile apps; advanced community features.

---

## 3) Personas & JTBD (Condensed)

- **Parent (primary, 4–8 y/o child)** – needs fast, printable, personalised activity with minimal faff.
- **Teacher/childminder (secondary)** – batch generate a few pages for class themes.

Key JTBD are inherited from BA brief.

---

## 4) User Stories & Acceptance Criteria (MVP)

### Epic A — Authentication & Accounts

**A1. Magic link sign‑in**

- *Story:* As a parent, I want to sign in with an email link so I don’t need a password.
- *AC:*
  1. Entering a valid email sends a one‑time sign‑in link.
  2. Clicking link signs the user in and creates a profile record.
  3. First sign‑in grants free tier (3 total generations) and shows remaining credits.
  4. Error states for invalid/expired link are clear with retry.

### Epic B — Upload & Moderation

**B1. Upload photo**

- *AC:* Accepts JPG/PNG/HEIC ≤10MB; shows file name/size; HEIC auto‑converts to JPG; EXIF orientation corrected; progress is visible; on cancel, removes temp file.

**B2. Moderation gate**

- *AC:* Image is checked; unsafe content blocks with friendly explanation; family faces allowed; **before export, show a clear warning if faces are detected (one confirmation per session).**

- *AC:* Image is checked; unsafe content blocks with friendly explanation; family faces allowed; if user attempts to share/export a faces image to public link (future), show a warning (MVP copy present but feature may be disabled).

### Epic C — Generation Pipeline

**C1. Generate line‑art (Flash)**

- *AC:* One API call produces high‑contrast line art tuned for colouring; defaults: **Standard** complexity, **Medium** lines; generation completes ≤30s 90th percentile.

**C2. Controls re‑use without extra credit**

- *AC:* Changing complexity/line thickness within the same job reuses cached intermediates (up to 2 quick re‑edits) without decrementing credits.

**C3. Fallback path**

- *AC:* If Flash fails/timeouts **and** the fallback flag is enabled, the system uses ControlNet preprocessor to produce line‑art; otherwise show a friendly error with **Retry**.

**C4. (Flagged) Quick prompt edits after generation**

- *Story:* As a user, I want to type a short prompt to tweak the generated page (e.g., “make lines thicker”, “add stars in background”).
- *AC:*
  1. Available only after initial generation.
  2. Supports a limited set of intents mapped to safe transforms (line weight, clean-up, simple additive shapes/patterns). No face/identity alterations.
  3. Reuses cached intermediates; up to **2 quick edits** per job without extra credit.
  4. Guardrails: reject unsafe/IP‑infringing edits with a helpful message.

### Epic D — Print‑ready Output

**D1. Consistent page size & DPI**

- *AC:* User can choose A4/US Letter; output is 300 DPI PDF with 10mm/0.25in margins; image is scaled and centred with white background; no raster aliasing artifacts at 300 DPI.

**D2. Title & credit line**

- *AC:* After preview, user can click **Suggest title** to receive 1–3 short title options (text‑only generation). User can edit or discard. Including a title in the PDF is a toggle. Paid users can hide the credit line.

**D3. Watermark for free tier**

- *AC:* “Made with Scribble Machine” text watermark appears in footer for free users; not present for paid.

### Epic E — Payments & Credits

**E1. Credit counter & gating**

- *AC:* Counter always visible; generate button shows “uses 1 credit”; if insufficient credits, CTA becomes “Get credits”.

**E2. Checkout & webhooks**

- *AC:* Stripe checkout for **£2/15**, **£5/50**; post‑payment webhook grants credits instantly; failures are retried and logged.

**E3. Subscription (optional at launch)**

- *AC:* Monthly plan £7.99/50; auto‑renew; cancel any time; proration not required for MVP.

### Epic F — UX & Preview

**F1. One‑screen flow**

- *AC:* Upload → set controls → Generate → Preview → Download; no multi‑page wizard; responsive on mobile/desktop.

### Epic G — Safety & Privacy

**G1. Privacy‑aware defaults**

- *AC:* Originals stored in private bucket; **default retention: originals 30 days; derived artifacts/PDFs 90 days** (until Gallery feature ships). Self‑serve deletion in Account removes originals and artifacts immediately.
- *AC:* Clear **faces‑sharing export warning** when faces are detected; one confirmation per session.
- *AC:* Upload only photos you own; avoid copyrighted characters/IP you don’t own.
- *AC:* Provide **Report a problem** link in preview and **Support** link in footer.

### Epic H — Analytics & Observability

**H1. Core events**

- *AC:* Track: sign\_up, upload\_started/completed, moderation\_blocked, generate\_started/completed, fallback\_used, pdf\_downloaded, credits\_changed, checkout\_started/succeeded/failed, thumbs\_up/down.

---

## 5) Functional Requirements (Detail)

- **FR‑UPL‑01:** Accept JPG/PNG/HEIC ≤10MB; client‑side validation; show errors inline.
- **FR‑UPL‑02:** HEIC→JPG conversion; preserve quality; strip GPS EXIF.
- **FR‑MOD‑01:** Tier‑1 moderation via local/OSS model; **FR‑MOD‑02:** escalate to paid API on borderline; **FR‑MOD‑03:** configurable thresholds; **FR‑MOD‑04:** light IP guidance (block obvious copyrighted character prompts/images when detected).
- **FR‑GEN‑01:** Primary engine: Gemini Flash; **FR‑GEN‑02:** return high‑contrast line‑art.
- **FR‑GEN‑03:** Controls map to deterministic presets (see §8.3).
- **FR‑GEN‑04:** Cache intermediates per job; allow up to 2 re‑edits free of extra credit.
- **FR‑GEN‑PERF:** 90th percentile generation ≤25s; end‑to‑end ≤45s; fallback rate <2%.
- **FR‑FALL‑01 (Optional):** Fallback engine via ControlNet Lineart/HED/Scribble behind a feature flag. If disabled, failures return a friendly error with **Retry**; no MVP dependency.
- **FR‑FALL‑02:** When enabled, emit `fallback_used` event.
- **FR‑FALL‑03:** (Non‑blocking) Target fallback rate <2% when flag is ON.
- **FR‑PDF‑01:** Render at 300 DPI; **FR‑PDF‑02:** A4/Letter selectable; **FR‑PDF‑03:** margins 10mm/0.25in; **FR‑PDF‑04:** white background; **FR‑PDF‑05:** scale & centre without cropping critical subject (subject detection heuristic or safe boxing); **FR‑PDF‑06:** optional title block; **FR‑PDF‑07:** watermark text for free tier; **FR‑PDF‑08:** preview before download; **FR‑PDF‑09:** black‑only lines (no grey fills) for ink‑friendly output.
- **FR‑PAY‑01:** Credit ledger; **FR‑PAY‑02:** 1 credit per generation; **FR‑PAY‑03:** show decrement timing; **FR‑PAY‑04:** Stripe checkout; **FR‑PAY‑05:** packs & subscription; **FR‑PAY‑06:** webhooks; **FR‑PAY‑07:** Free tier 3 total pages; **FR‑PAY‑08:** disable single‑credit purchases.
- **FR‑PAY‑09 (Multi‑currency):** Display prices in local currency based on geo/IP or Stripe session locale; charge in that currency when supported by Stripe; default to USD if unsupported. Prices/FX managed via Stripe price objects; GBP examples are copy only.
- **FR‑SAFE‑01:** Faces allowed; **FR‑SAFE‑02:** private storage by default; **FR‑SAFE‑03:** **export warning when faces detected**; **FR‑SAFE‑04:** self‑serve delete originals/artifacts; **FR‑SAFE‑05:** GDPR‑aware; **FR‑SAFE‑06:** COPPA‑friendly comms (parent account holder); **FR‑SAFE‑07:** IP guidance surfaced at upload/prompt.
- **FR‑ANL‑01:** Event schema (see §10) and dashboards.
- **FR‑ANL‑02 (Ads):** Persist **UTM** params (`source, medium, campaign, term, content`) and **click IDs** (`gclid, fbclid, ttclid, msclkid`) from first landing; attach to all key events.
- **FR‑ANL‑03 (Consent):** Implement **Consent Mode v2**; GA/Ads tags must read CMP consent and adapt behaviour.
- **FR‑ANL‑04 (GA4):** Link **GA4 ↔ Google Ads**; enable **Attribution** workspace; set lookback window (default 90 days) per property.
- **FR‑ANL‑05 (sGTM):** Provision **GTM Server** on first‑party subdomain; forward GA4/Meta/TikTok server events.
- **FR‑ANL‑06 (Meta):** Send **Pixel + CAPI** with `event_id` deduplication; include hashed identifiers when consented.
- **FR‑ANL‑07 (TikTok):** Send **Pixel + Events API** with deduplication.
- **FR‑ANL‑08 (BigQuery):** Enable GA4 **BigQuery export**; build Looker Studio funnel using exported events.

## 6) Non‑Functional Requirements

- **Performance:** 90th percentile generation ≤25s; end‑to‑end to PDF ≤45s on 20 Mbps.
- **Reliability:** Graceful degradation to fallback; retries with exponential backoff (max 2); job idempotency.
- **Security:** Private storage buckets; signed URLs for downloads (time‑boxed); PII minimised.
- **Compliance & Consent:** **Consent Mode v2** with a CMP for EEA/UK; tags adapt to consent. **Data retention:** originals 30d; artifacts/PDFs 90d by default; user‑initiated purge at any time.
- **Backups:** Daily Postgres backups (7‑day point‑in‑time recovery). Storage bucket **versioning** retained for 7 days.
- **Accessibility:** AA contrast for grown‑up UI; focus states; keyboard operable.
- **Compatibility:** Latest Chrome/Safari/Edge/Firefox; iOS 16+, Android 11+.

---

## 7) UX Spec (MVP)

**7.1 Flow:** Single responsive screen: [Upload] → [Controls] → [Generate] → [Preview] → [Download PDF]

**7.2 States & Empty/Errors:**

- Empty: drag‑and‑drop or tap to upload.
- During generation: friendly progress with mascot animation; cancellable.
- Errors: upload too large/format; moderation blocked; generation failed → CTA “Try backup engine”.

**7.3 Presets (defaults)**

- Complexity: **Standard** maps to model params (e.g., line simplification strength = 0.5).
- Line thickness: **Medium** maps to stroke width \~1.2–1.5 px at 300 DPI (scaled in vector stage).

**7.4 Visuals:** Parent‑first neutral palette + playful accent. No separate Kid Assist skin at MVP.

**7.5 Copy:** Clear, friendly, non‑technical. Footer watermark text exact: “Made with Scribble Machine”. Include short **IP notice** (“Only upload photos you own; avoid copyrighted characters.”). **Export warning** text appears when faces detected.

**7.6 Locale defaults:** Detect locale to pre‑select **A4 + local currency** (e.g., GBP for UK, EUR for EU) and **Letter + USD** for US; users can switch any time.

---

## 8) System & APIs (Contract‑first)

**8.1 Endpoints (Next.js API routes)**

- `POST /api/auth/magic-link` → triggers magic link.
- `POST /api/upload` → returns `input_url`.
- `POST /api/moderate` → `{ verdict: allow|block|review, reasons[] }`.
- `POST /api/generate` → body: `{ job_id, input_url, engine: flash|fallback, complexity, line_weight }` → returns `{ preview_url, artifacts[], model_used }`.
- `POST /api/export-pdf` → body: `{ job_id, size: A4|LETTER, title?: string, credit_line?: boolean }` → returns `{ pdf_url }`.
- `GET /api/jobs/:id` → status & artifacts.
- `POST /api/credits/use` → idempotent consumption of 1 credit per generation.
- `POST /api/checkout` → creates Stripe session.
- `POST /api/stripe/webhook` → grants credits; logs failures.
- **Server‑side tagging endpoint:** First‑party **GTM Server** at `https://analytics.<domain>` to forward GA4/Ads/Meta/TikTok events; honours CMP/Consent Mode.

**8.2 Error model**

- JSON: `{ code, message, retryable?: boolean }`. Standardised codes: `UPLOAD_TOO_LARGE`, `UNSUPPORTED_FORMAT`, `MODERATION_BLOCKED`, `MODEL_TIMEOUT`, `NO_CREDITS`, `PDF_FAIL`, `WEBHOOK_SIG_INVALID`.

---

## 9) Data Model (Initial)

As per BA brief (§8): `profiles`, `credits_ledger`, `jobs`, `artifacts` (with `blocked` flag, `model_used`, `seed`, `complexity`, `line_weight`).

**9.1 Storage buckets & TTLs**

- `uploads_originals/` — **private**, default TTL **30 days**.
- `artifacts_previews/` — **private**, default TTL **90 days**.
- `exports_pdf/` — **private**, default TTL **90 days**.
- All downloads via **time‑limited signed URLs** (e.g., 15 minutes). Lifecycle rules auto‑purge at TTL.

**9.2 Row‑Level Security (RLS) summary**

- RLS **ON** for all tables.
  - `profiles`: user can read/update self.
  - `credits_ledger`: owner read; **writes via service role only**.
  - `jobs`: owner read; create via service role; status readable by owner.
  - `artifacts`: readable if `artifacts.job_id` belongs to a `jobs` row with `jobs.user_id = auth.uid()`.
- Service role is used only in API routes/edge functions.

**9.3 Indexes**

- `jobs (user_id, created_at DESC)`
- `artifacts (job_id)`
- `credits_ledger (user_id, created_at)`
- Optional: partial index on `jobs (status)` for queues.

---

## 10) Analytics Spec

**Events & properties**

- `sign_up { method }`
- `upload_started { filetype, size_mb }`
- `upload_completed { duration_ms }`
- `moderation_blocked { reason }`
- `generate_started { engine, complexity, line_weight }`
- `generate_completed { engine, duration_ms }`
- `title_suggested { num_options }`
- `title_applied { manual:boolean }`
- `edit_prompt_applied { intent }`
- `fallback_used { reason }`
- `pdf_downloaded { size, has_title, free_tier }`
- `credits_changed { delta, reason }`
- `checkout_started { pack }`
- `checkout_succeeded { pack }`
- `checkout_failed { code }`
- `thumbs_up_down { up:boolean }`
- `cost_tracked { model_ms, infra_ms, est_cost_usd }`

**H2. Acquisition & Attribution (Ads)**

**Goal:** Attribute paid traffic (Google Ads, Meta, TikTok) to funnel steps: `session → generate_started → generate_completed → pdf_downloaded → checkout_started → checkout_succeeded`.

**Stack & Integrations**

- **GA4 via GTM (web) + GTM Server (sGTM)** with **BigQuery export** for custom funnels and cohorting.
- **Google Ads:** auto‑tagging (**gclid**) and GA4↔Ads link. Support manual UTM tagging.
- **Meta:** **Pixel (browser)** + **Conversions API (server)** with `event_id` **deduplication**; capture `fbclid`.
- **TikTok:** **Pixel (browser)** + **Events API (server)**; capture `ttclid`; deduplicate when both fire.
- **Consent:** **Consent Mode v2** wired to CMP; tags adapt to consent for **ad\_storage** and **analytics\_storage**.

**Data layer & parameters (sent with all key events)**

```
{
  source, medium, campaign, term?, content?,
  gclid?, fbclid?, ttclid?, msclkid?,
  page_location, page_referrer,
  session_id, user_id?,
  value?, currency?,
  event_id (UUID for dedup)
}
```

**Attribution & Reporting**

- GA4 **Advertising → Attribution** reports (last/first touch; DDA) with **90‑day** lookback (30‑day for acquisition as needed).
- Custom **Ad→PDF** funnel exploration segmented by `source/medium/campaign` with cohorting.
- Offline conversion import for Google Ads is supported later using stored `gclid` if needed.

**Acceptance criteria**

1. Landing with tagged ads stores UTMs + click IDs and they appear on all subsequent key events in GA4.
2. GA4 shows conversions by campaign/source; Exploration shows **Ad→PDF** funnel.
3. Meta/TikTok receive browser + server events with matching `event_id`; Events Manager shows healthy **dedup rate**; conversions match within ±10% of GA4 for like‑for‑like windows.
4. Consent banner blocks non‑essential tags until consent; **Consent Mode v2** signals reflected in tag behaviour; for EEA/UK, limited measurement continues when denied.

**Dashboards**

- GA4: Activation funnel; **Ad→PDF** funnel; TTV; Conversion; Fallback rate; Quality thumbs‑up; Cost per completed page.

---

## 11) QA Plan & Test Matrix

- **Browsers:** Latest Chrome, Safari, Edge, Firefox; iOS Safari; Android Chrome.
- **File inputs:** Portrait/landscape/square; HEIC with rotation; 0.5MB to 10MB; high‑contrast vs low‑contrast photos.
- **Moderation:** Safe vs unsafe (violence, explicit); borderline cases route to paid; IP detection blocks obviously infringing prompts/images.
- **Generation:** Engine success/timeout; fallback auto‑switch **when flag enabled**; otherwise **Retry**; re‑edits reuse cache (no extra credit decrement).
- **PDF:** A4/Letter; DPI check; margins; **black‑only line output**; print test on **3 real printers** (home inkjet, B/W laser, colour laser).
- **Payments:** Packs & subscription flows; webhook retries; ledger idempotency.
- **Analytics/Attribution:**
  - Landing with UTMs/click IDs persists values across session.
  - GA4 shows **Ad→PDF** funnel by campaign/source in Explorations.
  - Meta/TikTok Events Manager show browser+server events with valid **dedup**; event counts within ±10% of GA4 (same window).
  - Consent banner toggles: when denied, non‑essential tags suppressed; when granted, tags fire and Consent Mode reflects signals.
- **Accessibility:** Keyboard navigation; focus order; screen reader labels.

---

## 12) Release Plan & Flags

- **Flags:** `engine.fallback` (optional, default OFF), `feature.promptPath` (defer), `ui.quickEdits` (prompted edits, default OFF), `safety.facesWarnCopy`.
- **Environments:** dev → staging → prod; seed test users with credits.
- **Rollout:** Soft launch (invite link) Day 7; monitor metrics & error budgets; open public after stability.

---

## 13) Risks & Mitigations (from BA + PRD specifics)

- **Free competitors:** Emphasise quality/UX; polish fast path; clear screenshots on landing.
- **Model latency/cost:** Cache intermediates; fallback engine; cap re‑edits to 2 per job.
- **Moderation UX:** Friendly blocks; transparent reasons; log review metrics to tune thresholds.
- **Print quality:** Enforce 300 DPI; QA with real printer matrix.

---

## 14) Definition of Done (Re‑stated)

- Sign in → upload → generate → tweak → **download print‑ready PDF**.
- Credit system & Stripe working; webhooks applied.
- Moderation in place; helpful errors.
- Analytics & basic logs wired; dashboards live.
- Landing page with value, pricing, privacy & terms.

---

## 15) Decisions (locked post v0.4)

1. **AI Title in MVP:** **Yes** — post‑generation **Suggest title** (text‑only), optional in PDF.
2. **Kid Assist skin at MVP:** **No** — standard parent‑first UI only.
3. **Fallback engine:** **Optional, feature‑flagged (default OFF)** — not required for MVP.
4. **Moderation vendor:** **OSS/local first**, optional paid escalation later.
5. **Pricing & currency:** **Multi‑currency via Stripe** (localised display + charge) using price objects; GBP/EUR/USD examples for copy only.

---

## 16) 7‑Day MVP Plan (from BA, mapped to epics)

- **Day 1:** Epic A scaffold + UI shell.
- **Day 2:** Epics B/C happy path (Flash).
- **Day 3:** Epic D (PDF export 300 DPI A4/Letter).
- **Day 4:** Epic E (credits, Stripe, webhooks).
- **Day 5:** Controls & watermark; cache re‑edits.
- **Day 6:** Polishing, empty/error states, analytics, landing page.
- **Day 7:** QA, print tests, soft launch.

---

## 17) Acceptance Criteria Summary (per epic)

- **A:** Magic link flow functional; first‑run credits visible.
- **B:** Upload works across formats; moderation blocks unsafe.
- **C:** Flash primary; fallback triggers on failure; re‑edits free (≤2) per job.
- **D:** PDF exports meet spec (size, DPI, margins, watermark rules).
- **E:** Credit gating + Stripe packs/sub; webhooks reliable.
- **F:** One‑screen responsive UX; standard parent‑first UI.
- **G:** Private by default; delete on request.
- **H:** Analytics events emitted; dashboards show metrics.

---

## Appendix — Architect Notes & Post‑MVP Seeds

**Anonymous sessions (future option)**

- MVP can ship sign‑in first. If you later allow “try without account,” issue an **anon **`` (cookie + localStorage) and write `jobs` against it. On sign‑in, **merge** to `user_id` via a mapping table. Payments/credits/gallery remain account‑gated.

**Gallery (post‑MVP sketch)**

- Table: `gallery_items(id, user_id, artifact_id, title, created_at, visibility[private|link], expires_at?)`.
- Plan‑based quotas; **expiring share tokens**; show **export/share warning** if faces detected before enabling public link.

**Observability**

- Emit `storage_purge` when TTL cleanup runs; weekly `storage_gb_per_user` rollup for quotas and cost tracking.

**Security**

- Strip **GPS EXIF** on ingest (already covered). Consider **virus scan** if accepting PDFs later.
- **Time‑scoped signed URLs** only; never expose bucket paths directly.

**Performance**

- Cache **intermediate edge maps** per job; evict with an LRU policy per `user_id` to cap storage.

**Future upgrade**

- Optional **SVG export** (vector line‑art) behind a flag post‑MVP; keep MVP PDF as raster 300 DPI for simplicity.

---

*End of PRD v0.4*

