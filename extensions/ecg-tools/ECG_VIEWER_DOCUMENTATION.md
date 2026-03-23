# ECG Viewer — Complete Tool Documentation

> **Extension:** `extensions/ecg-tools/`
> **Route:** `/ecg-viewer`
> **Panel:** `src/panels/PanelEcgViewer.tsx`
> **Calculations:** `src/utils/ecgCalculations.ts`

---

## 1. What Is the ECG Viewer?

The ECG Viewer is a **clinical electrocardiogram measurement tool** built directly into the
OHIF Viewer. A cardiologist or clinician uploads a PNG or JPG image of an ECG strip and then
places measurement points on the canvas to compute intervals, amplitudes, heart rate,
corrected QT, and cardiac axis — all without leaving the OHIF interface.

### Who Uses It and Why

| User | Use Case |
|---|---|
| Cardiologist | Precise measurement of QT, QTc, PR, QRS intervals and axis |
| Emergency physician | Rapid heart rate and RR interval assessment |
| General practitioner | Screen ECG for long QT syndrome or axis deviation |
| Researcher | Systematic ECG measurement with exported numeric values |

### What Can Be Measured

- **Heart rate** from any two consecutive R-wave peaks
- **RR interval** — rhythm regularity, HRV (heart rate variability)
- **QT interval** — time from QRS onset to T-wave end
- **QTc (Bazett)** — heart-rate-corrected QT to detect long QT syndrome
- **QRS Axis** — electrical direction of the heart's depolarisation
- **PR interval / QRS duration** — using the Time tool
- **ST elevation / T-wave amplitude** — using the Amplitude tool

---

## 2. Libraries Used

No new npm packages were installed. All libraries are browser built-ins or already in the OHIF monorepo.

| Library | Source | Used For |
|---|---|---|
| **React** | OHIF existing | UI, `useReducer` for complex tool/measurement state |
| **TypeScript** | OHIF existing | Type safety for `Tool`, `Measurement`, `EcgCalibration`, `Point` |
| **HTML5 Canvas 2D API** | Browser built-in | Rendering the ECG image, drawing measurement lines, points, labels |
| **FileReader API** | Browser built-in | Reading uploaded image files into base64 data URLs |
| **HTMLImageElement** | Browser built-in | Decoding the image and drawing it onto the canvas |
| **`getBoundingClientRect()`** | Browser built-in | Getting the canvas display rectangle for coordinate scaling |
| **`Math` (atan2, sqrt, abs)** | Browser built-in | Clinical calculations: axis, distance, QTc |
| **Tailwind CSS** | OHIF existing | All UI styling |

---

## 3. Canvas Architecture — How It Works

The ECG Viewer uses a **single HTML5 canvas** for both image rendering and measurement overlay.

```
┌──────────────────────────────────────────────┐
│  canvasRef                                   │
│  ┌────────────────────────────────────────┐  │
│  │  ECG image (drawn with drawImage)      │  │
│  │  + Measurement lines (strokes)         │  │
│  │  + Endpoint dots (arc fills)           │  │
│  │  + Value labels (fillText)             │  │
│  └────────────────────────────────────────┘  │
└──────────────────────────────────────────────┘
```

The canvas is **fully redrawn** on every state change (image switch, new measurement,
new pending point, zoom change). This means:

1. `ctx.clearRect()` — blank the canvas
2. `ctx.drawImage(ecgImage.img, 0, 0)` — redraw the ECG image
3. `measurements.forEach(m => drawMeasurement(ctx, m))` — redraw all saved measurements
4. Draw any pending (in-progress) points and dashed line

### Coordinate Scaling Fix — Critical Detail

The canvas element uses `style={{ maxWidth: '100%' }}` so its CSS display width
may be smaller than its actual pixel width (e.g., canvas is 1100 px wide but displayed at 700 px).

Without correction, a click at CSS position (350, 200) would be recorded as (350, 200) canvas
pixels — but the actual canvas pixel at that display location is at a different position.

**Fix applied on every click:**
```typescript
const rect = canvas.getBoundingClientRect();   // CSS display rectangle
const scaleX = canvas.width  / rect.width;     // e.g. 1100/700 = 1.571
const scaleY = canvas.height / rect.height;

const x = (e.clientX - rect.left) * scaleX;   // true canvas pixel X
const y = (e.clientY - rect.top)  * scaleY;   // true canvas pixel Y
```

Without this fix, all measurements would be offset and inaccurate.

---

## 4. Calibration — How Clinical Units Are Derived

All ECG measurements are based on **pixel distances**. To convert pixels to clinical units
(milliseconds, millivolts), the tool uses a calibration object:

```typescript
interface EcgCalibration {
  pxPerMs: number;   // how many pixels correspond to 1 millisecond (horizontal)
  pxPerMv: number;   // how many pixels correspond to 1 millivolt   (vertical)
}
```

**Default values (before calibration):**
```
pxPerMs = 0.25   (standard ECG paper: 25mm/s → 1mm = 40ms → 1px ≈ 4ms at typical screen DPI)
pxPerMv = 10     (standard ECG paper: 10mm/mV → 1px = 0.1mV)
```

**Warning shown until calibrated:**
```
⚠ Using defaults — calibrate for clinical accuracy
```

After calibration the status shows:
```
✓ Calibrated   X.XX px/mm  ·  Y.YY px/mV
```

---

## 5. Tools — Purpose, Library, Formula

---

### 5.1 Calibrate Time (Horizontal)

**Purpose:** Tell the viewer how many pixels equal a known time span on this specific ECG image.
Required for accurate ms measurements. Every ECG image scanned at different resolutions will have
different pixels-per-millisecond ratios.

**Libraries used:**
- Canvas mouse event → `getBoundingClientRect()` + scale correction → pixel coordinates
- `Math.abs()` — absolute horizontal pixel distance

**How to use:**
1. Select **Calibrate Time**
2. Enter the known time in the input box (default 200 ms — one large grid square at 25 mm/s)
3. Click at the **start** of a known reference mark (e.g., left edge of a large grid square)
4. Click at the **end** of the same reference span

**Formula:**
```
dx = |x₂ − x₁|                 (pixel distance between the two clicks)
pxPerMs = dx / known_ms         (pixels per millisecond)
```

**Example:**
```
Known span = 200 ms (one large square at 25mm/s standard paper)
dx measured = 50 pixels
→ pxPerMs = 50 / 200 = 0.25 px/ms
```

**Standard ECG paper relationship:**
```
Paper speed = 25 mm/s
1 large square = 5 mm = 200 ms
1 small square = 1 mm = 40 ms
pxPerMs = pixelsPerMm / 40
```

**For the doctor:** Every ECG photo has a different scale depending on how it was scanned or
photographed. Calibrating ensures the Time, RR, QT, and QTc measurements are accurate
in real clinical milliseconds, not just screen pixels.

---

### 5.2 Calibrate mV (Vertical)

**Purpose:** Tell the viewer how many pixels equal a known voltage on this ECG image.
Required for accurate amplitude and QRS Axis measurements.

**How to use:**
1. Select **Calibrate mV**
2. Enter the known voltage (default 1.0 mV — standard calibration pulse)
3. Click at the **bottom** of the 1 mV calibration pulse (usually shown at the start of the strip)
4. Click at the **top** of the calibration pulse

**Formula:**
```
dy = |y₂ − y₁|                 (vertical pixel distance)
pxPerMv = dy / known_mV
```

**Example:**
```
Standard calibration pulse = 1.0 mV = 10 mm tall
dy measured = 100 pixels
→ pxPerMv = 100 / 1.0 = 100 px/mV
```

**Standard ECG paper relationship:**
```
Standard gain = 10 mm/mV
pxPerMv = pixelsPerMm × 10
```

**For the doctor:** ECG machines use standard gain (10 mm/mV) but different printers and
scanners change the physical scale. Calibrating ensures ST elevation, T-wave amplitude,
and QRS Axis values are in real millivolts.

---

### 5.3 Time (ms)

**Purpose:** Measure any horizontal duration on the ECG — PR interval, QRS width, P-wave
duration, ST segment length, or any custom interval.

**Libraries used:**
- Canvas 2D: `moveTo`, `lineTo`, `stroke` — draws the measurement line
- Canvas 2D: `arc` — draws the two endpoint dots
- Canvas 2D: `fillText` — shows the value label at midpoint

**How to use:**
1. Select **Time (ms)**
2. Click the **start** of the interval (e.g., onset of the P-wave)
3. Click the **end** of the interval (e.g., end of the P-wave)

**Formula:**
```
dx = |x₂ − x₁|         (horizontal pixel distance)
ms = round(dx / pxPerMs)
```

**Output label:** `X ms` — shown on the canvas at the midpoint of the measurement line

**For the doctor:**

| What to Measure | Points to Place | Normal Range |
|---|---|---|
| P-wave duration | Onset → offset of P-wave | 80–120 ms |
| PR interval | Start of P-wave → start of QRS | 120–200 ms |
| QRS duration | Q onset → S end | < 120 ms (< 80 ms narrow) |
| ST segment | J-point → T-wave start | 80–120 ms |
| T-wave duration | T onset → T offset | varies |

---

### 5.4 Amplitude (mV)

**Purpose:** Measure any vertical voltage between two points — ST elevation or depression,
R-wave peak height, T-wave amplitude, P-wave height.

**Libraries used:**
- Canvas 2D: same drawing functions as Time tool (line + dots + label)
- `Math.abs()` — absolute vertical pixel distance

**How to use:**
1. Select **Amplitude (mV)**
2. Click on the **baseline** (isoelectric line — flat segment between T and P wave)
3. Click on the **peak or trough** of the feature being measured

**Formula:**
```
dy = |y₂ − y₁|         (vertical pixel distance — y increases downward)
mV = (dy / pxPerMv).toFixed(3)
```

**Output label:** `X.XXX mV`

**For the doctor:**

| What to Measure | Points | Clinical Meaning |
|---|---|---|
| ST elevation | Baseline → J-point or ST segment | > 1mm (0.1mV) in ≥2 leads = STEMI criteria |
| ST depression | Baseline → deepest ST point | > 0.5mm = ischemia indicator |
| R-wave amplitude | Baseline → R-wave peak | Increased = LVH; decreased = poor R progression |
| T-wave amplitude | Baseline → T-wave peak | Peaked T = hyperkalemia; inverted T = ischemia |

---

### 5.5 RR / HR (Heart Rate)

**Purpose:** Measure the distance between two consecutive R-wave peaks (RR interval) and
automatically compute the heart rate in beats per minute.

**Libraries used:**
- `ecgCalculations.ts → heartRate()` — bpm calculation
- `ecgCalculations.ts → rrVariance()` — rhythm variability when multiple RR intervals placed

**How to use:**
1. Select **RR / HR**
2. Click the **peak of one R-wave** (tallest point of QRS complex)
3. Click the **peak of the next R-wave**

**Formulas:**
```
dx = |x₂ − x₁|
RR_ms = round(dx / pxPerMs)           → RR interval in milliseconds

HR_bpm = round(60000 / RR_ms)         → Heart rate in beats per minute
```

**Derivation of HR formula:**
```
1 minute = 60,000 ms
Heart beats RR_ms apart
→ beats per minute = 60000 / RR_ms
```

**Output label:** `RR: X ms | HR: Y bpm`

**Multiple RR measurements — HRV:**
When two or more RR intervals are placed, the right panel also shows:
```
RR Mean = (RR₁ + RR₂ + ... + RRₙ) / n

Variance = Σ(RRᵢ - mean)² / n

StdDev = √Variance
```
StdDev measures Heart Rate Variability (HRV) — a marker of autonomic nervous system health.

**For the doctor:**

| HR value | Interpretation |
|---|---|
| < 60 bpm | Bradycardia |
| 60–100 bpm | Normal sinus rhythm |
| > 100 bpm | Tachycardia |
| Irregular RR | Atrial fibrillation, ectopic beats |

---

### 5.6 QT Interval

**Purpose:** Measure the QT interval — the total duration of ventricular depolarization
and repolarization (from QRS onset to end of T-wave). Critical for detecting long QT syndrome.

**How to use:**
1. Select **QT Interval**
2. Click the **onset of the QRS complex** (where the Q-wave begins to deflect from baseline)
3. Click the **end of the T-wave** (where T-wave returns to the isoelectric baseline)

**Formula:**
```
dx = |x₂ − x₁|
QT_ms = round(dx / pxPerMs)
```

**Output label:** `QT: X ms`

**Measurement tip:** Use the tangent method — draw a tangent to the steepest descending
slope of the T-wave; the intersection with the baseline is the T-wave end.

**For the doctor:**

| QT | Interpretation |
|---|---|
| 350–440 ms (HR 60 bpm) | Normal range (varies with HR) |
| > 440 ms (men) | Prolonged QT — risk of Torsades de Pointes |
| > 460 ms (women) | Prolonged QT |
| > 500 ms | High risk — antiarrhythmic, hospitalization may be needed |

> **Note:** QT must always be interpreted alongside heart rate — use QTc (Bazett) for
> heart-rate-corrected assessment.

---

### 5.7 QTc — Bazett's Formula

**Purpose:** Calculate the heart-rate-corrected QT interval (QTc). The raw QT interval
shortens at fast heart rates and lengthens at slow rates. QTc removes this dependency,
making the value comparable regardless of current heart rate.

**Libraries used:**
- `ecgCalculations.ts → bazettQTc()` — applies Bazett formula
- Values stored in reducer state: `qtMs`, `rrMsForQtc`

**How to use:**
1. First measure the **RR interval** using the RR/HR tool (value is stored automatically)
2. Select **QTc (Bazett)**
3. Click the **QRS onset** and the **T-wave end** (same as QT Interval tool)

The QTc is computed automatically once both QT and RR values are available.

**Formula — Bazett (1920):**
```
QTc = QT (seconds) / √( RR (seconds) )

Where:
  QT_sec = QT_ms / 1000
  RR_sec = RR_ms / 1000
```

**Derivation / intuition:**
Bazett observed that QT scales with the square root of the RR interval.
Dividing by √RR normalises the QT to what it would be at a heart rate of 60 bpm (RR = 1.0 s).

**Example calculation:**
```
QT  = 380 ms  →  0.380 s
RR  = 800 ms  →  0.800 s

QTc = 0.380 / √0.800
    = 0.380 / 0.894
    = 0.425 s
    = 425 ms
```

**Output:** `QTc: 425ms (Bazett) | QT: 380ms | RR: 800ms`

**Also displayed in right panel:**
```
QTc (Bazett)  →  425 ms
QT            →  380 ms
RR            →  800 ms
```

**For the doctor:**

| QTc | Male | Female | Interpretation |
|---|---|---|---|
| Normal | < 440 ms | < 460 ms | No concern |
| Borderline | 440–460 ms | 460–470 ms | Monitor, check for drugs/electrolytes |
| Prolonged | > 460 ms | > 470 ms | High risk of arrhythmia |
| Critical | > 500 ms | > 500 ms | Immediate action needed |

**Common causes of prolonged QTc:** Drugs (amiodarone, haloperidol, azithromycin),
hypokalaemia, hypomagnesaemia, hypothyroidism, congenital long QT syndrome (LQTS).

---

### 5.8 QRS Axis

**Purpose:** Determine the mean electrical axis of the heart's ventricular depolarization.
Axis deviation is a key indicator of ventricular hypertrophy, bundle branch blocks,
and conduction abnormalities.

**Libraries used:**
- `ecgCalculations.ts → qrsAxis()` — atan2 calculation + interpretation
- `Math.atan2()` — four-quadrant arctangent
- Canvas 2D — draws two separate vertical segment lines (one for Lead I, one for aVF)

**How to use:**
1. Select **QRS Axis**
2. Place **4 points** in this order:
   - **P1** — Baseline of Lead I (isoelectric line in Lead I)
   - **P2** — Peak of QRS complex in Lead I (tallest R or deepest S)
   - **P3** — Baseline of Lead aVF
   - **P4** — Peak of QRS complex in Lead aVF

**Formula:**
```
Step 1 — Net amplitudes:
  leadI_mV = (P1.y − P2.y) / pxPerMv       (upward deflection = positive)
  aVF_mV   = (P3.y − P4.y) / pxPerMv

  Note: screen y increases downward, so subtracting P2.y from P1.y gives
        positive values for upward (positive) deflections.

Step 2 — Electrical axis:
  axis_radians = atan2(aVF_mV, leadI_mV)
  axis_degrees = round(axis_radians × 180 / π)
```

**Why `atan2`?**
`atan2(y, x)` returns the angle in all four quadrants (-180° to +180°), unlike basic
`atan(y/x)` which is limited to two quadrants. Using `aVF` as the y-axis and `Lead I`
as the x-axis directly maps to the hexaxial ECG reference system.

**Example:**
```
Lead I  net amplitude = +0.8 mV  (positive → leftward component)
aVF     net amplitude = +0.5 mV  (positive → inferiorly directed)

axis = atan2(0.5, 0.8) × 180/π
     = atan2(0.5, 0.8) = 32°
→ Normal Axis
```

**Output:** `Axis: 32° | Normal Axis`

**Interpretation table:**

| Axis Range | Classification | Common Causes |
|---|---|---|
| −30° to +90° | Normal Axis | Healthy conduction |
| −30° to −90° | Left Axis Deviation (LAD) | Left anterior fascicular block, inferior MI, LVH |
| +90° to +180° | Right Axis Deviation (RAD) | Right ventricular hypertrophy, left posterior fascicular block, PE |
| ±180° (extreme) | Extreme / Northwest Axis | Severe conduction disease, ventricular tachycardia |

**For the doctor:** QRS axis is routinely assessed in all 12-lead ECGs. Axis deviation
combined with other findings (bundle branch block morphology, ST changes) narrows the
differential diagnosis significantly.

---

### 5.9 Compare Mode

**Purpose:** Display two ECG images side-by-side in the same viewport for direct visual
comparison — e.g., comparing a patient's current ECG to a previous one, or comparing
two leads.

**Libraries used:**
- A second canvas element (`canvas2Ref`) rendered alongside the main canvas
- `drawCanvas()` called separately for each canvas

**How to use:**
1. Upload **two images** using "+ Upload ECG"
2. The **Compare** button appears automatically
3. Click **Compare** to toggle side-by-side layout
4. Measurements can still be placed on the left (primary) canvas

**No formula** — purely a visual display mode.

**For the doctor:** Place the patient's current ECG on the left and a historical ECG
on the right to spot interval changes, new ST depression, or axis shift over time.

---

### 5.10 Zoom

**Purpose:** Scale the canvas display size to make precise point placement easier on
high-density or small ECG strips.

**Slider range:** 0.5× to 3.0× (default 1.0×)

**How it works:**
```
canvas.width  = round(ecgImage.canvasW × zoom)
canvas.height = round(ecgImage.canvasH × zoom)
ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
```

**Accuracy note:** Zoom does NOT affect measurement accuracy.
All pixel coordinates stored in measurements are in canvas-pixel space (the zoomed size).
Calculations use `pxPerMs` and `pxPerMv` which are calibrated against the unzoomed image.
If you calibrate at zoom 1× and then measure at zoom 2×, measurements are still accurate
because the `pxPerMs` doubles proportionally with the canvas size.

**For the doctor:** Zoom in to precisely place the QRS onset/offset on a narrow complex,
then zoom back out to see the full strip context.

---

## 6. Right Panel — Computed Results

Automatically updated whenever relevant measurements are placed:

| Result | Computed When |
|---|---|
| **QTc (Bazett)** | Both QT and RR have been measured |
| **QT / RR components** | After QTc calculation |
| **HR (bpm)** | After any RR/HR measurement |
| **RR Mean** | After ≥ 2 RR measurements |
| **RR StdDev** | After ≥ 2 RR measurements (HRV marker) |
| **QRS Axis / Interpretation** | After QRS Axis measurement (4 points) |

---

## 7. Measurement Log

Every completed measurement is saved with:
- **Tool name** (colored to match the canvas overlay color)
- **Computed value** (ms, mV, bpm, degrees)
- **× button** — removes that individual measurement from canvas and log

**Clear All** button removes all measurements, calibrations in history, and resets QT/RR stores.

---

## 8. Normal Clinical Reference Ranges

| Parameter | Normal Range | Notes |
|---|---|---|
| QTc | < 440ms (M) / < 460ms (F) | Bazett formula |
| Heart Rate | 60–100 bpm | Resting sinus rhythm |
| QRS Duration | < 120 ms | > 120ms = bundle branch block |
| PR Interval | 120–200 ms | > 200ms = 1st degree AV block |
| QRS Axis | −30° to +90° | Hexaxial system |

---

## 9. Complete Workflow for a Doctor

```
Step 1 — Upload
  Click "+ Upload ECG" or drop an image file
  Up to 2 images (for comparison)

Step 2 — Calibrate
  (Recommended) Select "Calibrate Time"
  Enter 200ms (one large square at standard 25mm/s)
  Click left and right edges of one large grid square
  → pxPerMs updated

  Select "Calibrate mV"
  Enter 1.0mV (standard calibration pulse)
  Click bottom and top of the 1mV calibration square
  → pxPerMv updated

Step 3 — Measure
  RR/HR  → two R-wave peaks → get heart rate
  QT     → QRS onset to T-wave end
  QTc    → reads stored RR + measure QT again → auto QTc
  Time   → any custom interval (PR, QRS, ST)
  Amplitude → any voltage (ST elevation, R-wave height)
  QRS Axis → 4 points on Lead I and aVF

Step 4 — Review
  Right panel shows all computed values
  Measurements list shows individual readings
  Normal range reference at bottom of panel

Step 5 — Remove / Redo
  Click × next to any measurement to remove it
  Click image tab × to remove an image
  "Clear All" resets everything
```

---

## 10. File Location Summary

| File | Purpose |
|---|---|
| `src/panels/PanelEcgViewer.tsx` | React UI — toolbar, canvas, state reducer, rendering |
| `src/utils/ecgCalculations.ts` | Clinical math — QTc, HR, QRS Axis, px-to-unit conversion |
| `src/index.tsx` | OHIF extension registration |
| `package.json` | Extension package declaration |

---

*File location: `extensions/ecg-tools/ECG_VIEWER_DOCUMENTATION.md`*
