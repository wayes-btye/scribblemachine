# Scribble Machine — Project Brief (MVP)

**Status:** BA‑Final ✅ (approved 18 Sep 2025)


**One‑liner:** Turn any photo or idea into a beautiful, printable children’s colouring page in seconds.

---

## BA Decisions (locked for MVP)
- **Golden path:** **Photo → Line‑art → Download PDF** (optimise this path end‑to‑end).
- **Primary age band:** **4–8** (defaults tuned for this range).
- **Faces policy:** **Allow family photos**, treated as private by default; warn before sharing/exporting to public links.
- **Free tier:** **3 pages total** with watermark text **“Made with Scribble Machine.”**
- **Monetisation:** Add **pay‑per‑use (credits)** alongside packs/subscription; target ultra‑low entry price to monetise early. Cost per image currently estimated at **~$0.03** (incl. typical edits) — pricing to keep healthy margin after payment fees.
- **Scope pressure‑release:** If schedule risk appears, **defer Prompt input** to v1.1; keep Photo path only.

**Working name & domain:** _Scribble Machine_ (scribblemachine.com)

---

## 1) Vision & Problem
Parents want screen‑light ways to engage kids’ imagination with personalised activities. Off‑the‑shelf colouring books aren’t bespoke, and most AI colouring generators feel generic, slow, or hard to edit. Scribble Machine creates **bespoke, printable colouring pages** from a photo or a spoken idea—fast, delightful, and safe—so kids feel ownership and parents can relax.

---

## 2) Target Users & JTBD
**Primary:** Parents of children aged 3–10.

**Secondary:** Teachers / childminders / after‑school clubs.

**Jobs‑to‑be‑done:**
- “When my child is excited about something (trip, cartoon, pet), I want to quickly turn it into a printable activity so they stay engaged offline.”
- “When I need a quiet 30–60 minutes, I want an activity generator I trust that’s easy, safe, and personalised.”
- “When I want to nurture creativity, I want an experience where my child can describe and iteratively shape what they see.”

**Success feelings:** pride (“we made this”), calm (“print & done”), delight (“wow, it understood me”).

---

## 3) Value Proposition
- **Positioning (parent‑first):** *“Turn your own photos into print‑ready colouring pages in under a minute — built for parents, delightful for kids.”*
- **Personalised** from your **photo** (prompt optional post‑MVP).
- **Fast**: one AI call to first print‑ready output.
- **Kid‑co‑creation (later):** voice‑led quick edits + simple visual history.
- **Quality**: clean line art, adjustable complexity & line thickness, A4/US Letter PDFs.
- **Safe**: content moderation + privacy‑aware processing.

---

## 4) Competitive Snapshot (high level)
- Many free/basic colouring generators exist. Key differentiators for Scribble Machine:
  - **Delightful co‑creation** (voice‑led edits + simple visual history).
  - **Parent‑first UX** (simple, trustworthy, print‑ready in under a minute).
  - **Quality controls** (complexity, line weight, trace/simplify modes).
  - **“Turn your memory into a colouring page”**—photo‑to‑line‑art that feels personal.

> Note: Colourify.ai offers free pages; we’ll counter with **quality + UX + co‑creation + print‑ready + book flow**.

### Competitive Matrix (Sept 2025)
| Product | Core Offer | Input Types | Print‑ready spec | Pricing snapshot |
|---|---|---|---|---|
| **ReallyColor** | Photo → colouring page + **printed books** | Photo upload (JPG/PNG) | 8.5"×11" PDF | Per‑page credits; books from ~$17.99; 0.49–2.39$/page (volume) |
| **Colorify AI** | **Free** AI colouring pages; photo→page + prompt playground | Photo & prompt | Claims printable downloads | Free (1000+ free pages) |
| **Canva (ColoringBook app/templates)** | Templates and text→colouring styles inside Canva | Text/templates | Canva export (various) | Freemium / Canva Pro |
| **Fotor** | Photo→line art/colouring | Photo | HD JPG download | Freemium |

**Sources:** ReallyColor site (pages/books, 8.5×11 PDF, pricing), Colorify AI (free generator & pages), Canva ColoringBook app/templates, Fotor photo→colouring tools.

---

## 5) MVP Scope (v1, ship in ~1 week)
**Goal:** **Photo → Line‑art → Downloadable, print‑ready PDF** (A4/US Letter) in ≤60s.

**Must‑haves:**
1. **Input**
   - **Image upload** (JPG/PNG/HEIC, ≤ 10MB). Auto‑convert HEIC → JPG; respect EXIF orientation; mobile‑camera friendly.
2. **Generation**
   - One AI call (Google Gemini **Flash** preview) to produce high‑contrast line‑art.
   - Controls: **Complexity** (Simple / Standard / Detailed), **Line Thickness** (Thin / Medium / Thick).
3. **Output (Print‑Perfect)**
   - **Consistent page size**: render to **A4 (210×297mm)** and **US Letter (8.5×11in)** at **300 DPI**.
   - **Safe margins**: 10mm (A4) / 0.25in (Letter); optional **bleed = 0** for home printers.
   - **Auto fit**: smart scale & centre with white padding; maintain aspect ratio; prevent cropping critical subject.
   - **Title block (optional)**: AI‑suggested title (editable) + small credit line (toggleable for paid users).
   - Web preview + **Download PDF**.
4. **Safety**
   - Image moderation; block unsafe/explicit content.
   - **Faces allowed**; warn about sharing; private storage by default.
5. **Account & Payments**
   - Email magic‑link sign‑in (Supabase Auth).
   - **Credits (pay‑per‑use)** + Stripe checkout for **credit packs** and optional **subscription**.

**Nice‑to‑have (stretch)**
- **Prompt → Page** flow (text), behind a feature flag if time permits.
- “Tracing mode” (bold outlines, low detail).
- Simple “add element” via mini prompt (e.g., “+star in background”).
- Save to gallery (10 latest).

**Out of scope (later)**
- Full voice co‑creation; visual edit history.
- Printify book fulfilment; multi‑page book composer.
- Mobile apps; advanced community features.

---

## 6) UX Principles & Flows
**Design principles**
- **Parent‑first** with **Kid‑friendly** accents (two visual modes: *Grown‑Up* vs *Kid Assist* skin; same flow, larger controls in Kid Assist).
- **One‑screen MVP**: upload/enter → preview → tweak → download.
- **Fast path**: auto‑defaults (Standard complexity, Medium lines) → “Generate”.
- **Clear costs**: credit counter + “this action uses 1 credit”.

**Primary flow (Image → Page)**
1. Upload photo → moderation.
2. Choose complexity & line weight → Generate (1 credit).
3. Preview; optional quick regenerate.
4. Download PDF (A4/US Letter) or save.

**Secondary flow (Prompt → Page)**
1. Enter prompt (e.g., “A monster with two ears in a forest”).
2. Generate (1 credit) → same preview → download.

---

## 7) Tech Approach (MVP)
**Stack Preferences (from founder):** React + Node.js; Supabase; Stripe; Google Gemini Flash.

**Frontend**
- Next.js (React); file upload with client‑side validation; simple state machine.
- PDF preview; responsive, printer‑friendly.
- **Dual‑skin UI:** *Grown‑Up* (compact) and *Kid Assist* (larger buttons, friendly mascot). Same flow, switchable.

**Backend**
- Node/TypeScript API routes (Next.js API or serverless functions).
- Image processing pipeline:
  1) Upload to **Supabase Storage** (private bucket); detect HEIC; convert to JPG; fix EXIF orientation.
  2) **Moderation** (image + any text). If blocked → friendly error.
  3) **Generation**:
     - **Primary:** Gemini **Flash** image‑to‑line‑art.
     - **Fallback (MVP): Free AI model** — open‑source **ControlNet Lineart/HED/Scribble** preprocessor to produce clean edges/line art without additional paid API usage. Host via Hugging Face or your own GPU. Use for previews/outages.
     - **(Optional) CV preview path (research)** — OpenCV pipeline (adaptive threshold → Canny → thinning) kept as a research track; can be added later if needed.
  4) **Post‑process**: white background, stroke cleanup, optional vector smoothing.
  5) **Typesetting for print**: scale to fit within page box, apply safe margins, centre; render at **300 DPI** to **PDF (A4/Letter)**; optional **AI title** at top (editable); watermark on free tier.

**Caching & reuse**
- Cache **intermediate artifacts** per job (edge map, masks) so small tweaks (line weight/complexity) don’t require a fresh model call; reuse for re‑edits included in the same credit.
- Store last **n** jobs (e.g., 10) for quick re‑download.

**Data**
- Supabase Auth (magic links), Profiles, Credits ledger, Jobs, Artifacts (input/output paths, metadata).

**Payments**
- Stripe: Credit packs & Starter subscription; webhook to grant credits.

**Safety & Privacy**
- Moderation on text & images; block faces policy configurable (allow family photos by default; warn before sharing).
- GDPR‑aware: delete originals on request; clear retention policy; COPPA‑friendly comms (parent is the account holder).

---

## 8) Data Model (initial)
- **profiles**: id, email, created_at, plan, display_name
- **credits_ledger**: id, user_id, delta, reason, created_at
- **jobs**: id, user_id, type (image|prompt), status, input_url, params (json), cost_credits, created_at, completed_at
- **artifacts**: id, job_id, preview_url, pdf_url, complexity, line_weight, seed, model_used, blocked (bool)

---

## 9) Pricing (launch hypothesis)
- **Free**: 3 pages total (watermark “Made with Scribble Machine”), low‑res preview, PDF locked/lightly branded.
- **Pay‑per‑use (Credits):** ultra‑low entry to monetise early given ~**$0.03** model cost per image incl. typical edits.
  - **1 credit = 1 page generation** *(includes up to 2 quick re‑edits on the same job without extra charge to match your cost assumption)*.
  - Starter: **£2** → **15 credits** (≈ £0.13/page).
  - Value: **£5** → **50 credits** (≈ £0.10/page).
- **Family Monthly (optional at launch):** £7.99/month for 50 pages + gallery save.

> Notes:
> • We’ll instrument cost per completed page and re‑edit rate; adjust credit policy if edits spike.
> • Larger packs smooth per‑transaction payment fees; single‑credit purchases disabled to avoid fee overhead.

---

## 10) Success Metrics
- **D0 Activation**: ≥60% of new users generate ≥1 page in first session.
- **TTV (time‑to‑value)**: ≤60 seconds to first printable PDF.
- **Conversion**: ≥8% free→paid within 7 days.
- **Quality**: ≥85% “usable print” thumbs‑up on first attempt.

---

## 11) Risks & Mitigations
- **Free competitors** → Focus on output quality, speed, parent‑and‑kid‑friendly UX, and co‑creation delight; differentiate via **photo‑to‑memory** angle and print‑book upsell.
- **Model cost/latency** → **Primary = Flash**; **Fallback = Free AI (ControlNet lineart/hed/scribble)** for previews/outages; cache intermediates so re‑edits don’t re‑hit the model; queue regen to avoid spikes.
- **Safety** → Strict moderation; clear reporting; **faces allowed** with private storage; warn before sharing.
- **Moderation cost** → Use a **two‑tier** approach: fast local/open‑source classifier first (free), escalate to a paid check only on borderline cases to control spend.
- **Photo rights** → Educate: only upload photos you own; provide delete controls.

---

## 12) 7‑Day MVP Plan (aggressive)
**Day 1** — Repo, Next.js scaffold, Supabase Auth, basic UI.

**Day 2** — Upload → Storage → Moderation stubs → Flash integration (happy path).

**Day 3** — Post‑processing + PDF export; A4/US Letter selector; preview.

**Day 4** — Credits system; Stripe checkout; webhooks; gating.

**Day 5** — Controls (complexity, line weight); free tier watermark.

**Day 6** — Polishing, empty states, error UX; analytics; simple landing page.

**Day 7** — QA, print tests, smoke tests; soft launch; feedback loop.

---

## 13) Definition of Done (MVP)
- User can: sign in → upload or prompt → generate → tweak → download **print‑ready PDF**.
- Payments grant credits; credit decrement works.
- Moderation in place; helpful errors.
- Analytics and basic logs wired.
- Landing page communicates value; clear pricing; privacy & terms published.

---

## 14) Future Roadmap (post‑MVP)
- **Co‑creation voice loop** (Whisper‑style STT + quick edits + visual change history).
- **Tracing/learning packs** (letters, numbers, shapes, handwriting).
- **Book builder + Printify** integration.
- **Mobile apps**; offline print queue.
- **Profiles for kid preferences** (complexity defaults, favourite themes).

---

## 15) Brand Notes
Tone: playful, trustworthy, helpful. Colour palette: warm neutrals + a single playful accent. Mascot: friendly scribble robot.

**Taglines:**
- “Turn memories into colouring magic.”
- “From idea to printable in seconds.”
- “Made by their imagination.”

---

### Open Questions (to confirm next):
1) **Resolved:** Accept family photos with faces — allowed; private by default; warn before sharing.
2) **Resolved:** Free tier = 3 pages; watermark text “Made with Scribble Machine.”
3) **TBD:** Exact micro‑pricing once we validate average edits/job and payment fees; revisit after first 100 paid users.
4) **TBD:** ‘Kid Assist’ skin at **MVP visual level** (larger buttons, friendly mascot) — confirm if included at v1.
5) **TBD:** Moderation vendor(s) and policy thresholds; document in PRD.
6) **TBD:** Include **AI title** field in MVP (default off) vs. add in v1.1.
7) **TBD:** Prompt pathway behind feature flag at launch (tech hooks are in place, UI hidden unless enabled).
8) **Research:** Quick spike on **OpenCV-only preview quality** vs. **ControlNet Lineart** output fidelity (cap 2 dev‑days). 

---

**Next step recommendation:** Document locked as **BA‑Final**. When you’re ready in a fresh chat, hand this brief to PM to create the PRD (don’t re-open BA decisions unless new info arises).