# Design Variants Workflow

## The Two Different Use Cases

### Use Case 1: Improving Production Component
**Goal**: Make the actual app better
**File**: Edit `result-preview.tsx` directly
**Test**: On `/dev/coloring-page-preview` (base - uses production component)
**Result**: Changes go straight to production

### Use Case 2: Exploring Design Variants
**Goal**: Try 3-5 completely different designs, pick the best one
**Files**: Create variant folders with redesigned UIs
**Test**: Each variant has its own URL
**Result**: Pick winner, port to production

## Key Understanding

**Base** (`/dev/coloring-page-preview/`)
- Isolated testing environment
- Uses ACTUAL production `ResultPreview` component
- Mock data for rapid testing
- Changes here affect production component

**Variants** (`/dev/coloring-page-preview/variant-x/`)
- Complete redesigns/alternative implementations
- Do NOT use production components
- Totally custom UI explorations
- Changes here are isolated experiments

---

## What Can You Change in Variant Pages?

### ✅ Everything About Layout & Design

You can change:
- **Complete HTML structure** - cards, grids, flexbox, whatever
- **All styling** - colors, fonts, spacing, shadows
- **Component arrangement** - totally different order/grouping
- **Interactions** - hover states, animations, transitions
- **Typography** - headings, sizes, weights
- **Color schemes** - gradients, themes, palettes
- **Icons & graphics** - different icon libraries, custom SVGs
- **Responsiveness** - different breakpoints, mobile-first, etc.

### 🚫 What You Can't Change

- The mock data structure (job interface)
- The actual image generation logic (that's in the worker)
- Authentication/database (dev pages bypass that)

---

## Folder Structure

```
apps/web/app/dev/coloring-page-preview/
├── page.tsx                      ← Base (uses production ResultPreview component)
├── variant-cards/
│   └── page.tsx                  ← Cards layout variant (custom redesign)
├── variant-minimal/
│   └── page.tsx                  ← Minimal variant (custom redesign)
└── variant-{your-name}/
    └── page.tsx                  ← Your custom variant
```

### Access URLs:
```
http://localhost:3000/dev/coloring-page-preview                   ← Base (production component)
http://localhost:3000/dev/coloring-page-preview/variant-cards     ← Cards variant
http://localhost:3000/dev/coloring-page-preview/variant-minimal   ← Minimal variant
```

---

## Example: What's Different Between Variants

### Base (page.tsx)
- Uses production `ResultPreview` component
- Standard card layout with timeline
- Edit interface from production
- Traditional button grid
- **Tests the REAL component**

### Cards Variant (variant-cards/page.tsx)
- 3-column grid layout
- Large image card + details sidebar
- Gradient purple/pink theme
- Horizontal tip cards with emojis
- **Completely custom JSX** (no production components)

### Minimal Variant (variant-minimal/page.tsx)
- Fullscreen image focus
- Floating top action bar
- Fixed bottom controls
- Black & white theme
- **Ultra-simple custom structure**

---

## Workflow: Create Your Own Variants

### Step 1: Create Variant Folder

```bash
# Create new variant folder
mkdir -p apps/web/app/dev/coloring-page-preview/variant-playful

# Copy minimal variant as starting point
cp apps/web/app/dev/coloring-page-preview/variant-minimal/page.tsx \
   apps/web/app/dev/coloring-page-preview/variant-playful/page.tsx
```

### Step 2: Edit the New Variant

```typescript
// apps/web/app/dev/coloring-page-preview/variant-playful/page.tsx

export default function PlayfulVariantPage() {
  const job = MOCK_EDITED_JOB

  return (
    <div className="min-h-screen bg-yellow-50">  {/* ← Change background */}

      {/* Add fun animations */}
      <div className="text-6xl animate-bounce mb-4">🎨</div>

      {/* Completely different layout */}
      <div className="max-w-2xl mx-auto">
        <h1 className="text-5xl font-black text-center mb-8 transform -rotate-2">
          Your Amazing Creation!
        </h1>

        {/* Custom image presentation */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-pink-500 to-yellow-500 blur-xl opacity-50" />
          <img
            src={job.download_urls?.edge_map}
            alt="Coloring page"
            className="relative w-full rounded-3xl shadow-2xl border-8 border-white"
          />
        </div>

        {/* Playful button styles */}
        <Button className="w-full mt-8 h-16 text-2xl bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg hover:shadow-2xl transform hover:scale-105 transition">
          Download Your Masterpiece! 🎉
        </Button>
      </div>
    </div>
  )
}
```

### Step 3: Visit Your Variant

```
http://localhost:3000/dev/coloring-page-preview/variant-playful
```

### Step 4: Iterate Quickly

Change colors, layout, anything → Save → Refresh → See instantly!

---

## Advanced: AI-Generated Variants

### Prompt Pattern for Creating New Variants:

```
Create a new design variant for the coloring page preview.

Steps:
1. Create folder: apps/web/app/dev/coloring-page-preview/variant-{name}/
2. Create file: variant-{name}/page.tsx
3. Copy from variant-minimal/page.tsx as starting point

Design direction: {describe the style}
Key features:
- {feature 1}
- {feature 2}
- {feature 3}

Use the same mock data (MOCK_EDITED_JOB) but completely redesign the UI.
Do NOT use production ResultPreview component - build custom UI.
```

### Example Prompts:

```
Create variant-magazine/ folder and page.tsx:
- Magazine-style layout (like Vogue)
- Two-column: image left, content right
- Elegant serif typography
- Muted color palette (beige, cream, black)
- Minimal buttons with underline hover effects
```

```
Create variant-kids.tsx:
- Super playful and colorful
- Large emoji reactions
- Rainbow gradients
- Bouncy animations
- Comic sans-like font
- Stars/confetti decorations
```

```
Create variant-professional.tsx:
- Clean corporate look
- Sidebar navigation
- Detailed metadata table
- Muted blues and grays
- Professional button styles
```

---

## Picking a Winner & Porting to Production

### Step 1: Compare Variants

Open in multiple tabs:
- `/dev/coloring-page-preview` (original)
- `/dev/coloring-page-preview/variant-cards`
- `/dev/coloring-page-preview/variant-minimal`
- `/dev/coloring-page-preview/variant-{yours}`

### Step 2: Pick Winner

Let's say you choose `variant-cards` - it's perfect!

### Step 3: Port to Production

**Option A: Replace ResultPreview entirely**

```typescript
// apps/web/components/workspace/result-preview.tsx

export function ResultPreview({ job, onReset, onEditJobCreated }: ResultPreviewProps) {
  // Copy all the JSX from variant-cards.tsx
  // Paste it here
  // Update to use props (job, onReset, onEditJobCreated) instead of mock data
}
```

**Option B: Extract as new component**

```typescript
// apps/web/components/workspace/result-preview-v2.tsx
// Copy entire variant-cards.tsx code, convert to use real props

// Then in workspace-right-pane.tsx:
import { ResultPreviewV2 } from './result-preview-v2'

// Use the new component
<ResultPreviewV2 job={data.currentJob} onReset={reset} />
```

### Step 4: Clean Up

Once ported to production, you can:
- Delete old variants
- Keep them as reference
- Archive in `/dev/archive/` folder

---

## Quick Reference: Variant File Structure

```typescript
/**
 * VARIANT: {Name}
 * Description of the design approach
 */

'use client'

import { /* components */ } from '@/components/...'
import type { Job } from '@coloringpage/types'

interface JobWithDownloads extends Job {
  download_urls?: {
    edge_map?: string
    pdf?: string
    [key: string]: string | undefined
  }
}

// Always use the same mock data
const MOCK_EDITED_JOB: JobWithDownloads = {
  id: 'mock-job-edited-001',
  user_id: 'dev-user',
  status: 'succeeded',
  params_json: {
    complexity: 'simple',
    line_thickness: 'medium',
    edit_parent_id: 'mock-job-original-001',
    edit_prompt: 'Make it more detailed with additional characters'
  },
  created_at: new Date(Date.now() - 60000).toISOString(),
  started_at: new Date(Date.now() - 50000).toISOString(),
  ended_at: new Date(Date.now() - 44000).toISOString(),
  download_urls: {
    edge_map: '/assets/peppa-and-chase-holding-hands.png',
    pdf: '/assets/peppa-and-chase-holding-hands.png'
  }
}

export default function {Variant}Page() {
  const job = MOCK_EDITED_JOB

  // Your completely custom layout here!
  return (
    <div>
      {/* Any design you want */}
    </div>
  )
}
```

---

## Summary

| Question | Answer |
|----------|--------|
| Can I change colors? | ✅ Yes, completely |
| Can I change layout? | ✅ Yes, any structure |
| Can I use different components? | ✅ Yes, build custom UI |
| Can I add animations? | ✅ Yes, any CSS/Framer Motion |
| Can I change typography? | ✅ Yes, any fonts/sizes |
| Do changes affect production? | ❌ No, variants are isolated |
| How many variants can I make? | ♾️ Unlimited |
| Which one should I pick? | The one that tests best with users! |

**The key point**: Variants are **sandboxes** for experimentation. Build 5 completely different designs, show them to users/stakeholders, then port the winner to production.

You have **total freedom** in the variant files! 🎨
