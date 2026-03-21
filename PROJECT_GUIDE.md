# Clinical Viewer — Complete Project Guide

This is the full guide for the three clinical tools we built on top of the OHIF medical viewer.
Written in plain language so anyone on the team can understand what was built, how it works, and how to use it.

---

## What Did We Build?

We added three new clinical analysis tools to the existing OHIF medical image viewer:

1. **ECG Viewer** — analyze heart ECG strips, measure QT intervals, calculate heart rate
2. **Smart Paint** — paint/highlight regions on any medical image, measure the painted area
3. **Flatfoot Analysis** — measure foot arch angles on X-rays to detect flat foot or high arch

All three tools open as their own pages inside the app.
You reach them from the main patient list by clicking the colored buttons at the top.

**No new software libraries were installed.** Everything was built using tools already in the project (React, TypeScript, Tailwind CSS, and the browser's built-in Canvas drawing).

---

## How to Run the App

```
1. Open a terminal in the project folder:
   cd /home/artem/Desktop/project/frontend/Viewers

2. Install dependencies (only needed first time):
   yarn install

3. Start the development server:
   yarn dev

4. Open your browser:
   http://localhost:3000
```

If you see a patient/study list on screen, everything is working correctly.

---

## The Three Tools

---

### 1. ECG Viewer

**What it's for:** Analyzing ECG (electrocardiogram) heart tracing images.
You upload a photo or screenshot of an ECG strip, then click on it to measure things like how long the QT interval is, what the heart rate is, and what the electrical axis of the heart is.

**How to open it:** Click the green **ECG Viewer** button on the patient list page.

**What you can measure:**

| What | How many clicks | What you get |
|---|---|---|
| Time interval | 2 clicks | Duration in milliseconds |
| Voltage (amplitude) | 2 clicks | Height in millivolts |
| R-to-R interval | 2 clicks | Heart rate in BPM |
| QT interval + QTc | 2 clicks | QT duration + Bazett-corrected QTc |
| QRS axis | Enter 2 numbers | Heart electrical axis in degrees |
| Side-by-side compare | Upload 2 images | Two ECGs shown together |

**Before measuring:** Use the Calibrate tools first. Calibrate H sets how many pixels = 1 millisecond. Calibrate V sets how many pixels = 1 millivolt. Without calibration the measurements will be off.

**Normal values to know:**
- QTc: normal is under 440ms for men, under 460ms for women
- Heart rate: normal resting is 60–100 BPM
- QRS axis: normal is between -30° and +90°

**Recent improvements:**
- Measurement labels are now smaller and less cluttered (font reduced to ~12px)
- ECG images display sharper and clearer (high-quality image smoothing enabled)
- Supports higher-resolution images (canvas now up to 1800×1200 pixels)

---

### 2. Smart Paint

**What it's for:** Painting / highlighting a region on any medical image.
Imagine using a digital brush to color over a specific area — the tool then tells you exactly how big that painted area is in pixels.

**How to open it:** Click the cyan **Smart Paint ROI** button on the patient list page.

**How to use it:**
1. Click **Upload Image** — select any PNG, JPG, or BMP medical image
2. Choose **Paint** or **Erase** mode
3. Adjust **Brush size** (how big your brush is) and **Sensitivity** (how selective the brush is — higher sensitivity paints only similar-looking pixels)
4. Click and drag over the image to paint
5. The **painted area** shows automatically below the canvas
6. Press **Undo** / **Redo** to fix mistakes
7. Press **Extract Contour** to trace the outline of the painted region

**Area measurement:**
As you paint, a badge appears below the image showing:
```
Painted Area: 12,345 px²
```
This updates live with every brush stroke.

**Segment colors:**
On the right side panel you can create named segments (like "Region A", "Region B") each with its own color. Selecting a segment changes the brush color. This is useful when you need to mark multiple different regions on the same image.

**Recent improvements:**
- Live area display added — shows painted pixel count below the canvas and in the status bar
- Panel icon changed to a segmentation icon to better represent what the tool does

---

### 3. Flatfoot Analysis

**What it's for:** Measuring the foot arch from a lateral (side-view) X-ray.
Doctors use this to determine if a patient has flat feet (Pes Planus), a normal arch, or a high arch (Pes Cavus).

**How to open it:** Click the amber **Flatfoot Analysis** button on the patient list page.

**Important:** Before measuring, click **Calibrate** and mark a known distance on the X-ray (like a ruler or implant). This tells the tool how many pixels equal 1 millimeter, making all measurements accurate.

**All available tools:**

---

#### Cursor
Just for looking at the image. No measurements are placed when this is active.

---

#### Distance
Click 2 points → get the straight-line distance in millimeters.
Use this to measure foot length, bone lengths, or any segment.

---

#### Calcaneal Pitch
Click 2 points along the bottom of the heel bone → get the heel angle.

| Angle | Meaning |
|---|---|
| Less than 17° | Possibly flat foot |
| 17° to 32° | Normal |
| More than 32° | Possibly high arch |

---

#### Clarke's Angle
Click 3 points: heel → arch top → ball of foot → get the arch angle.

| Angle | Meaning |
|---|---|
| Less than 42° | Flat arch |
| 42° to 54° | Normal |
| More than 54° | High arch |

---

#### Arch Index
Click 2 points: back of heel → tip of longest toe → get the Arch Index ratio.

| Index | Meaning |
|---|---|
| Less than 0.21 | High arch |
| 0.21 to 0.26 | Normal |
| More than 0.26 | Flat foot |

---

#### Meary's Angle
Click 4 points: 2 along the talus bone → 2 along the first metatarsal → get the angle between them.
This is one of the most reliable measurements for diagnosing flat foot.

| Angle | Meaning |
|---|---|
| Less than 4° | Normal alignment |
| 4° to 15° | Mild flat foot |
| 15° to 30° | Moderate flat foot |
| More than 30° | Severe flat foot |

---

#### Triangle (NEW)
Click 3 corner points to form a triangle.
The tool automatically calculates:
- All 3 interior angles (they always add up to 180°)
- A midpoint marker on each side of the triangle
- The area of the triangle in mm²

This is useful for measuring any triangular bone region or joint space.

After placing the 3 corners you can **drag any point** to fine-tune the triangle — all angles and area update instantly.

Example result: `∠1=45°  ∠2=90°  ∠3=45° | 312.4 mm²`

---

#### Split Triangle (NEW)
This works like a combination of Arch Index (a baseline) and a triangle.

1. Click **Point 1** → start of your baseline
2. Click **Point 2** → end of your baseline
3. Click **Point 3** → the apex (the top point above the line)

The tool drops a perpendicular line from the apex down to the baseline. This creates two smaller triangles side by side. All 6 angles (3 per triangle) are shown.

A right-angle symbol (∟) appears where the perpendicular meets the baseline.

**Why this is useful:** You can see exactly how a triangular region is divided by a vertical reference line — useful for analyzing how weight or force is distributed across a bone region.

After placing the 3 points, **all 4 dots are draggable**:
- Drag A or B to move the baseline
- Drag C to move the apex
- Drag D (the perpendicular foot) to shift the split point independently

Example result:
`T1: ∠A=60° ∠D=90° ∠C=30° (145mm²) | T2: ∠D=90° ∠B=45° ∠C=45° (145mm²)`

---

#### Dragging Points (ALL tools)

Every dot placed on the canvas — for any tool — can be dragged after placing it.

- **Hover** over a dot → your cursor changes to a hand symbol
- **Click and hold** → drag to the new position
- **Release** → the measurement recalculates instantly

This means you don't have to redo a measurement if you placed a point slightly off. Just drag it to the right spot.

---

### Summary of Flatfoot Normal Ranges

| Measurement | Flat Foot | Normal | High Arch |
|---|---|---|---|
| Calcaneal Pitch | < 17° | 17°–32° | > 32° |
| Clarke's Angle | < 42° | 42°–54° | > 54° |
| Arch Index | > 0.26 | 0.21–0.26 | < 0.21 |
| Meary's Angle | > 4° | < 4° | < 4° |

---

## How Each Tool Page is Structured

Each of the three tools opens as its own page with:
- A **Back to Worklist** button at the top left to return to the patient list
- A **toolbar** across the top with all the tool buttons
- A **canvas area** in the middle where you work on the image
- A **results panel** on the right (for ECG and Flatfoot) showing all measurements

---

## How the App Was Extended (For Developers)

### The Three New Extensions

Each tool is built as a separate "extension" — a self-contained module that plugs into the OHIF viewer.

```
extensions/ecg-tools/     ← ECG Viewer extension
extensions/smart-paint/   ← Smart Paint extension
extensions/flatfoot/      ← Flatfoot Analysis extension
```

Each extension has:
- A panel component (the main UI you see)
- A utility/tool file (the math and logic)
- An `index.tsx` that registers the extension with OHIF

### How Pages Are Wired Up

Three new pages (routes) were added to the app:

| Web address | What it shows |
|---|---|
| `/ecg-viewer` | ECG Viewer page |
| `/smart-paint` | Smart Paint page |
| `/flatfoot` | Flatfoot Analysis page |

### How Measurements Work on Canvas

All three tools draw on an HTML Canvas element. The key technical point:

When a canvas is displayed smaller than its actual resolution (because of CSS), click positions need to be converted. If you click at CSS position (100, 50) but the canvas is twice as big internally, the actual canvas position is (200, 100). All three tools apply this correction.

### How Smart Paint's Brush Works

The brush stores a "mask" — a grid of 1s and 0s the same size as the image. When you paint, pixels within the brush radius get set to 1. When you erase, they go back to 0. The `countPaintedPixels` function simply counts all the 1s in this grid to give you the area.

The tool keeps a history of up to 50 mask snapshots so Undo and Redo work reliably.

### How the Triangle Math Works

**Regular Triangle:** Uses the Law of Cosines to find each angle.
Given sides a, b, c opposite to corners A, B, C:
- Angle at A = arccos((b² + c² − a²) / (2bc))
- Repeat for B and C
- Area = half the cross-product of two edge vectors

**Split Triangle:** Finds the point D on line AB that is closest to C (the foot of the perpendicular). This is a standard dot-product projection: move along AB by exactly the amount that brings you directly below C.
- D = A + t × (B − A), where t = dot(C−A, B−A) / dot(B−A, B−A)
- D is then stored as a fourth point so it can be dragged freely

### How Dragging Works

Each measurement stores its points in a list. When the user holds the mouse button near a point (within 12 pixels), the app records which measurement and which point index is being dragged. As the mouse moves, that point's position updates and the measurement value recalculates. When the mouse is released, dragging stops.

A separate flag (`hasDraggedRef`) prevents the app from accidentally placing a new point when the user releases after a drag.

---

## Bug That Was Fixed at the Start

When the app first ran, it crashed with this error:

```
TypeError: isWhitelisted is not a function
```

This happened because two language-related libraries were out of sync — one had removed a function the other still expected. The fix was to inject that missing function back in, right before it was needed. This is called a "monkey patch" — a temporary bridge between two incompatible versions.

---

## Quick Reference — What Goes Where

| I want to... | Open this page |
|---|---|
| Measure QT interval / heart rate | ECG Viewer (`/ecg-viewer`) |
| Paint a region and measure its size | Smart Paint (`/smart-paint`) |
| Check for flat foot on an X-ray | Flatfoot Analysis (`/flatfoot`) |
| Measure a triangle of bone | Flatfoot → Triangle tool |
| Split a region with a perpendicular | Flatfoot → Split Triangle tool |
| Move a measurement point I placed | Hover over it and drag |

---

*Built on OHIF Viewer v3 · Branch: release/3.12 · No new npm packages required*
