# Flatfoot Measurement — Tool Reference Guide

## Overview

The Flatfoot Measurement module analyzes foot X-rays (lateral view) to detect and classify
flat foot (Pes Planus), high arch (Pes Cavus), and normal arch conditions.
All measurements are performed by clicking on anatomical landmarks directly on the uploaded X-ray image.

**All placed points are draggable** — after placing a measurement you can click and drag any dot
to reposition it. Angles and distances update live as you drag.

---

## How to Start

1. Open the app → click **Flatfoot Analysis** button on the WorkList
2. Click **Upload X-Ray** → select a lateral foot X-ray (PNG / JPG / BMP)
3. (Optional) Run **Calibrate** first for accurate mm measurements
4. Select a tool → click points on the image → results appear in the right panel
5. To move a point: hover over any dot (cursor changes to hand) → click-drag to new position

---

## Tools Reference

---

### 1. Cursor
**Button:** `Cursor`
**Color:** Blue

**Purpose:** Default inactive mode. No measurements are placed.
Use this to inspect the image without accidentally adding points.

**How to use:**
- Select Cursor → freely move mouse over the image
- No clicks register any measurement

---

### 2. ⬡ Area (Polygon)
**Button:** `⬡ Area`
**Color:** Yellow

**Purpose:** Measure the enclosed area of any region on the X-ray — e.g., the contact area of the foot, heel pad area, or any anatomical zone of interest.

**Formula — Shoelace (Gauss Area) Formula:**
```
Area = |Σ (xᵢ · yᵢ₊₁  −  xᵢ₊₁ · yᵢ)| / 2

Then convert:
  Area (mm²) = Area (px²) / (px_per_mm)²
```

**How to use:**
1. Select `⬡ Area` tool
2. Click anywhere on the image → numbered dot appears (●1)
3. Click again → dot ●2 appears, connected to ●1 with a line
4. Keep clicking → each dot connects to the previous one
5. After 3+ dots, the polygon auto-fills with semi-transparent color
6. Live area in mm² shows in the hint bar as you build the polygon
7. Click **✓ Finish & Save Area** to save the result

**Reading the result:**
- `245.3 mm²` → area enclosed by your polygon in square millimetres

**Clinical use:** Measure plantar contact area, heel pad, or any region of interest.

---

### 3. Distance
**Button:** `Distance`
**Color:** Green

**Purpose:** Measure straight-line distance between any two points on the image.

**Formula — Euclidean Distance:**
```
Distance (px) = √[(x₂ − x₁)² + (y₂ − y₁)²]

Distance (mm) = Distance (px) / px_per_mm
```

**How to use:**
1. Select `Distance`
2. Click **Point 1** (start)
3. Click **Point 2** (end)
4. Result shows in mm in the right panel

**Example:** Measure foot length, heel width, or any bone segment.

---

### 4. Calcaneal Pitch
**Button:** `Calcaneal Pitch`
**Color:** Amber/Orange

**Purpose:** Measures the angle of the calcaneus (heel bone) relative to the ground (horizontal).
Indicates the inclination of the heel — reduced angle = flat foot tendency.

**Formula — Angle from Horizontal:**
```
Δy = y₂ − y₁
Δx = x₂ − x₁

Calcaneal Pitch (°) = atan2(Δy, Δx) × (180 / π)
```

**Normal Range:** 17° – 32°

| Result | Interpretation |
|---|---|
| < 17° | Decreased pitch — possible Pes Planus (flat foot) |
| 17° – 32° | Normal calcaneal pitch |
| > 32° | Increased pitch — possible Pes Cavus (high arch) |

**How to use:**
1. Select `Calcaneal Pitch`
2. Click **Point 1** → Posterior-inferior border of calcaneus (back bottom of heel bone)
3. Click **Point 2** → Anterior-inferior border of calcaneus (front bottom of heel bone)
4. Draw the line along the inferior surface of the calcaneus

```
      Point 2 (anterior)
     /
    /   ← calcaneal line
   /
  Point 1 (posterior)
  ━━━━━━━━━━━━━━━━━━━━  (ground line / horizontal)
```

---

### 5. Clarke's Angle
**Button:** `Clarke's Angle`
**Color:** Purple

**Purpose:** Measures the angle of the medial longitudinal arch.
Uses 3 points to describe how raised or collapsed the arch is.

**Formula — Cosine Rule (angle at middle point):**
```
Given 3 points: A (heel), B (arch apex), C (ball of foot)

Vector BA = A − B
Vector BC = C − B

cos(θ) = (BA · BC) / (|BA| × |BC|)

Clarke's Angle (°) = acos(cos(θ)) × (180 / π)
```

**Normal Range:** ≥ 42°

| Result | Interpretation |
|---|---|
| < 42° | Flat arch — Pes Planus |
| 42° – 54° | Normal arch |
| > 54° | High arch — Pes Cavus |

**How to use:**
1. Select `Clarke's Angle`
2. Click **Point 1** → Heel (most posterior-inferior point of calcaneus)
3. Click **Point 2** → Arch Apex (highest point of medial longitudinal arch / navicular area)
4. Click **Point 3** → 1st Metatarsal Head (ball of foot)

```
              ●2 (arch apex)
             / \
            /   \
           /     \
    ●1 ──────────── ●3
  (heel)         (ball)
         ↑ angle measured at ●2
```

---

### 6. Arch Index
**Button:** `Arch Index`
**Color:** Orange

**Purpose:** Quantifies flat foot severity using foot contact area proportions.
Based on the **Cavanagh & Rodgers (1987)** method.

**Formula — Arch Index (AI):**
```
The foot is divided into 3 equal thirds (anterior, middle, posterior):

AI = Mid-foot contact area / Total foot contact area

Simplified from 2 click points:
  Total foot length (px) = Distance(Point 1 → Point 2)
  Mid-foot length (px)   = Total / 3  (middle third)

AI = Mid-foot px / Total px
```

**Classification (Cavanagh & Rodgers):**

| Arch Index | Classification |
|---|---|
| < 0.21 | Pes Cavus (high arch) |
| 0.21 – 0.26 | Normal arch |
| > 0.26 | Pes Planus (flat foot) |

**How to use:**
1. Select `Arch Index`
2. Click **Point 1** → Posterior edge of heel (back of heel)
3. Click **Point 2** → Tip of the longest toe (front of foot)
4. The system divides the foot into 3 equal thirds and calculates AI

```
  |←── Total Foot Length ──────────────────→|
  |← Posterior →|←── Mid-foot ──→|← Ant. →|
  ●1 (heel)                               ●2 (toe)

  AI = middle third / total length
```

> **Note:** For clinical accuracy, the Arch Index should ideally be measured
> from a pressure plate footprint, not an X-ray. This tool gives a linear approximation.

---

### 7. Meary's Angle (Talo-First Metatarsal Angle)
**Button:** `Meary's Angle`
**Color:** Pink

**Purpose:** Measures the angle between the long axis of the talus and the long axis
of the first metatarsal. One of the most reliable indicators of flat foot on lateral X-ray.

**Formula — Angle Between Two Lines:**
```
Line 1: Talus axis         → defined by Points 1 & 2
Line 2: 1st Metatarsal axis → defined by Points 3 & 4

Vector V1 = P2 − P1  (talus direction)
Vector V2 = P4 − P3  (metatarsal direction)

dot    = V1.x·V2.x + V1.y·V2.y
|V1|   = √(V1.x² + V1.y²)
|V2|   = √(V2.x² + V2.y²)

Meary's Angle (°) = acos(dot / (|V1| × |V2|)) × (180 / π)
```

**Normal Range:** < 4°

| Result | Interpretation |
|---|---|
| < 4° | Normal alignment |
| 4° – 15° | Mild Pes Planus |
| 15° – 30° | Moderate Pes Planus |
| > 30° | Severe Pes Planus |

**How to use:**
1. Select `Meary's Angle`
2. Click **Point 1** → Center of talus head (anterior)
3. Click **Point 2** → Center of talus body (posterior)
4. Click **Point 3** → Base of 1st metatarsal
5. Click **Point 4** → Head of 1st metatarsal

```
  ●1────●2   ← Talus axis
         \
          \  ← angle here
           ●3────────●4
           (metatarsal axis)
```

---

### 8. △ Triangle
**Button:** `△ Triangle`
**Color:** Cyan

**Purpose:** Drop 3 corner points to form a triangle. Calculates all 3 interior angles,
marks the midpoint of each side, and shows the enclosed area. Useful for measuring
any triangular bone or joint region.

**Formula — Law of Cosines (all 3 angles):**
```
Given 3 corners: A, B, C
Side lengths:
  ab = |B − A|,  bc = |C − B|,  ca = |A − C|

Angle at A = acos((ab² + ca² − bc²) / (2 · ab · ca))
Angle at B = acos((ab² + bc² − ca²) / (2 · ab · bc))
Angle at C = 180° − ∠A − ∠B

Area (px²) = |( (B.x−A.x)·(C.y−A.y) ) − ( (C.x−A.x)·(B.y−A.y) )| / 2
Area (mm²) = Area (px²) / (px_per_mm)²
```

**How to use:**
1. Select `△ Triangle`
2. Click **Point 1** (A) → first corner
3. Click **Point 2** (B) → second corner
4. Click **Point 3** (C) → third corner
5. Triangle draws automatically with:
   - Angle labels at each corner (∠1, ∠2, ∠3)
   - White circle markers at each side midpoint
   - Area displayed at the centroid

**Reading the result:**
- `∠1=45°  ∠2=90°  ∠3=45° | 312.4 mm²`
- All 3 angles sum to exactly 180°

**Dragging:** All 3 corner points can be dragged — angles and area update live.

```
     ●A
    / \
   /∠A \
  /     \
 ●B─────●C
  ∠B   ∠C
  mid-points shown as ○ on each side
```

---

### 9. ⊿⊿ Split Triangle
**Button:** `⊿⊿ Split △`
**Color:** Orange

**Purpose:** Draw a baseline (like Arch Index) and then drop an apex point.
A perpendicular is dropped from the apex to the baseline, splitting it into
two sub-triangles. All 6 angles (3 per triangle) are calculated.

**Formula:**
```
Points: A (line start), B (line end), C (apex)

Foot of perpendicular D on line AB:
  t = ((C − A) · (B − A)) / |B − A|²
  D = A + t · (B − A)          ← clamped to [0,1]

Triangle 1: A, D, C  →  3 angles via law of cosines
Triangle 2: D, B, C  →  3 angles via law of cosines

Area of each triangle = cross-product / 2
```

**How to use:**
1. Select `⊿⊿ Split △`
2. Click **Point 1** (A) → start of baseline
3. Click **Point 2** (B) → end of baseline
4. Click **Point 3** (C) → apex above the line
5. Point D (foot of perpendicular) appears automatically on the baseline
6. Two filled triangles draw (orange = T1, purple = T2)
7. A dashed line shows the C→D perpendicular; right-angle mark appears at D

**Reading the result:**
- `T1: ∠A=60° ∠D=90° ∠C=30° (145mm²) | T2: ∠D=90° ∠B=45° ∠C=45° (145mm²)`

**Dragging:** All 4 points (A, B, C, D) can be dragged independently.
- Dragging **A or B** moves the baseline endpoints
- Dragging **C** moves the apex (D recomputes to stay on the A-B line... unless you also drag D)
- Dragging **D** slides the split point freely along (or off) the baseline

```
              ●C (apex)
             /|\
            / | \
           /  |  \
          / ∟ |   \
    ●A───────●D────●B
      T1 (orange)  T2 (purple)
```

---

### 10. Calibrate
**Button:** `Calibrate`
**Color:** Yellow (when active)

**Purpose:** Set the scale so measurements are accurate in real-world millimetres.
Without calibration, the tool uses a default estimate (96 DPI screen assumption).

**Formula:**
```
px_per_mm = pixel_distance_of_known_object / known_length_in_mm
```

**How to use:**
1. Find a known reference object in the X-ray — e.g., a ruler, implant, or standard marker
2. Click **Calibrate**
3. Enter the known real-world length (mm) in the input box
4. Click **Point 1** → one end of the known object
5. Click **Point 2** → other end of the known object
6. Calibration is saved — all subsequent measurements use this scale

**Example:** If a 10mm marker spans 38 pixels → px/mm = 38/10 = 3.8

> Always calibrate before taking clinical measurements for accurate results.

---

## Summary Table

| Tool | Points | Formula | Normal Range | Key Use |
|---|---|---|---|---|
| Cursor | 0 | — | — | Inspect only |
| ⬡ Area | 3+ | Shoelace | — | Contact / region area (mm²) |
| Distance | 2 | Euclidean | — | Any length (mm) |
| Calcaneal Pitch | 2 | atan2 | 17°–32° | Heel bone inclination |
| Clarke's Angle | 3 | Cosine rule | ≥ 42° | Medial arch angle |
| Arch Index | 2 | AI = mid/total | 0.21–0.26 | Arch area ratio |
| Meary's Angle | 4 | Vector dot product | < 4° | Talo-metatarsal alignment |
| △ Triangle | 3 | Law of cosines + cross-product | — | Triangle angles + area |
| ⊿⊿ Split △ | 3 | Perpendicular foot + law of cosines | — | Split baseline into 2 triangles |
| Calibrate | 2 | px/mm ratio | — | Set real-world scale |

---

## Dragging Points

Every measurement point placed on the canvas is draggable:

- **Hover** over any dot → cursor changes to a hand (↕)
- **Click and drag** → point moves, measurement updates live
- **Release** → final value saved

This is especially useful for the Triangle and Split Triangle tools where small adjustments
to corner positions significantly affect the calculated angles.

---

## Recommended Workflow

```
1. Upload lateral foot X-ray
        ↓
2. Calibrate (using a known marker on the X-ray)
        ↓
3. Calcaneal Pitch   ← quick overall arch check
        ↓
4. Meary's Angle     ← most clinically reliable flat foot indicator
        ↓
5. Clarke's Angle    ← medial arch assessment
        ↓
6. Arch Index        ← load distribution estimate
        ↓
7. Triangle / Split △ ← detailed angular analysis of any bone region
        ↓
8. Distance / Area   ← any additional measurements needed
        ↓
9. Review results panel → compare against Normal Ranges
```

---

## Classification Summary

| Condition | Calcaneal Pitch | Clarke's | Arch Index | Meary's |
|---|---|---|---|---|
| Pes Cavus (high arch) | > 32° | > 54° | < 0.21 | < 4° |
| Normal | 17°–32° | 42°–54° | 0.21–0.26 | < 4° |
| Pes Planus (flat foot) | < 17° | < 42° | > 0.26 | > 4° |

---

*Reference: Cavanagh PR, Rodgers MM. The arch index: a useful measure from footprints.
J Biomech. 1987;20(5):547-51.*
