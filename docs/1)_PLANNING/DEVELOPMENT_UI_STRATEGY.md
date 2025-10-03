# UI Development Strategy - Isolated Dev Pages & Design Iteration

## Quick Reference

**Access Dev Pages:**
```
http://localhost:3000/dev/coloring-page-preview          ← Production component testing
http://localhost:3000/dev/coloring-page-preview/variant-* ← Design variants
```

**Edit Production Components:**
- File: `apps/web/components/workspace/result-preview.tsx`
- Test: `/dev/coloring-page-preview` (changes apply instantly)
- Verify: `/workspace` (test full integration)

---

## Core Concept: Isolated Development Pages

### What They Are
Development pages allow rapid UI iteration without backend dependencies:
- **No authentication required** - Bypass auth for instant access
- **No database queries** - Use mock data
- **No worker service needed** - Static test images
- **Production components** - Edit real code, not copies

### Why This Approach
| Old Way | New Way |
|---------|---------|
| Create mockup → Implement → Test with backend → Debug → Deploy | Edit component → Test instantly → Done |
| Need generated images | Use static images |
| Need auth/database | Zero dependencies |
| Changes in separate mockup file | Changes already in production code |
| Port changes back to prod | No porting step! |

---

## Two Development Modes

### Mode 1: Improving Production (Direct Editing)
**Use when:** Refining existing UI, fixing bugs, adding features

**Process:**
1. Edit production component directly (`result-preview.tsx`)
2. Test on `/dev/coloring-page-preview` (uses real component with mock data)
3. Changes automatically in production code
4. Verify in full workspace flow
5. Commit

**Example:**
```
Goal: Make download buttons more prominent
File: apps/web/components/workspace/result-preview.tsx
Test: http://localhost:3000/dev/coloring-page-preview
```

### Mode 2: Design Variants (Exploration)
**Use when:** Trying multiple design directions, A/B testing, radical changes

**Process:**
1. Create variant folder: `app/dev/coloring-page-preview/variant-{name}/`
2. Build completely custom UI (no production component constraints)
3. Test on `/dev/coloring-page-preview/variant-{name}`
4. Compare multiple variants
5. Port winning design to production

**Example:**
```
Create 3 variants:
- variant-cards/    → 3-column grid layout
- variant-minimal/  → Fullscreen focus
- variant-playful/  → Rainbow gradients & animations
```

---

## Creating Isolated Dev Pages

### File Structure Pattern
```
apps/web/app/dev/{feature}-preview/
├── page.tsx                      ← Base (production component)
├── variant-{name}/
│   └── page.tsx                  ← Custom variant
└── api/jobs/mock-*/versions/     ← Mock API (if needed)
    └── route.ts
```

### Base Page Template
```typescript
'use client'

import { ProductionComponent } from '@/components/workspace/production-component'
import type { Job } from '@coloringpage/types'

// Mock data matching production types
const MOCK_DATA = {
  id: 'mock-001',
  // ... realistic mock data
}

export default function FeaturePreviewDevPage() {
  const handleAction = () => console.log('[DEV] Action triggered')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Match production layout exactly */}
        <Card className="p-4 sm:p-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-4">Your Feature</h2>
          <ProductionComponent
            data={MOCK_DATA}
            onAction={handleAction}
          />
        </Card>

        {/* Minimal dev note at bottom */}
        <div className="mt-4 p-3 bg-gray-100 rounded text-xs text-gray-600">
          Dev Mode: Using mock data
        </div>
      </div>
    </div>
  )
}
```

### Variant Page Template
```typescript
'use client'

// Completely custom implementation
export default function VariantNamePage() {
  const MOCK_DATA = { /* same mock data */ }

  return (
    <div>
      {/* Total design freedom - any layout, colors, components */}
      {/* Don't use production components - build custom UI */}
    </div>
  )
}
```

---

## Design Iteration Workflow

### Phase 1: Establish Baseline
1. Identify production component to improve
2. Create isolated dev page if needed
3. Test current state

### Phase 2: Design Exploration (with AI)

**AI Prompt Pattern:**
```
Context:
- Working on: [specific component]
- Testing at: http://localhost:3000/dev/[page]
- Current state: [describe]

Goal: [clear design objective]

Constraints:
- Only edit: [specific file]
- Must maintain: [functionality]
- Don't touch: [areas to avoid]

Request: Show me 3 design variations
```

### Phase 3: Implementation
**For Direct Editing:**
- AI updates production component
- Test on dev page instantly
- Iterate until satisfied

**For Variants:**
- AI creates variant pages
- Test each variant URL
- Compare and pick winner
- Port to production

### Phase 4: Verification
- [ ] Component works on dev page
- [ ] All interactions functional
- [ ] Responsive on mobile
- [ ] Full workspace flow tested
- [ ] No console errors
- [ ] TypeScript types correct

---

## What Can Be Changed

### In Direct Editing (Production Component)
✅ **Safe to Change:**
- Component styling, colors, spacing
- Layout within component structure
- Typography, fonts, sizes
- Animations, transitions
- UI copy and labels

🚫 **Preserve:**
- Props structure
- State management patterns
- Event handlers (onClick, etc.)
- Data flow logic
- TypeScript types

### In Variants (Design Exploration)
✅ **Total Freedom:**
- Complete HTML structure
- Any layout system (grid, flexbox, etc.)
- All CSS styling
- Component arrangement
- Interactions, hover states
- Icons, graphics, decorations
- Animations

🚫 **Keep Same:**
- Mock data structure
- Image URLs (use test images)
- No backend changes

---

## AI Prompting Best Practices

### Effective Prompt Structure
```
Context:
- File: apps/web/components/workspace/result-preview.tsx
- Testing: http://localhost:3000/dev/coloring-page-preview
- Current: [describe what exists]

Goal: [specific design objective]

Request:
1. [Clear, specific ask]
2. [What to preserve]
3. [What to change]
```

### Example Prompts

**Exploration:**
```
Show me 3 design variations for the download button section.
Make buttons more playful and prominent.
Don't implement yet - just show concepts.
```

**Implementation:**
```
Implement variant #2 from our discussion.
File: apps/web/components/workspace/result-preview.tsx
Section: Lines 330-387 (Download section)
Keep all onClick handlers intact.
```

**Refinement:**
```
The loading spinner is too small.
Target: Line 342-344 (Download button loading state)
Make spinner larger and add animated text.
```

---

## Creating Additional Dev Pages

### Suggested Pages

**Upload Interface:**
```
app/dev/upload-preview/page.tsx
- Test: File upload, drag-drop, validation, previews
- Mock: FileUploader component
```

**Generation Progress:**
```
app/dev/generation-progress-preview/page.tsx
- Test: Loading states, animations, error handling
- Mock: GenerationProgress component
```

**Edit Interface:**
```
app/dev/edit-interface-preview/page.tsx
- Test: Form validation, credit display, prompts
- Mock: EditInterface component
```

---

## Design Variants Workflow

### When to Use Variants
Use variants when you want to:
- Try multiple completely different designs
- A/B test concepts with users
- Explore radical layout changes
- Test different interaction patterns

### Variant Creation Steps
1. **Create folder:** `app/dev/{feature}-preview/variant-{name}/`
2. **Copy template:** Use minimal variant as starting point
3. **Build custom UI:** Total design freedom
4. **Test URL:** `/dev/{feature}-preview/variant-{name}`
5. **Compare:** Open multiple variants side-by-side
6. **Pick winner:** Choose best performing design
7. **Port to production:** Update production component
8. **Clean up:** Archive or delete variants

### Variant Examples
```
variant-cards/      → 3-column grid, sidebar details
variant-minimal/    → Fullscreen image, floating controls
variant-magazine/   → Magazine layout, elegant typography
variant-playful/    → Rainbow gradients, animations
```

---

## Porting Variants to Production

### Option A: Replace Component
```typescript
// apps/web/components/workspace/result-preview.tsx
export function ResultPreview({ job, onReset, onEditJobCreated }: ResultPreviewProps) {
  // Copy JSX from winning variant
  // Update to use props instead of mock data
}
```

### Option B: Create New Component
```typescript
// apps/web/components/workspace/result-preview-v2.tsx
// Copy variant code, adapt to production

// Then update workspace-right-pane.tsx:
import { ResultPreviewV2 } from './result-preview-v2'
```

---

## Testing Checklist

Before committing changes:
- [ ] Component renders correctly on dev page
- [ ] All interactions work (clicks, forms, etc.)
- [ ] Loading states display properly
- [ ] Error states handle gracefully
- [ ] Responsive on mobile (resize browser)
- [ ] Full workspace flow tested at `/workspace`
  - [ ] Upload → generate → view result
  - [ ] Text prompt → generate → view result
  - [ ] Edit existing page
  - [ ] Timeline navigation
- [ ] No console errors
- [ ] TypeScript types correct

---

## Troubleshooting

### Component not found
**Fix:** Use `@/components/...` import aliases

### Timeline doesn't appear
**Fix:** Mock job needs `edit_parent_id` in `params_json`

### Images don't load
**Fix:** Verify images in `apps/web/public/assets/`

### API returns 404
**Fix:** Create mock endpoint at correct path

---

## Key Principles

### ✅ DO:
1. Use production components unchanged in base dev pages
2. Match production layout exactly
3. Use realistic mock data matching types
4. Keep dev indicators minimal
5. Maintain file structure in `/dev/` route

### ❌ DON'T:
1. Add dev controls in main UI flow
2. Create component copies
3. Modify production code for dev purposes
4. Skip the layout wrapper
5. Mix dev and production concerns

---

## Summary

**The Power:**
1. Zero context switching - edit real components
2. No porting needed - changes already in production
3. Fast iteration - no backend dependencies
4. AI-friendly - clear boundaries, focused context
5. Safe experimentation - isolated routes

**When to Use:**
- Designing new UI sections
- Refining existing components
- Testing responsive layouts
- Experimenting with interactions
- A/B testing design concepts

**Remember:** Edit production code → Test instantly on dev page → Verify in workspace → Commit
