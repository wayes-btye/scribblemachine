# Plan: Build this UI with shadcn/ui

**Stack**

- Next.js (App Router) + Tailwind
- shadcn/ui (Radix) for controls + layout
- Framer Motion for tiny animations
- React Hook Form + Zod (form + validation)
- React Query for API calls
- (Optional) Lottie/SVG for mascots/rainbows

**Pages**

1. `/` Landing (hero, CTA buttons)
2. `/create` Workspace (preview left, controls right)

**Add shadcn components**

```
button card textarea input label
radio-group slider switch select
sheet dialog alert toast tooltip
progress skeleton badge separator
```

**Layout sketch (workspace)**

- `Container` → `Grid md:grid-cols-[1fr_360px] gap-6`
  - **Left**: `Card` (artboard preview) with fixed printable ratio (A4/Letter), toolbar row: `Button` (Download PDF), `Badge` (watermark).
  - **Right**: `Card` (Controls)
    - Text refine: `Textarea`
    - Paper size: `RadioGroup` (A4/US Letter)
    - Detail & line thickness: `Slider`s + `Switch` (Simple/Detailed)
    - Actions: `Button` (Apply Edit), secondary `Button` (Reset)
    - Feedback: `Toast` on success/error
- **Mobile**: wrap controls in `Sheet` (floating FAB “Settings” button)

**Landing essentials**

- Big headline (two-color gradient word)
- Two CTAs: `Button` (“Upload Photo”), ghost `Button` (“Imagine an Idea”)
- Decorative SVG blobs/stars; optional Lottie bot

**Theming**

- Tailwind config: friendly display font for headings
- Define brand tokens: `--brand`, `--accent` (warm orange/teal)
- Roundness: `rounded-2xl`, soft `shadow-lg`
- Use shadcn `Theme` (light only for MVP)

**States**

- Generating: show `Dialog` or inline `Card` with bot + `Progress`
- Empty: `Skeleton` preview
- Errors: `Alert` + retry button
- Quota: small `Badge` “2/2 quick edits used”

**Uploader**

- `react-dropzone` (or UploadThing). Show into preview `Card`; else placeholder doodle.

**PDF**

- “Download PDF” → call your backend → show `Toast` and open file. Keep preview at print ratio via CSS `aspect-[... ]`.

**Accessibility**

- Label every control; keep logical tab order; `aria-live` on progress messages.

**Animation**

- `motion.h1` fade/slide-in on landing
- Button micro-tap scale
- Sheet open/close spring; no heavy parallax

**Implementation order (checklist)**

1. Project scaffolding + Tailwind + shadcn install
2. Theme tokens + fonts
3. Landing hero + CTAs
4. Workspace grid + preview `Card` (static image placeholder)
5. Controls `Card` with form (Textarea, Radio, Sliders, Switch, Buttons)
6. Loading/empty/error states (Progress, Skeleton, Alert, Toast)
7. Uploader wiring → preview
8. Generate + React Query mutation; pipe to preview
9. PDF download hook
10. Mobile Sheet + polish (tooltips, focus rings)

