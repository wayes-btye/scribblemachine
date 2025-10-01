# Overview
This document maps the end‑to‑end flow for creating a coloring page and describes what is visible on each screen. There are two entry paths: **Upload Photo** and **Imagine Idea**. After **Upload Photo → 1.2**, the flow merges and screens look functionally identical to the **Imagine Idea** path (generation, edit, versioning, download).

---

## Step 0 — Landing (No option selected)
**Filename:** `0_No-option-selected.png`

**Purpose:** Starting point where the user chooses how to create a coloring page.

**What’s on the UI:**
- Header: *Create Your Coloring Page* with sub‑text.
- Two primary buttons: **Upload Photo** and **Imagine Idea**.
- Right‑side card placeholder: **Share Your Idea** (empty until input).
- Top‑right: credits counter and user avatar.
- Soft pastel background with floating shapes.

---

## Upload Photo Path

### Step 1.1 — Upload Option
**Filename:** `1.1_upload option.png`

**Purpose:** Select and upload an image file to convert into a coloring page.

**What’s on the UI:**
- Tabs/buttons at top: **Upload Photo** (active), **Imagine Idea** (inactive).
- Left card titled **1. Upload Your Image** with drag‑and‑drop area and *Browse Files* button; accepted formats (JPG/PNG/WebP, max 10 MB) and tips.
- Right card titled **Upload an Image** (preview placeholder; shows original image after upload).
- Background and header consistent with Step 0.

### Step 1.2 — Image Uploaded & Choose Style
**Filename:** `1.2_Image-uploaded.png`

**Purpose:** Confirm the uploaded image and select generation parameters.

**What’s on the UI:**
- Right panel shows **Original Image** preview (example: dog on a boat).
- Left panel **Choose Your Style**:
  - **Complexity Level:** Simple / Standard (active) / Detailed with age guidance.
  - **Line Thickness:** Thin / **Medium (active)** / Thick with px hints.
- **Generate Coloring Page** button with note that it will use 1 credit.
- Subtle success banner: *Image uploaded successfully • Ready for processing*.

> **From here, the Upload path uses the same sequence and UI patterns as the Imagine path (generation, result, edit, timeline, download).**

---

## Imagine Idea Path

### Step 2.1 — Imagine Idea: Describe & Configure
**Filename:** `2.1_Imagine-idea-selected.png`

**Purpose:** Enter a text prompt and choose style before generation.

**What’s on the UI:**
- **Describe Your Idea** textarea with placeholder suggestions (e.g., “A friendly dinosaur in a garden with flowers…”).
- **Complexity Level:** Simple / **Standard (selected)** / Detailed.
- **Line Thickness:** Thin / **Medium (selected)** / Thick.
- **Generate Coloring Page** button (1 credit) at the bottom.
- Right‑side **Share Your Idea** preview panel (empty until generation).

### Step 2.2 — Generation Progress
**Filename:** `2.2_imagine-loading.png`

**Purpose:** Show progress while the coloring page is being created.

**What’s on the UI:**
- Center card **Generation Progress** with animated loader.
- Status messages (e.g., *Getting Ready*, *Creating something special usually takes 6–12 seconds*).
- **Job ID** and **Parameters** (e.g., Standard • Medium).
- Tooltip near mode tabs: *Finish current task to switch modes*.

### Step 2.3 — Generated Result (First Version)
**Filename:** `2.3_imagine-idea-generated.png`

**Purpose:** Display the initial generated coloring page and offer editing & download.

**What’s on the UI:**
- Large preview of the **Generated Coloring Page**.
- **Generation Details** panel (Complexity, Line Thickness, Processing Time, Job ID).
- **Edit This Page** section with a single text input: “Describe what you’d like to change…” and an **Edit Coloring Page (1 credit)** button. Indicator shows remaining edits (e.g., *2 edits remaining*).
- **Download Image** and **Export PDF** buttons; **Share** and **Print** options; **Printing Tips** panel.

### Step 2.4 — Editing In Progress
**Filenames:**
- `2.4_imagine-idea-editting-(no-scroll-page-view).png`
- `2.4_imagine-idea-editting.png`

**Purpose:** Show the apply‑changes state after submitting an edit request.

**What’s on the UI:**
- **Edit Progress** card with loader and text like *Applying changes…*.
- Secondary progress card with **Creating Magic** status, **Job ID**, **Parameters**, and friendly progress copy.

### Step 2.5 — Edited Result
**Filename:** `2.5_imagine-idea-editted.png`

**Purpose:** Display the updated coloring page reflecting the edit request.

**What’s on the UI:**
- **Edited Coloring Page** preview.
- **Edit Details** card summarizing the request (e.g., “add some stars in the background”), plus Complexity, Line Thickness, Processing Time, Job ID.
- **Edit This Page** input for further tweaks (remaining edits count shown).
- **Download Image** / **Export PDF** / **Share** / **Print** / **Printing Tips**.

### Step 2.6 — Edited Result with Version Timeline
**Filename:** `2.6_imagine-idea-editted-show-timeline.png`

**Purpose:** Visualize the page’s evolution and switch between versions.

**What’s on the UI:**
- Header shows **Edited Coloring Page** with *Show/Hide Timeline* toggle and a **Complete** state.
- **Version Timeline** panel listing **Original** and subsequent **Edits** with thumbnails, timestamps, and navigation (**Prev/Next**) between versions.
- Active version preview centered; edit notes visible for the selected version.
- Remaining edits indicator and the same **Download/Export** actions available.

---

## Flow Summary
1. **Landing (Step 0)** → choose **Upload Photo** or **Imagine Idea**.
2. **Upload Photo path:** Upload (1.1) → Configure Style (1.2) → **merge** into shared flow.
3. **Imagine Idea path:** Prompt & Configure (2.1) → Generate (2.2) → Result (2.3) → Edit Progress (2.4) → Edited Result (2.5) → Version Timeline (2.6).
4. **Shared flow after 1.2:** Same as 2.2 → 2.6 (progress → result → edit → timeline → download/export).

