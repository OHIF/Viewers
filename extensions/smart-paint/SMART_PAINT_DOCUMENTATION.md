# Smart Paint — Complete Tool Documentation

> **Extension:** `extensions/smart-paint/`
> **Route:** `/smart-paint`
> **Panel:** `src/panels/PanelSmartPaint.tsx`
> **Engine:** `src/tools/SmartPaintTool.ts`

---

## 1. What Is Smart Paint?

Smart Paint is a **freehand brush ROI (Region of Interest) drawing tool** for medical images.
A doctor loads a DICOM screenshot or any medical image, then paints directly over a region of
interest — for example a tumor, lesion, organ boundary, or abnormal tissue. The painted region
is stored as a binary mask and can be converted to a precise contour boundary.

### Who Uses It and Why

| User | Use Case |
|---|---|
| Radiologist | Mark suspected lesion boundary for reporting |
| Oncologist | Delineate tumor region to track size over time |
| Surgeon | Annotate pre-operative planning images |
| Researcher | Create ground-truth segmentation masks for AI training |

Smart Paint removes the need for external annotation tools — the doctor works directly inside
the OHIF Viewer interface.

---

## 2. Libraries Used

No new npm packages were installed. All libraries are browser built-ins or already in the OHIF monorepo.

| Library | Source | Used For |
|---|---|---|
| **React** | OHIF existing | UI state management (`useState`, `useRef`, `useCallback`, `useEffect`) |
| **TypeScript** | OHIF existing | Type safety for `SmartPaintConfig`, `PaintState`, mask arrays |
| **HTML5 Canvas 2D API** | Browser built-in | Two stacked canvases: base image + transparent paint overlay |
| **FileReader API** | Browser built-in | Reading the uploaded image file into a data URL |
| **HTMLImageElement** | Browser built-in | Loading and rendering the decoded image onto the base canvas |
| **Uint8ClampedArray** | Browser built-in | Compact 1-bit-per-pixel binary mask storage |
| **ImageData API** | Browser built-in | Reading per-pixel RGB values (for sensitivity region-grow) and writing colored overlay |
| **Tailwind CSS** | OHIF existing | All UI styling |
| **SVG (inline)** | Browser built-in | Custom circular brush cursor drawn as SVG data URL |

---

## 3. Canvas Architecture — How It Works

Smart Paint uses **two stacked HTML5 canvases** positioned absolutely on top of each other:

```
┌───────────────────────────────────────┐
│  overlayRef  (transparent canvas)     │  ← top layer: user draws here
│  ┌─────────────────────────────────┐  │     receives mouse events
│  │  canvasRef  (base canvas)       │  │  ← bottom layer: medical image drawn here
│  └─────────────────────────────────┘  │     read-only for pixel color sampling
└───────────────────────────────────────┘
```

### Why Two Canvases?

- The **base canvas** holds the original medical image. It is only written once on file load.
  Its pixel data is read (via `getImageData`) to check pixel color during sensitivity-based painting.
- The **overlay canvas** receives all mouse events and is redrawn every paint stroke.
  It shows the semi-transparent colored mask and extracted contours.
- This separation means the original image is never damaged by the painting operation.

### Canvas Coordinate System

```
(0,0) ─────────── x+
  │
  │
  y+
```

All coordinates are in canvas pixel space. The overlay canvas is sized to exactly match
the base canvas (`canvas.width × canvas.height`), so coordinates map 1:1.

The overlay does **not** apply a CSS/display scaling fix because `getPos()` subtracts
`rect.left / rect.top` directly — the overlay is always rendered at exactly 1:1 scale
within the scrollable container.

---

## 4. Internal Engine — SmartPaintTool.ts

The engine is a stateless module (no React class). State is stored in a `Map<imageKey, PaintState>`.

### PaintState Structure

```typescript
interface PaintState {
  mask: Uint8ClampedArray;        // flat array, width × height entries. 0 = unpainted, 1 = painted
  width: number;                  // canvas width in pixels
  height: number;                 // canvas height in pixels
  history: Uint8ClampedArray[];   // full mask snapshots for undo/redo
  historyIndex: number;           // current position in history stack
}
```

One `PaintState` exists per image key (`filename + timestamp`). Switching images does not
erase the other image's mask.

---

## 5. Tools — Purpose, Library, Formula

---

### 5.1 Upload Image

**Purpose:** Load a PNG, JPG, or BMP medical image (DICOM screenshot) onto the base canvas.

**Libraries used:**
- `FileReader` (Web API) — reads the file from disk as a base64 data URL
- `HTMLImageElement` — decodes the data URL into a drawable image
- `CanvasRenderingContext2D.drawImage()` — renders the image onto the base canvas

**How it works:**
```
File  →  FileReader.readAsDataURL()  →  base64 string
      →  new Image().src = base64    →  HTMLImageElement
      →  ctx.drawImage(img, 0, 0, w, h)  →  shown on canvas
```

**Scaling formula** (image is scaled to fit max 900×600 while maintaining aspect ratio):
```
scale = min(1,  900 / img.width,  600 / img.height)
w = round(img.width  × scale)
h = round(img.height × scale)
```

**For the doctor:** After uploading, the image appears at full quality. The doctor then uses
the painting tools to mark regions without needing any external software.

---

### 5.2 Paint / Erase Toggle

**Purpose:** Switch between adding paint (marking a region) and erasing paint (removing a mistake).

**Library:** React `useState` — `eraseMode: boolean`

**Behavior:**
- **Paint mode (default):** Mouse strokes set mask pixels to `1` (painted)
- **Erase mode:** Mouse strokes set mask pixels to `0` (unpainted)

The `paintBrush()` function receives the `erase` flag:
```typescript
mask[y * width + x] = erase ? 0 : 1;
```

**For the doctor:** If the painted region accidentally covers healthy tissue, switch to
Erase mode and paint over the mistake to remove it precisely.

---

### 5.3 Brush Size

**Purpose:** Controls the radius of the circular paint brush in pixels (3–60 px).

**Library:** HTML5 Canvas 2D — circle equation used in `paintBrush()`

**Formula — which pixels are included in one brush stroke:**
```
For each pixel (x, y) within the bounding box of the brush:
  dx = x - center_x
  dy = y - center_y
  if (dx² + dy²) ≤ radius²  →  paint this pixel
```

This is the **circle equation** in discrete pixel space.

**Custom cursor:** The brush cursor is a live SVG circle rendered as a CSS `cursor` data URL,
sized to exactly match the brush radius:
```
cursor: url("data:image/svg+xml;...circle r='{radius}'...") hotspot, crosshair
```

**For the doctor:** Use a **large brush** for fast rough coverage of a large organ.
Use a **small brush** for fine-grained boundary tracing around lesion edges.

---

### 5.4 Sensitivity

**Purpose:** Controls how strictly the brush respects tissue boundaries.
Range: 0% (pure shape brush) → 100% (only paints pixels similar in brightness to the center).

**Library:** `ImageData` API — reads the RGBA pixel value at each position

**Formula — region-grow threshold:**
```
centerPixelBrightness = pixelData[ (cy × width + cx) × 4 ]   (R channel of center pixel)
candidatePixelBrightness = pixelData[ (y × width + x) × 4 ]

diff = |centerPixelBrightness - candidatePixelBrightness|

threshold = sensitivity × 2.55          (maps 0–100% → 0–255 pixel range)

If diff > threshold → skip this pixel (do not paint it)
```

**Sensitivity = 0%:** All pixels within the brush circle are painted regardless of color.

**Sensitivity = 50% (default):** Only pixels within 127 brightness units of the center pixel
are painted. Pixels near a tissue boundary (sharp brightness change) are excluded.

**Sensitivity = 100%:** Only pixels within 255 brightness units are painted (effectively same
as 0% since max difference is 255) — use very low values like 5–20% for tight boundaries.

**For the doctor:** When tracing a bone (bright on X-ray) next to soft tissue (dark),
set sensitivity to ~30%. The brush will automatically stop at the bone edge and avoid
painting soft tissue.

---

### 5.5 2D / 3D Mode Toggle

**Purpose:** Indicates whether the annotation applies to a single slice (2D) or should be
propagated across multiple image slices (3D).

**Current implementation:** Mode label only — 3D propagation requires a DICOM volume data
source (not available in standalone image mode). The flag is stored in `SmartPaintConfig.mode`
and would be passed to a volume segmentation engine in a full DICOM integration.

**For the doctor:**
- **2D mode** — mark a finding on a single slice (e.g., one CT slice)
- **3D mode** — when connected to a full DICOM viewer, would paint the same ROI across all
  slices containing the structure, creating a 3D volumetric segmentation

---

### 5.6 Undo

**Purpose:** Step back one paint operation, restoring the mask to its previous state.

**Library:** `Uint8ClampedArray.set()` — copies a previously saved snapshot back into the active mask

**How it works:**
```
History stack:  [snap0, snap1, snap2, snap3]
                                      ↑ historyIndex = 3  (current)

After Undo:     [snap0, snap1, snap2, snap3]
                               ↑ historyIndex = 2
                mask.set(history[2])   → mask is restored to snap2
```

History is saved after each **mouse-up** event (end of a brush stroke), not after every pixel.
Maximum 50 history entries are kept.

**For the doctor:** If the last brush stroke accidentally covered the wrong area, click Undo
to instantly remove exactly that stroke.

---

### 5.7 Redo

**Purpose:** Re-apply an operation that was undone.

**How it works:**
```
After Undo, historyIndex = 2:
  Redo → historyIndex = 3
         mask.set(history[3])  → mask restored to snap3
```

Forward history is discarded if a new paint stroke is made after an undo.

---

### 5.8 Clear

**Purpose:** Erase the entire painted mask for the current image.

**Formula:**
```typescript
state.mask.fill(0)   // sets all entries in the Uint8ClampedArray to 0
commitHistory(state) // saves the cleared state as a new undo checkpoint
```

---

### 5.9 Extract Contour

**Purpose:** Converts the binary painted mask into a set of boundary points (contour line)
tracing the edge of the painted region. The contour is drawn as a cyan line on the overlay.

**Library:** HTML5 Canvas 2D — `ctx.beginPath()`, `ctx.lineTo()`, `ctx.stroke()`

**Algorithm — simplified marching squares / edge detection:**
```
For every 2×2 block of pixels (x,y), (x+1,y), (x,y+1), (x+1,y+1):
  tl = mask[y][x]
  tr = mask[y][x+1]
  bl = mask[y+1][x]
  br = mask[y+1][x+1]
  sum = tl + tr + bl + br

  If sum > 0 AND sum < 4:
    This block is on the BOUNDARY (partially painted)
    → add center point (x+0.5, y+0.5) to contour
```

A block where `sum = 0` is fully outside the painted region.
A block where `sum = 4` is fully inside the painted region.
Any other value means it straddles the boundary → contour point.

**For the doctor:** After painting a lesion, click Extract Contour to get the precise
boundary line. This contour can be:
- Visually inspected for accuracy
- Exported as JSON coordinates for further analysis
- Used as a segmentation mask reference in reports

---

### 5.10 Clear Contours

**Purpose:** Remove the drawn contour lines from the overlay without removing the painted mask.

Useful when the doctor wants to re-extract after refining the painted area.

---

## 6. Mask Overlay Rendering

**Library:** `ImageData` API, `CanvasRenderingContext2D.putImageData()`

**How the colored overlay is created:**
```
1. Create empty ImageData (width × height × 4 RGBA bytes)
2. Parse the fill color (default: rgba(0, 200, 255, 0.35)) → extract R, G, B values
3. For each painted pixel (mask[i] === 1):
     imageData.data[i*4]   = R
     imageData.data[i*4+1] = G
     imageData.data[i*4+2] = B
     imageData.data[i*4+3] = 100   (semi-transparent, ~39% opacity)
4. ctx.putImageData(imageData, 0, 0) → draws all painted pixels at once
```

The alpha value 100/255 ≈ 39% transparency lets the underlying medical image show
through the colored paint, so the doctor can see both the original image and the
painted region simultaneously.

---

## 7. How This Helps Doctors

### Workflow Example — Tumor Delineation

```
1. Doctor receives CT scan screenshots from PACS
2. Opens Smart Paint → uploads the CT image
3. Sets Brush Size = 20px, Sensitivity = 30%
4. Paints over the suspected tumor region
5. Uses Erase to remove any overflow onto healthy tissue
6. Clicks Extract Contour → sees the precise boundary
7. The contour coordinates (JSON) represent the tumor outline
8. Uses measurements to assess extent
```

### Clinical Benefits

| Feature | Clinical Benefit |
|---|---|
| Sensitivity region-grow | Brush respects tissue boundaries automatically |
| Undo/Redo | Safe to experiment — mistakes instantly reversible |
| Semi-transparent overlay | Original image always visible through the mask |
| Contour extraction | Converts painted region to measurable boundary |
| 2D/3D toggle | Ready for integration with volumetric DICOM data |
| No external software | Doctor stays within OHIF Viewer — no workflow disruption |

---

## 8. Right Panel — Status Bar

The status bar (below toolbar) shows live state:
```
Loaded: image.png — select tool and paint
Mode: 2D · Brush: 15px · Sensitivity: 50%  · 1 contour(s)
```

The bottom strip shows contour point counts when contours are extracted:
```
Contours extracted:  [1] 847 points  [2] 312 points
```

---

## 9. File Location Summary

| File | Purpose |
|---|---|
| `src/panels/PanelSmartPaint.tsx` | React UI — toolbar, canvas layout, event handlers |
| `src/tools/SmartPaintTool.ts` | Paint engine — mask storage, brush, undo/redo, contour |
| `src/index.tsx` | OHIF extension registration |
| `package.json` | Extension package declaration |

---

*File location: `extensions/smart-paint/SMART_PAINT_DOCUMENTATION.md`*
