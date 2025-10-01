# UX Problems Only – Annotated with File References

**Severity legend:** 💀 5/5 = Critical blocker · 🔥 4/5 = Major issue · ⚠️ 3/5 = Moderate friction · ❗ 2/5 = Minor annoyance · ✅ 1/5 = Polish

---

### 1. Path convergence not signposted **(⚠️ 3/5)**

Upload flow after `1.2_Image-uploaded.png` becomes visually identical to Imagine flow (`2.2_imagine-loading.png` → `2.6_imagine-idea-editted-show-timeline.png`) with no on-screen explanation that paths merge; creates a mental model mismatch and uncertainty about what differs between modes.

### 2. Ambiguous mode switching during jobs **(🔥 4/5)**

Tooltip “Finish current task to switch modes” shown on `2.2_imagine-loading.png` / `2.4_imagine-idea-editting-(no-scroll-page-view).png` doesn’t clarify whether switching cancels, queues, or loses the current job; no explicit state transition.

### 3. Hidden/low‑visibility versioning **(🔥 4/5)**

Timeline is tucked behind a subtle toggle on `2.6_imagine-idea-editted-show-timeline.png`; restore/compare affordances are not obvious; thumbnails and controls are visually small.

### 4. Edit vs regenerate ambiguity **(⚠️ 3/5)**

Free‑text “Edit This Page” on `2.3_imagine-idea-generated.png` and `2.5_imagine-idea-editted.png` doesn’t define scope (minor tweak vs full recompose), risking expectation gaps.

---

## Credit model clarity

### 5. Credit spend not salient at decision moment **(🔥 4/5)**

The “1 credit” note near primary CTAs is easy to miss on `1.2_Image-uploaded.png`, `2.1_Imagine-idea-selected.png`, `2.3_imagine-idea-generated.png`, especially on long pages.

### 6. Remaining edits count is inconsistent **(⚠️ 3/5)**

Counter position/wording shifts between `2.3_imagine-idea-generated.png`, `2.5_imagine-idea-editted.png`, `2.6_imagine-idea-editted-show-timeline.png`, weakening spatial memory.

### 7. No impact preview before spending **(🔥 4/5)**

Complexity/Line Thickness controls on `1.2_Image-uploaded.png` and `2.1_Imagine-idea-selected.png` lack instant preview; experimentation feels risky.

### 8. No visible safety net/rollback policy **(🔥 4/5)**

From `2.3` onward there’s no explicit redo/rollback without extra cost; discourages iteration.

---

## Labels, terminology, messaging

### 9. Playful copy over clarity **(⚠️ 3/5)**

“Creating Magic/Our artist…” on `2.2_imagine-loading.png`, `2.4_imagine-idea-editting.png` competes with operational information (ETA, cost, queue status).

### 10. Time claims conflict with reality **(💀 5/5)**

“Usually 6–12 seconds” on `2.2_imagine-loading.png` juxtaposed with \~74s examples erodes trust.

### 11. Dead/underused placeholder real estate **(❗ 2/5)**

“Share Your Idea” card on `0_No-option-selected.png`, `2.1_Imagine-idea-selected.png` doesn’t meaningfully update post‑input.

### 12. Age guidance unclear for buyer vs user **(❗ 2/5)**

Complexity labels on `1.2_Image-uploaded.png`, `2.1_Imagine-idea-selected.png` don’t explain the mapping from age to output (e.g., line density/fill areas).

---

## Feedback & system status

### 13. Duplicated loaders during edits **(🔥 4/5)**

On `2.4_imagine-idea-editting-(no-scroll-page-view).png` and `2.4_imagine-idea-editting.png`, two progress modules make the page feel noisy/stuck.

### 14. Job ID exposed but not actionable **(❗ 2/5)**

Shown on `2.2_imagine-loading.png`, `2.3_imagine-idea-generated.png` without copy/share/deeplink; adds cognitive noise.

### 15. No explicit success/failure confirmation **(🔥 4/5)**

`2.5_imagine-idea-editted.png` lacks an unmistakable success banner or diff/annotation showing what changed vs request.

### 16. Progress feels vague on desktop 100% view **(⚠️ 3/5)**

`2.4_imagine-idea-editting-(no-scroll-page-view).png` shows large empty areas with generic messages; without percent/ETA, appears stalled.

---

## Controls & affordances

### 17. Primary CTAs drop below the fold **(🔥 4/5)**

Long auto‑scrolled pages (`2.3_imagine-idea-generated.png`, `2.5_imagine-idea-editted.png`) bury Generate/Edit/Download; users must hunt/scroll.

### 18. Export/Download enablement unclear **(⚠️ 3/5)**

Button states on `2.3_imagine-idea-generated.png` are not predictably enabled/disabled during processing.

### 19. Fiddly version navigation **(⚠️ 3/5)**

Small thumbnails and Prev/Next on `2.6_imagine-idea-editted-show-timeline.png` hinder quick comparison.

### 20. Free‑text edit lacks guardrails **(🔥 4/5)**

No presets/token guidance/validation on `2.3_imagine-idea-generated.png`, `2.5_imagine-idea-editted.png`; increases wasted credit risk.

---

## Consistency & predictability

### 21. Inconsistent naming of states **(❗ 2/5)**

“Generated Coloring Page,” “Edited Coloring Page,” “Your Coloring Page” across `2.3`, `2.5`, `2.6` create ambiguity.

### 22. Counters move around the layout **(⚠️ 3/5)**

Credits/edits remaining relocate across `1.2`, `2.3`, `2.5`, `2.6`.

### 23. Tabs vs buttons compete for attention **(❗ 2/5)**

On `0_No-option-selected.png`, `2.1_Imagine-idea-selected.png`, tab styling sometimes overshadows primary CTAs.

---

## Visual design & readability

### 24. Low‑contrast pastel UI **(🔥 4/5)**

Key text (cost/counters/tips) on `1.2`, `2.3`, `2.5` risks poor contrast and scanability.

### 25. Small icons/thin strokes **(⚠️ 3/5)**

Timeline toggle and prev/next on `2.6_imagine-idea-editted-show-timeline.png` are easy to overlook.

### 26. Dense right‑rail card stacks **(⚠️ 3/5)**

On `2.3_imagine-idea-generated.png`, light dividers and similar card styling flatten hierarchy.

---

## Content hierarchy

### 27. Printing Tips compete with primary actions **(❗ 2/5)**

Large persistent block near Download/Export on `2.3_imagine-idea-generated.png`, `2.5_imagine-idea-editted.png` creates end‑flow clutter.

### 28. Original image vs control placement **(❗ 2/5)**

On `1.2_Image-uploaded.png`, large right‑side preview and left‑side controls cause eye ping‑pong.

---

## Accessibility

### 29. Color‑only state indication **(🔥 4/5)**

Active/disabled/selected rely on color across `1.2`, `2.1`, `2.3`; weak for color‑blind users.

### 30. Small touch targets **(⚠️ 3/5)**

Timeline toggle and thumbnails on `2.6_imagine-idea-editted-show-timeline.png` don’t meet comfortable target sizes.

### 31. Keyboard focus not evident **(⚠️ 3/5)**

`2.1`, `2.3`, `2.4` show no visible focus order/outline; risky for keyboard users.

---

## Error handling & edge cases

### 32. Upload failure path unclear **(⚠️ 3/5)**

`1.1_upload option.png` states limits but shows no UI for oversize/unsupported/low‑contrast images.

### 33. Recovery from bad edits is buried **(🔥 4/5)**

Revert/restore lives in hidden timeline on `2.6_imagine-idea-editted-show-timeline.png`; not surfaced at point of failure.

---

## Mobile & responsive (inferred)

### 34. CTAs likely buried on mobile **(🔥 4/5)**

Stacked cards + big previews on `2.3`, `2.5` will push core actions below the fold.

### 35. Progress appears frozen on small screens **(⚠️ 3/5)**

Dual loaders on `2.4` without percent/ETA can feel stuck.

---

## Cognitive load

### 36. Too many similar cards, weak next‑step cue **(🔥 4/5)**

Across `2.1`, `2.3`, `2.5`, visual weight is uniform; “what do I do next?” is unclear.

### 37. High state complexity with little guidance **(🔥 4/5)**

Credits, edits remaining, mode, complexity, thickness, versions from `1.2 → 2.6` without progressive disclosure.

---

## Additional issues

### 38. No gallery/examples to calibrate expectations **(⚠️ 3/5)**

On `0_No-option-selected.png` and `2.1_Imagine-idea-selected.png`, users lack quick exemplars of Simple/Standard/Detailed outcomes before paying.

### 39. No DPI/size clarity for exports **(⚠️ 3/5)**

`2.3_imagine-idea-generated.png`, `2.5_imagine-idea-editted.png` don’t state resolution, print size, or margin bleed; print quality anxiety.

### 40. Missing privacy/copyright cues for uploads **(🔥 4/5)**

`1.1_upload option.png` lacks clear statements about storage, deletion, and permission—especially relevant for children’s photos.

### 41. No empty‑state for the timeline **(❗ 2/5)**

`2.6_imagine-idea-editted-show-timeline.png` doesn’t show a clear empty/default message guiding how versions appear.

### 42. Defaults appear sticky but aren’t explained **(❗ 2/5)**

“Standard/Medium” seem default across `1.2` and `2.1`; whether these persist per user/session is unclear.

### 43. Lack of draft/save‑for‑later **(⚠️ 3/5)**

Nothing on `2.3`–`2.6` indicates saving a work‑in‑progress without downloading.

### 44. No “insufficient credits” preview path **(🔥 4/5)**

What happens if user hits Generate/Edit with zero credits is not communicated; risks abrupt paywall friction.

### 45. No contextual help for edit prompts **(⚠️ 3/5)**

`2.3` and `2.5` don’t show examples, limits, or best‑practice tips near the free‑text box.

### 46. Auto‑scroll long pages imply scroll‑jank risk **(⚠️ 3/5)**

Most images are auto‑scrolled captures; combined with many stacked sections (`2.3`, `2.5`) this suggests potential jumpiness and disorientation when state changes.

### 47. Desktop 100% view reveals density issues **(⚠️ 3/5)**

`2.4_imagine-idea-editting-(no-scroll-page-view).png` shows duplicated progress panels and large whitespace; layout efficiency problems become obvious when not scrolled.

