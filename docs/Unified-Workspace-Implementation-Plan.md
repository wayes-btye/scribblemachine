# Unified Workspace Implementation Plan & Tracking

## Executive Summary
After analyzing both workflow UI plans (Codex and Cursor) and the current codebase, we're implementing **Option A: Unified Workspace with Mode Toggle** enhanced with comprehensive loading animations and context-preserving features.

## Current State Analysis
- **Confirmed Issue**: Both `/create` and `/imagine` pages use nearly identical layouts with duplicated state management
- **Panel Churn Problem**: Each step (upload → params → progress → result) renders new Cards sequentially, creating jarring transitions
- **Context Loss During Edits**: `GenerationProgress` completely replaces `ResultPreview`, losing visual context
- **Basic Loading States**: Simple `Progress` bars don't match family-friendly brand

## Recommended Approach: Unified Workspace Architecture

### Phase 1: Unified Route & State Management
1. **Create New Unified Workspace** (`/workspace` or consolidate to `/create`)
   - Single page with shared state for both upload and prompt modes
   - Mode toggle at the top (Upload Photo | Imagine Idea)
   - Preserve existing backend job processing - no API changes needed

2. **State Consolidation**
   ```typescript
   interface WorkspaceState {
     mode: 'upload' | 'prompt' | null
     step: 'input' | 'generating' | 'result' | 'editing'
     data: {
       uploadedImage?: { assetId: string, url: string }
       textPrompt?: string
       parameters?: GenerationParameters
       currentJob?: Job
     }
   }
   ```

3. **Progressive Disclosure Layout**
   - Left pane: Mode toggle + dynamic form (FileUploader OR TextPromptForm)
   - Right pane: Context canvas that adapts to current step
   - Smooth transitions between states instead of card mounting/unmounting

### Phase 2: Enhanced Loading Experience
4. **Lottie Animation Integration**
   - Replace basic `Progress` bars with family-friendly Lottie animations
   - Install `lottie-react` and create `LoadingAnimation` component
   - Themes: magic wand (generation), image processing (upload), pencil (editing)

5. **Context-Preserving Edit Flow**
   - Keep original preview visible with overlay loading during edits
   - Show "Applying changes..." with animation over dimmed preview
   - Eliminate complete preview disappearance

### Phase 3: Responsive Optimization
6. **Mobile-First Responsive Design**
   - Collapsible sections with sticky mode toggle
   - Touch-friendly interactions
   - Swipe gestures for mode switching

---

## IMPLEMENTATION CHECKLIST (Optimal Order)

### ✅ PHASE 1: FOUNDATION SETUP

#### [ ] 1.1 Project Setup & Dependencies
- [ ] Install lottie-react: `pnpm add lottie-react`
- [ ] Install any additional UI dependencies if needed
- [ ] Verify existing shadcn/ui components are sufficient

#### [ ] 1.2 Create Unified Workspace State Management
- [ ] Create `hooks/use-workspace-state.ts` with WorkspaceState interface
- [ ] Implement mode switching logic (upload ↔ prompt)
- [ ] Add state persistence for mode switching
- [ ] Add step management (input → generating → result → editing)

#### [ ] 1.3 Create Base Workspace Component Structure
- [ ] Create `app/workspace/page.tsx` (or modify `app/create/page.tsx`)
- [ ] Implement basic layout with left/right panes
- [ ] Add mode toggle component (Upload Photo | Imagine Idea)
- [ ] Set up progressive disclosure container structure

### ✅ PHASE 2: COMPONENT INTEGRATION

#### [ ] 2.1 Integrate Existing Components
- [ ] Move FileUploader into left pane with conditional rendering
- [ ] Move TextPromptForm into left pane with conditional rendering
- [ ] Move ParameterForm into left pane workflow
- [ ] Ensure existing component props/callbacks work with new state

#### [ ] 2.2 Right Pane Context Canvas
- [ ] Create adaptive canvas that shows relevant content per step
- [ ] Input step: Show mode explanation or empty state
- [ ] Generating step: Show loading with context preservation
- [ ] Result step: Show ResultPreview with edit capabilities
- [ ] Editing step: Show dimmed preview with edit overlay

#### [ ] 2.3 State Integration & Data Flow
- [ ] Connect workspace state to all existing components
- [ ] Ensure job creation/tracking works with unified state
- [ ] Implement mode switching without losing current work
- [ ] Test state persistence during navigation

### ✅ PHASE 3: LOADING EXPERIENCE ENHANCEMENT

#### [ ] 3.1 Lottie Animation Setup
- [ ] Create `components/ui/lottie-loader.tsx` base component
- [ ] Find/create family-friendly Lottie animation files
- [ ] Implement animation themes (generation, upload, editing)
- [ ] Add fallback to basic progress bar if animations fail

#### [ ] 3.2 Enhanced GenerationProgress Component
- [ ] Modify GenerationProgress to use Lottie animations
- [ ] Add contextual loading messages with playful tone
- [ ] Maintain existing technical progress information
- [ ] Ensure accessibility with text alternatives

#### [ ] 3.3 Context-Preserving Edit Flow
- [ ] Modify edit workflow to keep preview visible
- [ ] Add overlay loading state during edits
- [ ] Implement "Applying changes..." animation
- [ ] Add side-by-side comparison option

### ✅ PHASE 4: RESPONSIVE DESIGN & POLISH

#### [ ] 4.1 Mobile-First Responsive Layout
- [ ] Implement breakpoint-based layout changes
- [ ] Add collapsible sections for mobile
- [ ] Ensure mode toggle works on mobile (avoid horizontal overflow)
- [ ] Optimize touch targets for mobile interaction

#### [ ] 4.2 Navigation & Routing
- [ ] Update homepage links to point to new workspace
- [ ] Add redirect from old `/create` and `/imagine` routes
- [ ] Implement proper back/forward browser navigation
- [ ] Test deep-linking to specific modes

#### [ ] 4.3 Testing & Quality Assurance
- [ ] Test complete upload workflow with new interface
- [ ] Test complete prompt workflow with new interface
- [ ] Test mode switching during different workflow stages
- [ ] Test edit functionality with context preservation
- [ ] Run Playwright tests to ensure no regressions
- [ ] Test responsive design on various devices

### ✅ PHASE 5: PERFORMANCE & ACCESSIBILITY

#### [ ] 5.1 Performance Optimization
- [ ] Optimize Lottie animation loading
- [ ] Implement lazy loading for heavy components
- [ ] Add proper loading states for slow networks
- [ ] Monitor bundle size impact

#### [ ] 5.2 Accessibility Improvements
- [ ] Add proper ARIA labels for mode switching
- [ ] Ensure keyboard navigation works throughout
- [ ] Add screen reader support for loading animations
- [ ] Test with accessibility tools

#### [ ] 5.3 Error Handling & Edge Cases
- [ ] Add error boundaries for new components
- [ ] Handle mode switching with active jobs
- [ ] Add proper error states for failed loads
- [ ] Test offline/poor network scenarios

---

## IMPLEMENTATION LOG

### Instructions for Claude:
1. Before starting work, add a new log entry with current timestamp
2. For each checklist item completed, mark it with ✅ and add brief notes
3. For any challenges encountered, add detailed log entry with:
   - Problem description
   - Attempted solutions
   - Final resolution or current status
4. Update this document continuously during implementation

### Log Entry Format:
```
### [YYYY-MM-DD HH:MM] - [TASK/CHALLENGE/STATUS]
**Context:** Brief description
**Actions:** What was done
**Result:** Outcome and next steps
**Issues:** Any problems encountered
```

---

## BACKEND PRESERVATION NOTES
- **No API changes required** - existing job processing (`/api/jobs/*`) works perfectly
- **Reuse existing components** - FileUploader, ParameterForm, TextPromptForm, GenerationProgress, ResultPreview
- **Maintain current auth/credit system** - no changes to user authentication or billing flows
- **Keep existing database schema** - all Job, Asset, User types remain unchanged

## SUCCESS CRITERIA
- [ ] **Eliminate panel churn** - smooth state transitions without jarring card mounting
- [ ] **Reduce context loss** - maintain visual continuity during edits and loading states
- [ ] **Enable mode switching** - toggle between upload/prompt without losing current work
- [ ] **Improve mobile UX** - responsive design optimized for family tablet/phone usage
- [ ] **Family-friendly loading** - playful animations that match brand while maintaining professionalism

## ROLLBACK PLAN
If issues arise during implementation:
1. Keep existing `/create` and `/imagine` routes functional during development
2. Use feature flags or route-based rollback to revert to old system
3. All existing components remain backward compatible
4. Database and API remain unchanged, ensuring easy rollback

---

## IMPLEMENTATION LOG ENTRIES

### [2025-01-26 14:30] - INITIAL PLAN CREATION
**Context:** Created comprehensive unified workspace implementation plan
**Actions:**
- Analyzed both Codex and Cursor workflow UI plans
- Reviewed current codebase structure (/create and /imagine pages)
- Identified key pain points: panel churn, context loss, duplicated state management
- Created detailed implementation checklist with 5 phases and 23 main tasks
**Result:** Ready to begin Phase 1 implementation with clear roadmap
**Issues:** None - plan created successfully with logical progression from foundation to polish