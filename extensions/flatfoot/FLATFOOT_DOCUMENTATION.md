# Flatfoot Analysis — Complete Tool Documentation

> **Extension:** `extensions/flatfoot/`
> **Route:** `/flatfoot`
> **Panel:** `src/panels/PanelFlatfoot.tsx`
> **Calculations:** `src/utils/flatfootCalculations.ts`

---

## 1. What Is the Flatfoot Analysis Tool?

The Flatfoot Analysis tool is a **clinical foot X-ray measurement module** for assessing
the longitudinal arch of the foot. A podiatrist, orthopaedic surgeon, or radiologist uploads
a **lateral weight-bearing foot X-ray** and uses precise measurement tools to compute
clinical angles and indices that classify the patient's arch type.

### Conditions Diagnosed

| Condition | Also Known As | Description |
|---|---|---|
| **Normal Arch** | — | Healthy medial longitudinal arch |
| **Pes Planus** | Flat foot | Arch is collapsed; heel and forefoot touch the ground |
| **Pes Cavus** | High arch | Arch is excessively elevated; increased loading at heel and ball |

### Who Uses It and Why

| User | Use Case |
|---|---|
| Podiatrist | Assess arch height, prescribe orthotics |
| Orthopaedic surgeon | Pre-operative planning for calcaneal osteotomy, tendon transfer |
| Radiologist | Report foot X-ray measurements objectively |
| Physiotherapist | Track arch changes over rehabilitation |
| Researcher | Collect population-level arch measurement data |

---

## 2. Libraries Used

No new npm packages were installed. All libraries are browser built-ins or already in the OHIF monorepo.

| Library | Source | Used For |
|---|---|---|
| **React** | OHIF existing | UI state (`useState`, `useRef`, `useCallback`, `useEffect`) |
| **TypeScript** | OHIF existing | Type safety for `MeasureTool`, `Measurement`, `Point` |
| **HTML5 Canvas 2D API** | Browser built-in | Rendering X-ray image, drawing measurement overlays |
| **FileReader API** | Browser built-in | Reading the uploaded image file as a data URL |
| **HTMLImageElement** | Browser built-in | Decoding the image and drawing it onto the canvas |
| **`getBoundingClientRect()`** | Browser built-in | CSS→pixel coordinate conversion (scaling fix) |
| **`Math` (atan2, acos, sqrt, abs)** | Browser built-in | All clinical angle calculations |
| **Tailwind CSS** | OHIF existing | All UI styling |

---

## 3. Canvas Architecture — How It Works

The Flatfoot tool uses a **single HTML5 canvas** that fills its container div.

```
┌────────────────────────────────────────────────────────┐
│  canvasRef                                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │  Foot X-ray image (drawImage)                    │  │
│  │  + Saved measurements (lines, dots, labels)      │  │
│  │  + Active polygon preview (dashed preview line)  │  │
│  │  + Pending points for current tool               │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Canvas Sizing

The canvas dynamically fills its parent container, maintaining the image aspect ratio:
```typescript
const fitScale = Math.min(
  containerWidth  / image.width,
  containerHeight / image.height,
  1              // never upscale beyond original size
);
canvas.width  = round(image.width  × fitScale × zoom);
canvas.height = round(image.height × fitScale × zoom);
```

### Coordinate Scaling Fix

Same critical fix as ECG Viewer — the canvas may be displayed at a different CSS size
than its actual pixel dimensions:
```typescript
const rect = canvas.getBoundingClientRect();
const scaleX = canvas.width  / rect.width;
const scaleY = canvas.height / rect.height;
const x = (e.clientX - rect.left) * scaleX;
const y = (e.clientY - rect.top)  * scaleY;
```

Without this fix, measurement points would land at incorrect positions on zoomed or
resized canvases.

### Full Redraw on Every Change

The canvas is fully redrawn whenever any state changes:
1. `ctx.clearRect()` — clear canvas
2. `ctx.drawImage(image, 0, 0)` — redraw X-ray
3. `measurements.forEach(m => drawMeasure(ctx, m))` — all saved measurements
4. Draw live polygon preview (if Area Polygon tool is active with points)
5. Draw pending points for fixed-point tools

---

## 4. Calibration

**Default:** `pxPerMm = 3.78` (96 DPI screen assumption)

**Manual calibration:**
1. Click **Calibrate** in the toolbar
2. Enter a known distance in mm (e.g., `10` mm for a known ruler mark on the X-ray)
3. Click two points that span that known distance

```
d = √( (x₂−x₁)² + (y₂−y₁)² )    (pixel distance)
pxPerMm = d / knownMm
```

Once calibrated, **Distance** and **Area Polygon** results are shown in real mm and mm²
instead of pixel units.

---

## 5. Tools — Purpose, Library, Formula

---

### 5.1 Area Polygon (Shoelace)

**Purpose:** Measure the enclosed area of any region defined by clicking multiple boundary
points. Used to estimate contact area of the foot, lesion area, or any region of interest.

**Libraries used:**
- Canvas 2D: `beginPath`, `lineTo`, `closePath`, `fill`, `stroke` — polygon fill and outline
- Canvas 2D: `arc` — numbered vertex dots
- Canvas 2D: `fillText` — area label at centroid
- `Math.abs()` — ensures positive area result

**How to use:**
1. Select **⬡ Area** (active by default)
2. Click multiple points around the boundary of the region
3. A live preview shows the polygon and current area in mm²
4. Click **✓ Finish & Save** when done (minimum 3 points required)

**Formula — Shoelace (Gauss's area formula):**
```
Given n vertices: (x₀,y₀), (x₁,y₁), ..., (xₙ₋₁,yₙ₋₁)

Area_px² = |  Σᵢ₌₀ⁿ⁻¹ ( xᵢ × yᵢ₊₁  −  xᵢ₊₁ × yᵢ )  | / 2

Where indices wrap: yₙ = y₀, xₙ = x₀
```

**Converting to mm²:**
```
Area_mm² = Area_px² / (pxPerMm)²
```

**Why "Shoelace"?** The formula resembles cross-multiplying shoe-lace style — multiply
each xᵢ by the next yᵢ₊₁, subtract the reverse, sum up, halve.

**For the doctor:** Draw around the foot contact area on a footprint image to measure
total contact area in mm². Compare with normal reference values to quantify degree of
flat foot. Useful for pre/post surgical comparison.

---

### 5.2 Distance

**Purpose:** Measure the straight-line distance between any two points in mm.
Used for bone lengths, gap measurements, and deformity extents.

**Libraries used:**
- `flatfootCalculations.ts → pixelDistance()` — Euclidean distance
- `Math.sqrt`, `Math.pow`

**How to use:**
1. Select **Distance**
2. Click **Point 1**
3. Click **Point 2**

**Formula — Euclidean distance:**
```
d_px = √( (x₂−x₁)² + (y₂−y₁)² )

d_mm = d_px / pxPerMm
```

**Output:** `X.X mm`

**For the doctor:** Measure metatarsal lengths, calcaneus height, talus-to-navicular
gap, or any linear anatomical distance needed for surgical planning or orthotic prescription.

---

### 5.3 Calcaneal Pitch

**Purpose:** Measures the angle between the inferior border of the calcaneus and the
horizontal reference (floor). This is the primary indicator of heel tilt and arch height.

**Libraries used:**
- `flatfootCalculations.ts → calcanealPitchAngle()` — atan2 calculation
- `Math.atan2()` — two-point angle

**How to use:**
1. Select **Calcaneal Pitch**
2. Click **Point 1:** Posterior-inferior calcaneus (back-bottom of heel bone)
3. Click **Point 2:** Anterior-inferior calcaneus (front-bottom of heel bone, at plantar fascia origin)

**Formula:**
```
dx = P2.x − P1.x
dy = P1.y − P2.y    (y inverted: screen y increases downward, so subtract to get upward = positive)

angle = atan2(dy, dx) × (180 / π)
result = round(|angle|)            (absolute value — direction handled by normal range)
```

**Why `atan2`?** `atan2(dy, dx)` gives the angle of the line P1→P2 in the correct quadrant.
Using screen-coordinate-corrected dy (P1.y − P2.y instead of P2.y − P1.y) means a rising
calcaneal line gives a positive angle, matching the clinical convention.

**Output:** `X° (Normal)` or `X° (Abnormal)`

**Normal range:** 17°–32°

**Interpretation:**

| Calcaneal Pitch | Condition |
|---|---|
| > 32° | Pes Cavus — excessively steep heel = high arch |
| 17°–32° | Normal arch |
| < 17° | Pes Planus — heel nearly horizontal = flat foot |

**For the doctor:** The calcaneal pitch is the most direct single-angle indicator of flat
foot severity. A pitch of 8° would indicate a severely collapsed arch requiring aggressive
intervention (orthotics, surgery).

---

### 5.4 Clarke's Angle (Longitudinal Arch Angle)

**Purpose:** Measures the angle at the apex of the medial longitudinal arch. It reflects
the height and curvature of the arch from heel to first metatarsal head.

**Libraries used:**
- `flatfootCalculations.ts → clarkeAngle()` — dot product / cosine rule
- `Math.acos()`, `Math.sqrt()`, `Math.min/max` (clamping for numerical stability)

**How to use:**
1. Select **Clarke's Angle**
2. Click **Point 1:** Most posterior inferior point of heel (on or near the calcaneus)
3. Click **Point 2:** Highest point of the medial longitudinal arch apex
4. Click **Point 3:** First metatarsal head (base of big toe)

**Formula — Law of Cosines / Dot Product:**
```
Vector v1 = heel → apex  =  (P1.x − P2.x,  P1.y − P2.y)
Vector v2 = ball → apex  =  (P3.x − P2.x,  P3.y − P2.y)

dot  = v1.x × v2.x  +  v1.y × v2.y
|v1| = √(v1.x² + v1.y²)
|v2| = √(v2.x² + v2.y²)

cos(θ) = dot / (|v1| × |v2|)
θ = acos(cos(θ)) × (180 / π)
```

**Clamping:** `Math.min(1, Math.max(-1, cos))` prevents floating-point errors from
causing `acos` to return `NaN` when the value is infinitesimally outside [-1, 1].

**Output:** `X°`

**Normal range:** ≥ 42°

**Interpretation:**

| Clarke's Angle | Condition |
|---|---|
| > 54° | Pes Cavus — high arch, large angle |
| 42°–54° | Normal |
| < 42° | Pes Planus — flat foot, arch has collapsed |

**For the doctor:** Clarke's angle is measured in the mediolateral radiograph and
complements the calcaneal pitch. When combined with Arch Index and Meary's Angle,
a complete picture of the arch pathology is obtained.

---

### 5.5 Arch Index

**Purpose:** A ratio-based measure of foot arch height using the midfoot contact area
relative to total foot length. Originally defined by Cavanagh & Rodgers (1987) using
footprint data; adapted here for X-ray use.

**Libraries used:**
- `flatfootCalculations.ts → archIndex()` — ratio calculation + classification
- `flatfootCalculations.ts → pixelDistance()` — foot length measurement

**How to use:**
1. Select **Arch Index**
2. Click **Point 1:** Posterior heel (most posterior point of calcaneus)
3. Click **Point 2:** Tip of longest toe

The tool measures total foot length. The mid-third of that length (the arch segment)
is automatically set to `totalLength / 3`.

**Formula:**
```
totalLength_px = pixelDistance(P1, P2)
midFootLength_px = totalLength_px / 3       (middle third of foot)

AI = midFootLength_px / totalLength_px
   = (totalLength / 3) / totalLength
   = 0.333 before calibration

With calibration:
  totalLength_mm = totalLength_px / pxPerMm
  midFootLength_mm = totalLength_mm / 3
  AI = midFootLength_mm / totalLength_mm
```

**Note:** In the full Cavanagh & Rodgers method, the midfoot contact length is measured
from an actual footprint. This X-ray adaptation uses the middle third of foot length
as a proxy, giving a normalised ratio regardless of foot size.

**Output:** `AI: X.XXX | Classification`

**Classification:**

| Arch Index | Condition |
|---|---|
| < 0.21 | High Arch — Pes Cavus |
| 0.21–0.26 | Normal Arch |
| > 0.26 | Flat Foot — Pes Planus |

**For the doctor:** The Arch Index is dimensionless (independent of foot size), making it
useful for comparing patients of different sizes and for tracking a single patient over time.

---

### 5.6 Meary's Angle (Talo-First Metatarsal Angle)

**Purpose:** Measures the angle between the long axis of the talus and the long axis
of the first metatarsal on a lateral X-ray. This is the gold standard radiographic
measurement for flatfoot assessment.

**Libraries used:**
- Inline in `PanelFlatfoot.tsx` using vector dot product
- `Math.acos()`, `Math.sqrt()`, `Math.min`

**How to use:**
1. Select **Meary's Angle**
2. Place **4 points** in this order:
   - **P1:** Proximal end of talus axis (posterior talar dome)
   - **P2:** Distal end of talus axis (talar head / navicular articulation)
   - **P3:** Proximal end of 1st metatarsal axis (1st metatarsal base)
   - **P4:** Distal end of 1st metatarsal axis (1st metatarsal head)

**Formula:**
```
Vector v1 = P2 − P1  =  (P2.x−P1.x,  P2.y−P1.y)   → talus long axis direction
Vector v2 = P4 − P3  =  (P4.x−P3.x,  P4.y−P3.y)   → metatarsal long axis direction

dot  = v1.x × v2.x  +  v1.y × v2.y
|v1| = √(v1.x² + v1.y²)
|v2| = √(v2.x² + v2.y²)

cos(θ) = clamp(dot / (|v1| × |v2|), −1, 1)
θ = acos(cos(θ)) × (180 / π)
```

**Output:** `X° (Normal)` or `X° (>4° flatfoot)`

**Interpretation:**

| Meary's Angle | Condition |
|---|---|
| < 4° (apex plantar / dorsal ≤ 4°) | Normal alignment |
| > 4° (apex plantar — talus points down, MT points up) | Pes Planus / flatfoot |
| < −4° (apex dorsal) | Pes Cavus / high arch |

**For the doctor:** Meary's angle is considered the most reliable single radiographic
indicator for flatfoot. Unlike calcaneal pitch (which can vary with patient positioning),
the talo-metatarsal angle directly reflects the deformity at the midfoot collapse point
(usually at the talonavicular or naviculocuneiform joint).

---

### 5.7 Calibrate (Scale Reference)

**Purpose:** Set the pixel-to-millimetre ratio so all Distance and Area measurements
are shown in real clinical units.

**How to use:**
1. Click **Calibrate**
2. Enter the known distance in mm (e.g., a ruler marker on the X-ray)
3. Click the two endpoints of that known distance

**Formula:**
```
d_px = √( (x₂−x₁)² + (y₂−y₁)² )
pxPerMm = d_px / knownMm
```

After calibration, the status bar shows `X.XX px/mm` in the bottom right.

**For the doctor:** Most foot X-rays include a scale marker (e.g., a steel ball of known
size placed next to the foot during imaging). Clicking that marker calibrates all subsequent
measurements to true millimetres.

---

### 5.8 Zoom

**Purpose:** Scale the canvas display to make point placement easier on small or complex X-rays.

**Slider range:** 0.5× to 3.0×

**How it works:**
```
canvas.width  = round(image.width  × fitScale × zoom)
canvas.height = round(image.height × fitScale × zoom)
```

Zoom does not affect measurement accuracy — the coordinate scaling fix adjusts for any
mismatch between display size and canvas pixel dimensions.

**For the doctor:** Zoom in to precisely trace the talus or metatarsal axis on a small
or low-resolution X-ray, then zoom back out to see the full foot.

---

### 5.9 Clear All

Removes all saved measurements and resets the pending/polygon points.
The uploaded image remains. Useful for starting a fresh measurement session.

---

## 6. Right Panel — Measurements Log

Each saved measurement shows:
- **Tool name** in the measurement's color
- **Computed value** (angle in °, distance in mm, AI ratio, area in mm²)
- **× button** — removes that individual measurement

**Normal Ranges reference (always visible at panel bottom):**

| Measurement | Normal Range |
|---|---|
| Calcaneal Pitch | 17°–32° |
| Clarke's Angle | ≥ 42° |
| Arch Index | 0.21–0.26 |
| Meary's Angle | < 4° |

---

## 7. Classification Summary — All Measurements

| Condition | Calcaneal Pitch | Clarke's Angle | Arch Index | Meary's Angle |
|---|---|---|---|---|
| **Pes Cavus** (high arch) | > 32° | > 54° | < 0.21 | < 4° |
| **Normal** | 17°–32° | 42°–54° | 0.21–0.26 | < 4° |
| **Pes Planus** (flat foot) | < 17° | < 42° | > 0.26 | > 4° |

---

## 8. How This Helps Doctors — Clinical Workflow

```
Step 1 — Upload
  Request lateral weight-bearing foot X-ray from PACS or scanner
  Click "Upload X-Ray" → PNG or JPG

Step 2 — Calibrate (Recommended)
  Identify a ruler marker or known anatomical length on the X-ray
  Click Calibrate → enter known mm → click two endpoints
  All subsequent measurements will be in real mm / mm²

Step 3 — Measure (run all 4 key measurements)
  a) Calcaneal Pitch   → 2 points on inferior calcaneus border
  b) Clarke's Angle    → 3 points: heel, arch apex, 1st metatarsal head
  c) Arch Index        → 2 points: posterior heel, tip of longest toe
  d) Meary's Angle     → 4 points: talus axis (2) + metatarsal axis (2)

Step 4 — Optional
  Area Polygon → outline foot contact region or lesion
  Distance     → measure specific bone lengths for surgical planning

Step 5 — Classify
  Compare all 4 results to the Normal Ranges table in the right panel
  If ≥ 2 measurements agree on a classification → confident diagnosis

Step 6 — Document
  Screenshot the viewer with measurements for the clinical report
```

### Example Patient Report

```
Patient X — Lateral Weight-Bearing Foot X-Ray

Calcaneal Pitch:   12°  (< 17° → Pes Planus)
Clarke's Angle:    38°  (< 42° → Pes Planus)
Arch Index:        0.31 (> 0.26 → Pes Planus)
Meary's Angle:     6°   (> 4°  → Pes Planus)

Conclusion: All 4 measurements consistent with Pes Planus (flat foot).
Recommend: Custom orthotics, physiotherapy referral.
           If conservative treatment fails → calcaneal osteotomy consideration.
```

---

## 9. File Location Summary

| File | Purpose |
|---|---|
| `src/panels/PanelFlatfoot.tsx` | React UI — canvas, toolbar, event handlers, polygon tool |
| `src/utils/flatfootCalculations.ts` | Clinical math — arch index, calcaneal pitch, Clarke's, Meary's, distance |
| `src/index.tsx` | OHIF extension registration |
| `package.json` | Extension package declaration |

---

*File location: `extensions/flatfoot/FLATFOOT_DOCUMENTATION.md`*
