# Create & Imagine Flow Plan

## Current Flow Snapshot
- Upload path (`apps/web/app/create/page.tsx`) presents a 2-column grid; as you upload, configure, generate, and edit, additional `<Card>` blocks mount on the right, so progress and results stack vertically on mobile and feel like cascading panels.
- Prompt path (`apps/web/app/imagine/page.tsx`) mirrors the same structure with `TextPromptForm`, meaning both flows duplicate UI but live on separate routes, preventing quick switching.
- `GenerationProgress` currently swaps in a straight progress bar (`Progress` component) and hides the previous `ResultPreview` content while `isGenerating` is true; edits trigger the same transition so users lose visual context during re-renders.
- Loading and empty states default to toasts and simple badges; there is no playful loading art even though the brand targets families.

## Pain Points to Solve
1. Fragmented navigation: choosing between `/create` and `/imagine` happens on the home hero; once inside, you cannot switch without leaving the workspace.
2. Panel churn: every state change renders a new card ("Original Image", "Generation Progress", "Your Coloring Page"), which feels like extra panels opening instead of a guided sequence.
3. Context loss during edits: edit submissions immediately remove the previous preview, replacing it with a loading bar and blank space.
4. Utility-first loading cues: the linear bar conveys competence but not delight or brand fit; Lottie (or animated sticker) support is desired without feeling cheap.
5. Mobile ergonomics: stacked cards grow very tall; interactive elements (upload dropzone, sliders, buttons) push key actions below the fold.

## Experience Principles
- Present a single "Workspace" surface with mode toggles instead of isolated pages.
- Use progressive disclosure: keep only one primary canvas visible, with secondary info in drawers or sidebars.
- Maintain visual context during asynchronous work; show the last successful preview until the new result replaces it.
- Celebrate waiting states with on-brand motion while still communicating progress and timing.

## Option A: Unified Workspace with Mode Toggle (Recommended)
- Consolidate `/create` and `/imagine` into one route (`/workspace` or reuse `/create`) that holds shared state for `mode = 'upload' | 'prompt'`.
- Introduce a segmented control or tabs component at the top ("Upload photo" and "Imagine with text"). Toggling swaps the left-pane form between `FileUploader` plus `ParameterForm` and `TextPromptForm` while preserving the right-pane preview and job history.
- Maintain a shared `currentJob` context so users can switch modes without leaving the generated art; store the last prompt or upload in tabs for quick return.
- Expose a lightweight switcher above the left pane on mobile (for example a Select or pill buttons) to avoid horizontal tabs overflow.

## Option B: Guided Stepper Layout
- Replace the free-form card list with a stepper labeled "1. Choose mode", "2. Customize", "3. Preview and download".
- Each step expands in place; one step is active at a time. When step 3 is active, steps 1 and 2 collapse into summary badges.
- Step 1 includes the mode toggle and either the uploader or prompt input. Step 2 houses complexity and line controls reused from existing forms. Step 3 combines progress, result preview, edit actions, and download or export tools.
- Pros: clear mental model and guardrails for new users. Cons: more refactor effort, but aligns UI with sequential flow.

## Option C: Split-View Canvas with Drawer
- Keep a persistent preview canvas occupying the right (or bottom on mobile). Form interactions open in a sliding drawer labeled "Upload image", "Describe idea", or "Adjust settings".
- The drawer can host both upload and prompt tabs; closing the drawer brings focus back to the canvas.
- Works well for living-room tablet usage because the preview is always visible; requires more layout work and potential use of Radix Dialog or Drawer components.

## Loading and Feedback Enhancements
- Swap `GenerationProgress` static `<Progress>` for a hybrid: a small Lottie animation (for example, an illustrated crayon loop) centered beside percentage text. Use a React Lottie player wrapped in a component (`components/ui/lottie-loader.tsx`) so the animation can be reused elsewhere.
- Retain textual status ("Queued", "Processing") and the elapsed time badge for competence; add microcopy with playful tone.
- For long-running jobs, show skeleton overlays rather than empty cards; the existing progress card can sit atop a blurred snapshot of the last preview.

## Preview and Edit Behavior
- Keep `ResultPreview` mounted while an edit job runs by introducing a `pendingJob` overlay state instead of toggling `isGenerating`. Show a dimmed preview with a corner badge ("Applying edits...") and a mini progress indicator.
- Provide a side-by-side comparison toggle by default, not hidden under `VersionComparison`; make comparison responsive with a swipeable carousel on mobile.
- Add a "View original photo" thumbnail when working from uploads; use a collapsible section or tooltip anchored to the preview frame.

## Mobile and Accessibility Notes
- Collapse the two-column grid into a vertical stack with sticky headers: keep the mode toggle in a sticky top bar, and use accordions for forms versus preview. Ensure primary call-to-action buttons stay above the fold.
- Increase tap targets (48px minimum) for radio tiles in `ParameterForm` and `TextPromptForm`; current implementations rely on inline labels.
- Audit color contrast on gradients; ensure the new Lottie loader is accompanied by text for accessibility and provide `aria-live` updates during progress.

## Implementation Roadmap
1. Architecture groundwork: create shared workspace state hook, co-locate forms, and scaffold route consolidation.
2. Layout refactor: implement either Option A or B. Start desktop-first, then layer responsive rules (Tailwind md or lg grids, sticky sections).
3. Progress overhaul: build Lottie loader component, integrate into `GenerationProgress`, and update edit flow to keep previews visible.
4. Mode switching polish: persist last-used settings per mode, add a quick switch call to action inside the preview card ("Try imagining instead").
5. Quality pass: run Playwright smoke scripts in `scripts/testing/` to ensure flows still execute; add new cases covering mode switching and edit overlay states.

## Open Questions for Follow-up
- Should credits be shared between modes or displayed separately in the UI? (Impacts shared header design.)
- Do we need collaborative history (multiple generated pages per session) in the sidebar, or is single-preview sufficient for MVP?
- Which Lottie style matches the brand palette? Consider briefing design for custom illustration before implementing.
