# Technical Documentation — Custom Clinical Extensions

> **Project:** OHIF Viewer v3 (monorepo)
> **Branch:** `release/3.12`
> **Last updated:** 2026-03-21

---

## 1. Libraries & Technologies Used

### No New npm Packages Were Installed

All 3 extensions were built **exclusively with libraries already present** in the OHIF monorepo.
No `npm install` or `yarn add` was run.

| Technology | Version (from existing repo) | Used For |
|---|---|---|
| **React** | ^18 | All UI components |
| **TypeScript** | ^5 | All `.tsx` / `.ts` files |
| **Tailwind CSS** | ^3 | All styling (utility classes) |
| **React Router v6** | `useNavigate`, `Link` | Route navigation between pages |
| **HTML5 Canvas 2D API** | Browser built-in | ECG waveform rendering, flatfoot measurement overlays, Smart Paint mask |
| **`@ohif/ui`** | (workspace) | `Button`, `ButtonEnums`, `StudyListExpandedRow` etc. |
| **`@ohif/ui-next`** | (workspace) | `Header`, `Icons`, `ScrollArea`, `Tooltip`, `Onboarding` |
| **`@ohif/core`** | (workspace) | Peer dependency declared in extension package.json |
| **React.lazy + Suspense** | React 18 built-in | Lazy-loading each extension panel into its route |

---

## 2. Folder Structure — New Files Created

```
Viewers/
├── extensions/
│   ├── ecg-tools/                          ← NEW extension
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.tsx
│   │       ├── panels/
│   │       │   └── PanelEcgViewer.tsx      ← Main ECG panel
│   │       └── utils/
│   │           └── ecgCalculations.ts      ← ECG math functions
│   │
│   ├── smart-paint/                        ← NEW extension
│   │   ├── package.json
│   │   └── src/
│   │       ├── index.tsx
│   │       ├── panels/
│   │       │   └── PanelSmartPaint.tsx     ← Smart Paint panel
│   │       └── tools/
│   │           └── SmartPaintTool.ts       ← Brush engine + mask store
│   │
│   └── flatfoot/                           ← NEW extension
│       ├── package.json
│       └── src/
│           ├── index.tsx
│           ├── panels/
│           │   └── PanelFlatfoot.tsx       ← Flatfoot measurement panel
│           └── utils/
│               └── flatfootCalculations.ts ← Clinical math functions
│
├── platform/app/src/routes/
│   ├── EcgViewer/                          ← NEW route folder
│   │   ├── index.js                        ← Re-export
│   │   └── EcgViewer.tsx                   ← Route wrapper + Back button
│   │
│   ├── SmartPaint/                         ← NEW route folder
│   │   ├── index.js
│   │   └── SmartPaintRoute.tsx             ← Route wrapper + Back button
│   │
│   └── Flatfoot/                           ← NEW route folder
│       ├── index.js
│       └── FlatfootRoute.tsx               ← Route wrapper + Back button
│
├── HACKATHON_CHANGES.md
├── FLATFOOT_TOOLS_GUIDE.md
└── TECHNICAL_DOCUMENTATION.md             ← This file
```

---

## 3. Existing Files Modified

| File | What Changed |
|---|---|
| `platform/app/src/routes/index.tsx` | Imported 3 new route components; added 3 entries to `bakedInRoutes` array |
| `platform/app/src/routes/WorkList/WorkList.tsx` | Added 3 clinical tool buttons above the study list |
| `platform/i18n/src/index.js` | Bug fix: monkey-patch for missing `isWhitelisted` method |
| `extensions/ecg-tools/src/panels/PanelEcgViewer.tsx` | Smaller annotation font, higher image quality, larger canvas cap |
| `extensions/smart-paint/src/index.tsx` | Panel icon changed from `tool-freehand-roi` to `tab-segmentation` |
| `extensions/smart-paint/src/tools/SmartPaintTool.ts` | Added `countPaintedPixels()` export |
| `extensions/smart-paint/src/panels/PanelSmartPaint.tsx` | Imports `countPaintedPixels`; shows live area in px² below canvas |
| `extensions/flatfoot/src/panels/PanelFlatfoot.tsx` | Added Triangle tool, Split Triangle tool, drag-to-reposition for all points |

---

## 4. Extension Detail

---

### 4.1 ECG Viewer (`extensions/ecg-tools/`)

**Route:** `/ecg-viewer`
**Panel file:** `extensions/ecg-tools/src/panels/PanelEcgViewer.tsx`
**Math file:** `extensions/ecg-tools/src/utils/ecgCalculations.ts`

#### What it does
Full-featured ECG analysis tool that loads ECG strip images (PNG/JPG) and lets the user place measurement points directly on the canvas.

#### Tools available
| Tool | Color | Formula | Output |
|---|---|---|---|
| Cursor | Blue | — | Inspect only |
| Calibrate H | Amber | `px/ms = pixel_dist / known_ms` | Sets time scale |
| Calibrate V | Green | `px/mV = pixel_dist / known_mV` | Sets amplitude scale |
| Time | Blue | Euclidean distance → ms | Duration in ms |
| Amplitude | Purple | Euclidean distance → mV | Voltage in mV |
| RR Interval | Green | `HR = 60000 / RR_ms` | Heart rate (BPM) |
| QT Interval | Red | distance → ms | QT duration |
| QTc | Orange | Bazett: `QTc = QT / √(RR/1000)` | Corrected QT |
| QRS Axis | Pink | `atan2(aVF_amp, LeadI_amp)` | Axis in degrees |
| Compare | Blue | — | Side-by-side two ECGs |

#### Post-initial improvements
- **Font size:** annotation labels reduced from `14 * √zoom` to `11 * √zoom` (~12px at zoom=1)
- **Image quality:** `ctx.imageSmoothingQuality = 'high'` added before `drawImage` for sharper waveforms
- **Canvas max size:** raised from `MAX_W=1100, MAX_H=700` to `MAX_W=1800, MAX_H=1200`

#### Key technical decisions
- **Canvas coordinate scaling:** `getBoundingClientRect()` returns CSS display size; click coords multiplied by `canvas.width / rect.width` to get actual pixel position.
- State managed with `useReducer` for complex tool/measurement state.

---

### 4.2 Smart Paint (`extensions/smart-paint/`)

**Route:** `/smart-paint`
**Panel file:** `extensions/smart-paint/src/panels/PanelSmartPaint.tsx`
**Engine file:** `extensions/smart-paint/src/tools/SmartPaintTool.ts`

#### What it does
Freehand brush ROI drawing tool. User paints a mask over an uploaded image. Supports undo/redo, sensitivity control, erase mode, contour extraction, and live area measurement.

#### Architecture
```
PanelSmartPaint (React)
  ├── canvasRef         ← displays the loaded image
  ├── overlayRef        ← transparent canvas on top for mask/contour
  └── SmartPaintTool    ← stateful engine (singleton per imageKey)
        ├── paintBrush()          ← fills pixels within brush radius
        ├── commitHistory()       ← saves snapshot to undo stack
        ├── undo() / redo()       ← restores from history stack
        ├── clearMask()           ← resets all painted pixels
        ├── renderMaskOverlay()   ← draws mask pixels onto overlay canvas
        ├── maskToContour()       ← traces boundary of painted region
        └── countPaintedPixels()  ← counts 1-bits in mask for area display
```

#### Area Measurement
After every paint stroke, undo, redo, or clear, `countPaintedPixels(state)` is called inside `renderOverlay`. The pixel count is stored in `paintedPx` state and shown:
- **Below the canvas:** a cyan badge `Painted Area: 12,345 px²` with a color swatch
- **In the status bar:** appended as `Area: 12,345 px²` in cyan

#### Icon
Changed from `tool-freehand-roi` to `tab-segmentation` in `extensions/smart-paint/src/index.tsx`.

---

### 4.3 Flatfoot Measurement (`extensions/flatfoot/`)

**Route:** `/flatfoot`
**Panel file:** `extensions/flatfoot/src/panels/PanelFlatfoot.tsx`
**Math file:** `extensions/flatfoot/src/utils/flatfootCalculations.ts`

#### What it does
Clinical foot X-ray measurement tool for diagnosing flat foot (Pes Planus), high arch (Pes Cavus), and normal arch conditions.

#### Tools & Formulas
| Tool | Points | Formula | Normal Range |
|---|---|---|---|
| ⬡ Area Polygon | 3+ | Shoelace: `A = |Σ(xᵢyᵢ₊₁ − xᵢ₊₁yᵢ)| / 2` | — |
| Distance | 2 | Euclidean: `√((x₂−x₁)² + (y₂−y₁)²)` | — |
| Calcaneal Pitch | 2 | `atan2(Δy, Δx) × 180/π` | 17°–32° |
| Clarke's Angle | 3 | Cosine rule at middle point | ≥ 42° |
| Arch Index | 2 | `AI = mid_third / total_length` | 0.21–0.26 |
| Meary's Angle | 4 | `acos(V1·V2 / (|V1||V2|))` | < 4° |
| Triangle | 3 | Law of cosines (all 3 angles) + cross-product area | — |
| Split Triangle | 3+D | Perpendicular foot projection + law of cosines | — |

#### Triangle Tool (new)
```
Points: A, B, C  (3 corners)
ab = |B−A|,  bc = |C−B|,  ca = |A−C|
∠A = acos((ab²+ca²−bc²)/(2·ab·ca))
∠B = acos((ab²+bc²−ca²)/(2·ab·bc))
∠C = 180 − ∠A − ∠B
area = |cross(B−A, C−A)| / 2
```
Draws: filled triangle, midpoint markers on each side, angle labels pushed outward from centroid, area at centroid.

#### Split Triangle Tool (new)
```
Points: A (line start), B (line end), C (apex)
t = ((C−A)·(B−A)) / |B−A|²    ← clamped [0,1]
D = A + t·(B−A)                ← foot of perpendicular

Triangle 1 = A, D, C   → 3 angles
Triangle 2 = D, B, C   → 3 angles
```
D is stored as `pts[3]` so it can be dragged independently.
Draws: two colored triangles (orange T1, purple T2), dashed C→D line, right-angle mark at D.

#### Drag-to-reposition (new)
All placed points on all tools are draggable:
```
dragRef      = useRef(null)          // { measurementId, pointIdx } while dragging
hasDraggedRef = useRef(false)        // prevents click firing after drag
HIT_RADIUS   = 12                   // canvas-px radius for hit detection

onMouseDown → find nearest point within HIT_RADIUS → set dragRef
onMouseMove → if dragRef set: update point coords, call recomputeValue()
onMouseUp   → clear dragRef
onClick     → skip if hasDraggedRef.current is true
```

`recomputeValue(tool, points)` re-runs the formula for that tool and returns a new value string without creating a new measurement.

#### Classification
| Condition | Calcaneal Pitch | Clarke's | Arch Index | Meary's |
|---|---|---|---|---|
| Pes Cavus (high arch) | > 32° | > 54° | < 0.21 | < 4° |
| Normal | 17°–32° | 42°–54° | 0.21–0.26 | < 4° |
| Pes Planus (flat foot) | < 17° | < 42° | > 0.26 | > 4° |

---

## 5. Routing Architecture

Routes registered in `platform/app/src/routes/index.tsx`:

```typescript
const bakedInRoutes = [
  // ... existing routes ...
  { path: '/ecg-viewer',  children: EcgViewer },
  { path: '/smart-paint', children: SmartPaint },
  { path: '/flatfoot',    children: Flatfoot },
];
```

Each route wrapper pattern:
```tsx
export default function XRoute() {
  const navigate = useNavigate();
  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <div className="flex items-center border-b border-gray-800 bg-gray-900 px-4 py-2">
        <button onClick={() => navigate('/')}>← Back to Worklist</button>
      </div>
      <div className="flex-1 overflow-hidden">
        <Suspense fallback={...}>
          <PanelXxx />
        </Suspense>
      </div>
    </div>
  );
}
```

---

## 6. WorkList Integration

The 3 tool buttons appear in the toolbar above the study list.

```
[ ▶ ECG Viewer ] [ ▶ Smart Paint ] [ ▶ Flatfoot Analysis ]  │  study list below
```

---

## 7. Key Bug Fixes Applied

### Bug 1 — Webpack `Module not found` (relative path depth)
**Fix:** Changed relative import depth from `../../../../` to `../../../../../` to correctly reach the repo root.

### Bug 2 — Canvas click coordinate offset (ECG + Flatfoot)
**Fix:** Scale click coordinates by `canvas.width / rect.width` and `canvas.height / rect.height`.

### Bug 3 — Linter reverting file edits
**Fix:** Used full-file Write instead of incremental Edit when the formatter reverted partial changes.

### Bug 4 — D point not draggable in Split Triangle
**Problem:** D was computed each frame from A/B/C, so there was no stored point to drag.
**Fix:** During measurement commit, store 4 points: `[A, B, C, D]`. Both `recomputeValue` and `drawMeasure` check `pts.length === 4` to use stored D; otherwise compute it fresh.

### Bug 5 — Click fires after drag
**Problem:** `onClick` fired after a drag-release, placing a new measurement point.
**Fix:** `hasDraggedRef.current` is set on first `mousemove` during drag; `onClick` skips if this is true, then resets it.

---

## 8. Verification Checklist

```
Start the dev server:
  yarn dev   (from repo root)

Open:  http://localhost:3000

✓ WorkList loads
✓ See: [ECG Viewer] [Smart Paint] [Flatfoot Analysis] buttons
✓ ECG Viewer → upload PNG, calibrate, measure QT → QTc shown
✓ Smart Paint → upload image, paint, area px² updates live, undo/redo works
✓ Flatfoot → upload X-ray, use Triangle tool → 3 angles + area shown
✓ Flatfoot → use Split Triangle → 2 triangles with all angles; drag D point
✓ Flatfoot → drag any measurement point → values recalculate live
```

---

## 9. Summary Table

| Item | Count |
|---|---|
| New extensions created | 3 |
| New route folders created | 3 |
| New `.tsx` panel files | 6 (3 panels + 3 route wrappers) |
| New utility/tool `.ts` files | 3 |
| New `package.json` files | 3 |
| Existing files modified | 8 |
| New documentation files | 3 |
| npm packages installed | **0** |

---

*All extensions use only React, TypeScript, Tailwind CSS, HTML5 Canvas, and libraries already present in the OHIF v3 monorepo.*
