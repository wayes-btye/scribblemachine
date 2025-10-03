# Workspace UI Redesign Plan

## Overview
Redesign the workspace UI to implement a **timeline-based, single-focus interface** with centralized layouts, inspired by the worktree-1 screenshots while addressing current UX issues.

## Key Design Goals
1. **Timeline Feature**: Add 3-step progress indicator (Upload Photo → Create Magic → Ready to Color)
2. **Single-Focus UI**: Each step is the sole focus - no merged UI elements
3. **Centralized Layout**: Replace left/right split with centered, full-width approach
4. **Compact Configuration**: Minimize scrolling for complexity/line thickness options
5. **No Breaking Changes**: UI-only changes, preserve all existing functionality

## Implementation Tasks

### Phase 1: Timeline Component
- [ ] Create new `WorkspaceTimeline` component with 3 steps
- [ ] Design compact, prominent timeline (smaller than worktree-1)
- [ ] Add visual states: pending (○), active (highlighted), completed (✓)
- [ ] Implement sticky positioning with optional shrink-on-scroll effect
- [ ] Use shadcn components where possible

### Phase 2: Centralized Layout Restructure
- [ ] Modify `workspace/page.tsx` to remove 2-column grid layout
- [ ] Create single-column, centered layout (max-width constraint)
- [ ] Update header to be more compact (reduce size concern mentioned)
- [ ] Integrate timeline below header, above content area

### Phase 3: Single-Focus Step Design
**Upload Step (mode='upload', step='input', no uploadedImage)**
- [ ] Full-width centered upload dropzone
- [ ] Hide mode toggle or make it subtle/compact
- [ ] Remove "Get Started" placeholder card
- [ ] Center dropzone with appropriate width (not full screen)
- [ ] Keep upload best-practice tips subtle

**Imagine Step (mode='prompt', step='input', no textPrompt)**
- [ ] Full-width centered text prompt box
- [ ] Hide mode toggle or make it subtle/compact
- [ ] Make example prompts more compact (possibly inline chips or dropdown)
- [ ] Center prompt area with appropriate width

### Phase 4: Compact Configuration Options
- [ ] Redesign `ParameterControls` component for compactness
- [ ] Consider inline radio/select instead of large cards
- [ ] Option A: Show parameters only after Enter/Next button
- [ ] Option B: Use compact inline selects with dropdowns
- [ ] Test which approach provides better UX for parents

### Phase 5: Progressive Disclosure
- [ ] Update `WorkspaceLeftPane` to show one thing at a time
- [ ] When upload completes, show compact success indicator + move to parameters
- [ ] When prompt submitted, show compact confirmation + move to parameters
- [ ] Ensure smooth transitions between states

### Phase 6: Right Pane Integration
- [ ] Update `WorkspaceRightPane` to work with centered layout
- [ ] Consider moving preview below main content or as modal
- [ ] Ensure preview doesn't compete with primary CTA

### Phase 7: Playwright Testing Protocol
- [ ] Take "before" screenshots of each state (no selection, upload, imagine)
- [ ] Implement UI changes
- [ ] Use Playwright MCP to navigate through all states
- [ ] Take "after" screenshots for comparison
- [ ] Verify responsive design at mobile/tablet/desktop breakpoints
- [ ] Test all user flows: upload → generate, imagine → generate
- [ ] Verify no functional regressions

### Phase 8: Validation & Refinement
- [ ] Compare against reference screenshots (0-2.3, worktree-1)
- [ ] Ensure timeline is prominent but not overwhelming
- [ ] Verify single-focus principle throughout
- [ ] Check compact parameter options reduce scrolling
- [ ] Confirm centered, balanced layout

## Files to Modify
- `apps/web/app/workspace/page.tsx` - Main layout restructure
- `apps/web/components/workspace/workspace-left-pane.tsx` - Single-focus logic
- `apps/web/components/workspace/mode-toggle.tsx` - Make more subtle/compact
- `apps/web/components/workspace/parameter-form.tsx` - Compact controls
- `apps/web/components/workspace/text-prompt-form.tsx` - Compact controls
- `apps/web/components/workspace/parameter-controls.tsx` - Redesign for compactness
- **New:** `apps/web/components/workspace/workspace-timeline.tsx` - Timeline component

## Testing Checkpoints
Each phase will be tested with Playwright MCP before proceeding:
1. Timeline renders correctly and updates with state
2. Upload step is sole focus with centered layout
3. Imagine step is sole focus with centered layout
4. Configuration options are compact and usable
5. Progressive disclosure works smoothly
6. All user flows complete successfully
7. Responsive design works at all breakpoints

## Success Criteria
✅ Timeline present and updates with user progress
✅ Each step presented individually (single-focus)
✅ Centralized layout with appropriate widths
✅ Reduced scrolling for configuration options
✅ All existing functionality preserved
✅ No breaking changes to backend/API
✅ Matches design intent from reference screenshots

## Reference Screenshots
- `docs/log-exports/workspace-screenshots/0_No-option-selected.png` - Current initial state
- `docs/log-exports/workspace-screenshots/1.1_upload option.png` - Current upload state
- `docs/log-exports/workspace-screenshots/2.1_Imagine-idea-selected.png` - Current imagine state
- `docs/log-exports/workspace-screenshots/ui-instructions-2/worktree-1-screenshot.png` - Worktree-1 design reference
- `docs/log-exports/workspace-screenshots/ui-instructions-2/worktree-1-screenshot-imagine.png` - Worktree-1 imagine reference

## Design Constraints from Instructions
1. Timeline space should be **slightly smaller** than worktree-1 screenshot
2. Header might be **a bit too big** - consider reducing
3. Configuration options currently **too bulky** and require **excessive scrolling**
4. **Avoid current two-row layout** in production
5. **Centralize the active option** (upload or imagine)
6. Set **appropriate width** for both options (not full screen, not tiny)
7. **Prefer shadcn components** - tweak existing rather than custom build
8. Each step should be **sole focus** - one thing at a time
