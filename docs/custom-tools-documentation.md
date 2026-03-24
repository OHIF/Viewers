# Custom Tools Documentation
## OHIF Viewers — Clinical Measurement Extensions

> **Project:** OHIF Viewers (release/3.12)
> **Framework:** Cornerstone3D, React, TypeScript
> **Last Updated:** 2026-03-24

---

## Table of Contents

1. [ECG QTc Bidirectional Tool](#1-ecg-qtc-bidirectional-tool)
2. [ECG Viewer Panel — Smart Panel](#2-ecg-viewer-panel--smart-panel)
3. [ABC Split Angle Tool — Flatfoot Measurement Module](#3-abc-split-angle-tool--flatfoot-measurement-module)

---

## 1. ECG QTc Bidirectional Tool

### Module Name
**`ECGBidirectionalTool`**

- **File:** `extensions/cornerstone/src/tools/ECGBidirectionalTool.js`
- **Toolbar ID:** `ECGBidirectional`
- **Toolbar Icon:** `tool-cobb-angle`
- **Toolbar Label:** `ECG QTc`
- **Tool Group:** `default`, `mpr`

---

### What It Does
A 3-click annotation tool drawn directly on an ECG waveform image. The clinician places three points to measure QT interval, RR interval, and calculate heart-rate-corrected QTc using two validated formulas.

---

### How to Use (Step-by-Step)

| Step | Action | Result |
|------|--------|--------|
| 1 | Select **ECG QTc** from the toolbar (More Tools section) | Tool becomes active |
| 2 | Click **Point A** — QRS onset (start of ventricular depolarization) | Blue handle placed |
| 3 | Click **Point B** — T-wave end (end of ventricular repolarization) | Orange handle placed |
| 4 | Click **Point C** — Next QRS onset (start of next beat) | Green handle placed; all calculations appear |

**Labels drawn on image:**
- `A (QRS-onset)` — Blue
- `B (T-end)` — Orange
- `C (Next QRS)` — Green
- `A→B` line — QT interval measurement
- `A→C` line (dashed) — RR interval measurement
- Text boxes for QT ms, RR ms, QTcB ms, QTcF ms

---

### Formulas Used

#### Distance (World Space → mm)
```
distance(A, B) = √[(Ax−Bx)² + (Ay−By)² + (Az−Bz)²]  (mm, world coordinates)
```

#### mm → ms Conversion
```
time(ms) = (distance_mm / 25 mm/s) × 1000
```
> Standard ECG paper speed = 25 mm/second → 1 mm = 40 ms

#### QT Interval
```
QT (ms) = distance(A, B) in mm → converted to ms
```

#### RR Interval
```
RR (ms) = distance(A, C) in mm → converted to ms
```

#### QTc — Bazett's Formula
```
QTcB (ms) = [QT(s) / √RR(s)] × 1000
```

#### QTc — Fridericia's Formula
```
QTcF (ms) = [QT(s) / ∛RR(s)] × 1000
```

---

### Clinical Thresholds

| Value | Normal | Borderline | Prolonged | Critical |
|-------|--------|------------|-----------|----------|
| QT | 350–440 ms | — | >440 ms | >500 ms |
| RR | 600–1000 ms | — | <600 or >1000 ms | — |
| QTcB/QTcF (Male) | ≤440 ms | 441–460 ms | >460 ms | >500 ms |
| QTcB/QTcF (Female) | ≤460 ms | 461–470 ms | >470 ms | >500 ms |

---

### Technical Tools Used

| Technology | Role |
|------------|------|
| `@cornerstonejs/tools` — `AngleTool` | Base class — inherits 3-point placement, drag, modify, delete logic |
| `@cornerstonejs/tools` — `drawing` | SVG rendering: `drawHandles`, `drawLine`, `drawTextBox` |
| `@cornerstonejs/tools` — `annotation.state` | Stores/retrieves annotation data across renders |
| `@cornerstonejs/tools` — `utilities.roundNumber` | Rounds displayed mm values |
| `@cornerstonejs/core` — `getEnabledElement` | Accesses the active viewport for coordinate transforms |
| `viewport.worldToCanvas()` | Converts 3D world coordinates → 2D canvas pixels for drawing |
| `Math.sqrt`, `Math.cbrt` | Square/cube root for Bazett and Fridericia corrections |
| `Math.atan2` | Not used here (used in QRS Axis in panel) |

---

---

## 2. ECG Viewer Panel — Smart Panel

### Module Name
**`ECGViewerPanel`** (also referred to as **ECG Viewer** / **ECG Smart Panel**)

- **File:** `extensions/cornerstone-dynamic-volume/src/panels/ECGViewerPanel.tsx`
- **Panel ID:** `dynamic-ecg-viewer`
- **Registered in:** `extensions/cornerstone-dynamic-volume/src/getPanelModule.tsx`
- **Toolbar Button ID:** `ECGViewer`
- **Toolbar Icon:** `tab-linear`
- **Toolbar Label:** `ECG Viewer`
- **Toolbar Location:** More Tools section

---

### What It Does
A rich right-side panel that opens when the **ECG Viewer** toolbar button is clicked. It reads ECG waveform data from the active display set and provides 5 collapsible measurement sections:

| # | Section | Default |
|---|---------|---------|
| 1 | ECG Waveform & Intervals | Open |
| 2 | QTc Calculator — Bazett / Fridericia | Open |
| 3 | Heart Rate Variability (HRV) | Collapsed |
| 4 | QRS Electrical Axis | Collapsed |
| 5 | Lead / Series Comparison | Collapsed |

---

### How to Use — Each Section

---

#### Section 1: ECG Waveform & Intervals

**Purpose:** Measure specific time intervals and amplitudes by clicking on the chart.

**How to use:**
1. Click **ECG Viewer** button in More Tools — the panel opens on the right side.
2. The ECG waveform chart is displayed using the `LineChart` D3 component.
3. Click up to **4 points** (A, B, C, D) on the waveform:
   - **A** = P-wave onset
   - **B** = QRS onset (end of PR interval)
   - **C** = QRS end / J-point
   - **D** = T-wave end
4. Intervals are computed and displayed automatically.

**Point Guide:**

| Point | Clinical Meaning | Color |
|-------|-----------------|-------|
| A | P-wave onset | Blue |
| B | QRS onset | Green |
| C | QRS end / J-point | Yellow |
| D | T-wave end | Orange |

**Computed Intervals:**

| Interval | Name | Normal Range |
|----------|------|-------------|
| A → B | PR Interval | 120–200 ms |
| B → C | QRS Duration | 60–100 ms |
| C → D | ST-T Segment | (no strict range) |
| B → D | QT Interval | 350–440 ms |

**Each interval card shows:**
- Duration in ms and seconds
- ECG paper boxes (small = 0.04 s, large = 0.2 s)
- Amplitude delta (Δ mV) between the two points
- **Area Under Curve** in mV·s (trapezoidal integration of the waveform)
- Clinical status: Normal / Short / Long with diagnosis note

---

#### Section 2: QTc Calculator — Bazett / Fridericia

**Purpose:** Compute QTc from manually entered QT and RR values with gender-specific thresholds.

**How to use:**
1. Enter **QT interval** (ms) from a measurement or ECG report.
2. Enter **RR interval** (ms).
3. Select **Gender** (Male / Female).
4. Results update in real time.

**Formulas:**
```
QTc Bazett   = QT(s) / √RR(s)  × 1000  ms
QTc Fridericia = QT(s) / ∛RR(s) × 1000  ms
```

**Gender-Specific QTc Status:**

| Status | Male | Female |
|--------|------|--------|
| Normal | ≤440 ms | ≤460 ms |
| Borderline | 441–460 ms | 461–470 ms |
| Prolonged | >460 ms | >470 ms |
| Critical | >500 ms | >500 ms |

**Prolonged QTc causes listed:** Amiodarone, Haloperidol, Sotalol, Azithromycin, Hypokalemia, Hypomagnesemia, Congenital long QT syndrome.

---

#### Section 3: Heart Rate Variability (HRV)

**Purpose:** Analyze beat-to-beat variation from multiple consecutive RR intervals.

**How to use:**
1. Enter 2–6 consecutive **RR intervals** in milliseconds (one per field).
2. HRV metrics are computed automatically.

**Formulas Used:**

| Metric | Formula | Clinical Meaning |
|--------|---------|-----------------|
| Mean RR | `sum(RR) / n` | Average cycle length |
| Mean HR | `60000 / meanRR` | Beats per minute |
| SDNN | `√[Σ(RRᵢ − meanRR)² / n]` | Overall HRV — autonomic tone |
| RMSSD | `√[Σ(RRᵢ₊₁ − RRᵢ)² / (n−1)]` | Short-term vagal tone |
| pNN50 | `count(|ΔRR| > 50ms) / (n−1) × 100%` | Parasympathetic activity |

**SDNN Interpretation:**

| SDNN Range | Interpretation | Color |
|------------|---------------|-------|
| < 20 ms | Very poor HRV | Red |
| 20–50 ms | Poor HRV | Orange |
| 50–100 ms | Moderate HRV | Yellow |
| ≥ 100 ms | Good HRV | Green |

---

#### Section 4: QRS Electrical Axis

**Purpose:** Determine the mean electrical axis of the heart from Lead I and aVF amplitudes.

**How to use:**
1. Enter **Lead I** amplitude (the net QRS deflection height in mV from the Lead I waveform).
2. Enter **aVF** amplitude (the net QRS deflection in mV from the aVF waveform).
3. The electrical axis in degrees and classification appear immediately.

**Formula:**
```
QRS Axis (degrees) = atan2(aVF, LeadI) × (180 / π)
```

**Axis Classification:**

| Range | Classification | Clinical Significance |
|-------|---------------|----------------------|
| −30° to +90° | Normal Axis | Healthy conduction |
| −30° to −90° | Left Axis Deviation (LAD) | LBBB, inferior MI, LVH, left anterior fascicular block |
| +90° to +180° | Right Axis Deviation (RAD) | RBBB, RVH, lateral MI, left posterior fascicular block |
| Outside ±90° extreme | Extreme Axis Deviation | Ventricular tachycardia, severe disease |

---

#### Section 5: Lead / Series Comparison

**Purpose:** Side-by-side comparison of multiple ECG leads loaded in the same display set.

**Visible only when:** 2 or more series/leads are available in the active display set.

**Shows per lead:**
- Series label (e.g. Lead I, II, III, aVR, aVL, aVF, V1–V6)
- Maximum amplitude (mV)
- Minimum amplitude (mV)
- Peak-to-peak amplitude (max − min, mV)
- Duration (seconds)

---

### Technical Tools Used

| Technology | Role |
|------------|------|
| `React` (useState, useEffect, useMemo) | State management for selected points, inputs, computed results |
| `@ohif/ui-next` — `LineChart` | D3-based ECG waveform chart with click-point selection |
| `@ohif/ui-next` — `PanelSection` | Collapsible section containers with `defaultOpen` prop |
| `D3.js` (via LineChart internals) | SVG rendering, zoom/pan, line interpolation |
| `displaySetService` | Reads active display set; finds `chartData.series` |
| `series[i].points` (`number[][]`) | Raw waveform data: each element is `[x_value, y_value]` |
| Trapezoidal Rule | Numerical area integration under ECG waveform curve |
| `Math.sqrt` / `Math.cbrt` | Bazett (√) and Fridericia (∛) QTc corrections |
| `Math.atan2` | QRS electrical axis from Lead I and aVF vectors |
| `@ohif/extension-cornerstone-dynamic-volume` | Extension that registers the panel module |

---

---

## 3. ABC Split Angle Tool — Flatfoot Measurement Module

### Module Name
**`ABCSplitAngleTool`**

- **File:** `extensions/cornerstone/src/tools/ABCSplitAngleTool.js`
- **Toolbar ID:** `ABCSplitAngle`
- **Toolbar Icon:** `tool-angle`
- **Toolbar Label:** `ABC Split Angle`
- **Toolbar Location:** More Tools section
- **Tool Group:** `default`, `mpr`

---

### What It Does
A 3-click geometric measurement tool for radiological foot/joint analysis. The clinician places 3 points (A, B, C) on the image. The tool automatically calculates a 4th point **D** — the perpendicular projection of C onto segment AB — dividing the triangle ABC into two sub-triangles. Areas and all interior angles of both triangles are displayed.

**Primary clinical application:** Flatfoot (pes planus) angle measurements, tarsal coalition assessment, joint alignment analysis.

---

### How to Use (Step-by-Step)

| Step | Action | Result |
|------|--------|--------|
| 1 | Select **ABC Split Angle** from More Tools | Tool becomes active |
| 2 | Click **Point A** on the image | First anchor placed |
| 3 | Click **Point B** on the image | Second anchor placed; A→B baseline drawn |
| 4 | Click **Point C** on the image | Third point placed; D auto-calculated; full annotation drawn |

**What appears on image after step 4:**
- Four labeled handles: **A**, **B**, **C**, **D** (yellow)
- Triangle outline: A→B, B→C, C→A
- Dashed line: C→D (perpendicular drop from C to AB)
- **T1 Area** label at centroid of triangle ACD (mm²)
- **T2 Area** label at centroid of triangle DCB (mm²)
- Angle labels at each vertex:
  - `∠A` at point A (angle in triangle ACD)
  - `∠B` at point B (angle in triangle DCB)
  - `∠C` shows both sub-angles: `∠C_ACD / ∠C_DCB`
  - `∠D` shows both sub-angles: `∠D_ACD / ∠D_DCB`

---

### Point D — Auto-Calculation

Point D is not clicked by the user. It is computed as the **perpendicular projection of C onto segment AB**:

```
t = clamp( [(C − A) · (B − A)] / |B − A|² , 0, 1 )
D = A + t × (B − A)
```

This ensures D always lies exactly on line segment AB (clamped between A and B).

---

### Formulas Used

#### 3D Distance
```
distance(P, Q) = √[(Px−Qx)² + (Py−Qy)² + (Pz−Qz)²]  (mm, world space)
```

#### Triangle Area — Heron's Formula
```
a = distance(A, D)
b = distance(D, C)
c = distance(C, A)
s = (a + b + c) / 2                           (semi-perimeter)
Area = √[s(s−a)(s−b)(s−c)]                   (mm²)
```

Applied to both sub-triangles:
- **Triangle 1 (T1):** vertices A, D, C
- **Triangle 2 (T2):** vertices D, B, C

#### Interior Angle at Vertex V
```
v1 = P1 − V
v2 = P2 − V
angle = arccos( (v1 · v2) / (|v1| × |v2|) ) × (180 / π)  (degrees)
```

Applied at each vertex of both triangles:
- `∠A` = angle at A in triangle (A, D, C)
- `∠B` = angle at B in triangle (D, B, C)
- `∠C` = angle at C in both triangles (two values)
- `∠D` = angle at D in both triangles (two values)

---

### Calculated Outputs Summary

| Output | Unit | Description |
|--------|------|-------------|
| T1 Area | mm² | Area of triangle A–D–C (Heron's formula) |
| T2 Area | mm² | Area of triangle D–B–C (Heron's formula) |
| ∠A | degrees | Angle at vertex A (in T1) |
| ∠B | degrees | Angle at vertex B (in T2) |
| ∠C | degrees (×2) | Angles at C in T1 and T2 |
| ∠D | degrees (×2) | Angles at D in T1 and T2 |
| Point D | world coords | Perpendicular foot from C to AB |

---

### Hit Detection

The tool intercepts mouse proximity checks for all segments of the annotation:
- Segment A→B (baseline)
- Segment B→C
- Segment C→A
- Segment C→D (dashed perpendicular line)

Any of these segments can be grabbed and dragged to modify the annotation.

---

### Technical Tools Used

| Technology | Role |
|------------|------|
| `@cornerstonejs/tools` — `AngleTool` | Base class — inherits 3-point placement, drag-to-modify, delete, and annotation lifecycle |
| `@cornerstonejs/tools` — `drawing` | SVG: `drawHandles`, `drawLine`, `drawTextBox` |
| `@cornerstonejs/tools` — `annotation.state` | Annotation storage and event triggers |
| `@cornerstonejs/tools` — `utilities.roundNumber` | Formats displayed mm² values |
| `@cornerstonejs/core` — `csUtils.transformWorldToIndex` | Checks if any point is outside the image bounds |
| `@cornerstonejs/core` — `csUtils.indexWithinDimensions` | Boundary validation for handle positions |
| `viewport.worldToCanvas()` | Projects 3D world points → 2D screen pixels for SVG drawing |
| `Math.acos`, `Math.sqrt` | Dot-product angle computation and Heron's formula |
| Heron's Formula | Triangle area from three side lengths (no need for height) |
| Perpendicular Projection | Parametric line formula to compute foot of perpendicular |

---

---

## Appendix: File Reference

| File | Purpose |
|------|---------|
| `extensions/cornerstone/src/tools/ECGBidirectionalTool.js` | ECG QTc annotation tool (3-point, on-image) |
| `extensions/cornerstone/src/tools/ABCSplitAngleTool.js` | Flatfoot split-angle measurement tool |
| `extensions/cornerstone-dynamic-volume/src/panels/ECGViewerPanel.tsx` | ECG Smart Panel (5 sections: waveform, QTc, HRV, axis, comparison) |
| `extensions/cornerstone-dynamic-volume/src/getPanelModule.tsx` | Registers ECGViewerPanel as `dynamic-ecg-viewer` panel module |
| `modes/basic/src/toolbarButtons.ts` | Toolbar button definitions (ECGBidirectional, ECGViewer, ABCSplitAngle) |
| `modes/basic/src/initToolGroups.ts` | Registers all tools into tool groups (default, mpr) |
| `modes/basic/src/index.tsx` | Mode layout; includes ECG Viewer panel in right panel list |
| `platform/ui-next/src/components/LineChart/` | D3-based chart component used by ECG panel |
