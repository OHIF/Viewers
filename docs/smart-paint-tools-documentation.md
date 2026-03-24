# Smart Paint Tool — Documentation
## OHIF Viewers — Basic Viewer Segmentation Suite

> **Module Location:** Basic Viewer (`modes/basic`)
> **Toolbar Section:** `LabelMapTools` toolbox (right panel segmentation toolbox)
> **Segmentation Type:** Labelmap (voxel-based overlay)
> **Framework:** Cornerstone3D + React
> **Last Updated:** 2026-03-24

---

## Overview

The **Smart Paint** suite is a collection of segmentation tools available in the Basic Viewer. They allow clinicians and radiologists to paint, erase, threshold, and intelligently segment anatomical structures directly on DICOM images (2D slices, MPR volumes, and 3D volumes).

All paint tools operate on a **Labelmap Segmentation** — a pixel/voxel overlay stored separately from the image. The labelmap is color-coded per segment and can be saved as DICOM SEG.

---

## Tool Suite Summary

| # | Tool Name | Toolbar ID | What It Does |
|---|-----------|-----------|-------------|
| 1 | Brush | `Brush` | Free-hand paint fill on image |
| 2 | Eraser | `Eraser` | Remove painted pixels/voxels |
| 3 | Threshold Brush | `Threshold` | Paint only within a Hounsfield Unit (HU) range |
| 4 | Shapes (Scissor) | `Shapes` | Fill a geometric region (circle, sphere, rectangle) |
| 5 | One Click Segment | `RegionSegmentPlus` | AI auto-detects and fills region on a single click |
| 6 | Labelmap AI Assist | `LabelmapSlicePropagation` | AI propagates segments to neighboring slices |
| 7 | Marker Guided Segment | `MarkerLabelmap` | SAM-based AI segmentation via include/exclude markers |
| 8 | Contour Edit | `LabelMapEditWithContour` | Edit labelmap boundary using a drawn contour |
| 9 | Interpolate Labelmap | `InterpolateLabelmap` | Auto-fill missing slices between drawn segments |
| 10 | Segment Bidirectional | `SegmentBidirectional` | Auto-measure largest length + width of a segment |
| 11 | Segment Label Display | `SegmentLabelTool` | Toggle hover labels on segments |

---

## Detailed Tool Documentation

---

### 1. Brush Tool

**Toolbar ID:** `Brush`
**Icon:** `icon-tool-brush`
**Location:** LabelMapTools toolbox → BrushTools section

#### What It Does
Free-hand paint brush that fills voxels in the active segment as you drag across the image. Supports circular (2D) and sphere (3D volumetric) shapes.

#### How to Use
1. Open the **Segmentation Panel** and create or select a segment.
2. Select **Brush** from the LabelMapTools toolbox.
3. Click and drag on the image to paint.
4. Release mouse to stop painting.

#### Options

| Option | Type | Range | Default | Description |
|--------|------|-------|---------|-------------|
| Radius (mm) | Slider | 0.5 – 99.5 mm | 25 mm | Brush tip radius |
| Shape | Radio | Circle / Sphere | Circle | 2D circular brush or 3D spherical brush (paints across depth) |

#### Sub-tools Activated

| Shape | Internal Tool Name | Behavior |
|-------|--------------------|----------|
| Circle | `CircularBrush` | Paints a 2D circle on the current slice |
| Sphere | `SphereBrush` | Paints a 3D sphere across neighboring slices |

#### Strategy Used
```
FILL_INSIDE_CIRCLE   (CircularBrush)
FILL_INSIDE_SPHERE   (SphereBrush)
```

#### Technical Tools
- `@cornerstonejs/tools` — Brush tool base (`BrushTool` parent with `activeStrategy`)
- Command: `setToolActiveToolbar` → activates the selected brush sub-tool
- Command: `activateSelectedSegmentationOfType` → ensures Labelmap type is active
- Command: `setBrushSize` → updates radius for both Circle and Sphere brush

---

### 2. Eraser Tool

**Toolbar ID:** `Eraser`
**Icon:** `icon-tool-eraser`
**Location:** LabelMapTools toolbox → BrushTools section

#### What It Does
Removes painted segment voxels from the labelmap. Works identically to the Brush but erases instead of painting.

#### How to Use
1. Select **Eraser** from the toolbox.
2. Click and drag over painted areas to erase.

#### Options

| Option | Type | Range | Default | Description |
|--------|------|-------|---------|-------------|
| Radius (mm) | Slider | 0.5 – 99.5 mm | 25 mm | Eraser tip radius |
| Shape | Radio | Circle / Sphere | Circle | 2D or 3D erase area |

#### Sub-tools

| Shape | Internal Tool Name | Strategy |
|-------|--------------------|---------|
| Circle | `CircularEraser` | `ERASE_INSIDE_CIRCLE` |
| Sphere | `SphereEraser` | `ERASE_INSIDE_SPHERE` |

#### Technical Tools
- `@cornerstonejs/tools` — Brush tool with erase strategy
- Command: `setBrushSize` → syncs radius for `CircularEraser` and `SphereEraser`

---

### 3. Threshold Brush

**Toolbar ID:** `Threshold`
**Icon:** `icon-tool-threshold`
**Location:** LabelMapTools toolbox

#### What It Does
A smart paint brush that only fills voxels whose Hounsfield Unit (HU) value falls within a defined threshold range. Ideal for isolating specific tissues (e.g., bone, lung, soft tissue) by density.

#### How to Use
1. Select **Threshold Tool** from the toolbox.
2. Choose **Shape**: Circle or Sphere.
3. Choose **Threshold Mode**:
   - **Dynamic** — automatically computes threshold relative to the pixel value where you first click (local neighborhood comparison)
   - **Range** — manually set a fixed HU min/max range with the double slider
4. Click and drag to paint only matching-density voxels.

#### Options

| Option | Type | Range | Default | Description |
|--------|------|-------|---------|-------------|
| Radius (mm) | Slider | 0.5 – 99.5 mm | 25 mm | Brush radius |
| Shape | Radio | Circle / Sphere | Circle | 2D or 3D brush shape |
| Threshold Mode | Radio | Dynamic / Range | Dynamic | How threshold is computed |
| HU Range | Double Slider | −1000 to +1000 HU | 50–600 HU | Manual HU range (shown only in Range mode) |

#### Sub-tools

| Shape + Mode | Internal Tool Name | Strategy |
|-------------|-------------------|---------|
| Circle + Range | `ThresholdCircularBrush` | `THRESHOLD_INSIDE_CIRCLE` |
| Sphere + Range | `ThresholdSphereBrush` | `THRESHOLD_INSIDE_SPHERE` |
| Circle + Dynamic | `ThresholdCircularBrushDynamic` | `THRESHOLD_INSIDE_CIRCLE` + `isDynamic: true, dynamicRadius: 3` |
| Sphere + Dynamic | `ThresholdSphereBrushDynamic` | `THRESHOLD_INSIDE_SPHERE` + `isDynamic: true, dynamicRadius: 3` |

#### Typical HU Ranges for Tissue Types

| Tissue | HU Range |
|--------|----------|
| Air | −1000 to −900 |
| Lung | −900 to −500 |
| Fat | −150 to −50 |
| Soft Tissue | −50 to +100 |
| Liver | +45 to +65 |
| Bone | +300 to +1000 |

#### Technical Tools
- `@cornerstonejs/tools` — Threshold brush strategies
- Command: `setThresholdRange` — applies the HU min/max to the tool configuration
- Command: `setBrushSize` — syncs radius across all 4 threshold sub-tools

---

### 4. Shapes (Scissor Tool)

**Toolbar ID:** `Shapes`
**Icon:** `icon-tool-shape`
**Location:** LabelMapTools toolbox

#### What It Does
Fills a predefined geometric shape (circle, sphere, or rectangle) in the labelmap with one drag gesture. Faster than free-hand brush when the region is geometrically regular.

#### How to Use
1. Select **Shapes** from the toolbox.
2. Choose a shape from the radio options.
3. Click and drag on the image — release to fill the shape.

#### Options

| Shape | Internal Tool Name | Behavior |
|-------|-------------------|---------|
| Circle | `CircleScissor` | 2D circle fill on current slice |
| Sphere | `SphereScissor` | 3D sphere fill across slices |
| Rectangle | `RectangleScissor` | 2D rectangle fill on current slice |

#### Technical Tools
- `@cornerstonejs/tools` — Scissor tools (fill-by-shape variants)
- Command: `activateSelectedSegmentationOfType` (Labelmap)
- Command: `setToolActiveToolbar` → activates selected shape tool

---

### 5. One Click Segment (Region Segment Plus)

**Toolbar ID:** `RegionSegmentPlus`
**Icon:** `icon-tool-click-segment`
**Location:** LabelMapTools toolbox

#### What It Does
AI-powered single-click segmentation. Hover over the image — when a **+** sign appears, the AI has detected a segmentable region. Click to auto-fill the entire lesion or structure.

#### How to Use
1. Select **One Click Segment**.
2. Move mouse over the image — watch for the **+** cursor indicator.
3. Click when the plus appears to auto-segment the detected region.

#### Technical Tools
- `@cornerstonejs/tools` — `RegionSegmentPlus` tool
- Uses region-growing / AI boundary detection internally
- Command: `setToolActiveToolbar`
- Command: `activateSelectedSegmentationOfType` (Labelmap)

---

### 6. Labelmap AI Assist (Slice Propagation)

**Toolbar ID:** `LabelmapSlicePropagation`
**Icon:** `icon-labelmap-slice-propagation`
**Location:** LabelMapTools toolbox → LabelMapUtilities section

#### What It Does
AI-assisted segmentation propagation. After you draw a segment on one slice, the AI predicts how the segment should look on neighboring slices. You scroll through slices to preview predictions and accept or skip them.

#### How to Use
1. Paint a segment on any slice using Brush or Threshold tools.
2. Enable **Labelmap Assist** (toggle button).
3. Scroll to the next slice — AI prediction appears as an overlay.
4. Press **Enter** to accept the predicted segment on this slice.
5. Press **Esc** to skip this slice.
6. Continue scrolling to propagate through the volume.

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Enter | Accept AI prediction on current slice |
| Esc | Skip / reject prediction on current slice |

#### Technical Tools
- `@cornerstonejs/tools` — `LabelmapSlicePropagation` tool
- Listens to `ViewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED` and `VIEWPORTS_READY`
- Command: `toggleEnabledDisabledToolbar` — toggles AI assistance on/off
- Command: `activateSelectedSegmentationOfType` (Labelmap)

---

### 7. Marker Guided Segmentation (SAM / AI)

**Toolbar ID:** `MarkerLabelmap`
**Icon:** `icon-marker-labelmap`
**Location:** LabelMapTools toolbox

#### What It Does
Uses the **Segment Anything Model (SAM)** AI to generate a segmentation mask guided by user-placed include/exclude markers. Place green (+) include markers inside the structure and red (−) exclude markers outside it. The AI uses these as prompts to compute the segmentation boundary.

#### How to Use
1. Select **Marker Guided Segment**.
2. Choose **Marker Mode**:
   - **Include** — place markers *inside* the structure to segment (green markers)
   - **Exclude** — place markers *outside* the structure / inside unwanted area (red markers)
3. Click to place markers on the image.
4. The AI computes and shows the predicted segmentation.
5. Press **Enter** to accept and write to the labelmap.
6. Press **Esc** to reject and clear prediction.
7. Press **N** to move to the next slice while keeping the current markers (for multi-slice structures).
8. Use **Clear Markers** button to remove all current markers and restart.

#### Marker Modes

| Mode | Internal Tool | Marker Color | Purpose |
|------|--------------|-------------|---------|
| Include | `MarkerInclude` | Green (+) | Tell AI: "segment this area" |
| Exclude | `MarkerExclude` | Red (−) | Tell AI: "do NOT include this area" |

#### Keyboard Shortcuts
| Key | Action |
|-----|--------|
| Enter | Accept AI segmentation result |
| Esc | Reject / undo AI result |
| N | Go to next slice, keep markers |

#### Technical Tools
- `@cornerstonejs/tools` — `MarkerLabelmap`, `MarkerInclude`, `MarkerExclude` tools
- **SAM (Segment Anything Model)** — AI inference engine used for mask generation
- Listens to `ViewportGridService` events to reinitialize on viewport changes
- Command: `setToolActive` → switches between `MarkerInclude` and `MarkerExclude`
- Command: `clearMarkersForMarkerLabelmap` — removes all placed markers

---

### 8. Labelmap Edit with Contour

**Toolbar ID:** `LabelMapEditWithContour`
**Icon:** `tool-labelmap-edit-with-contour`
**Location:** LabelMapTools toolbox

#### What It Does
Allows editing an existing labelmap segment by drawing a contour (freehand or spline) that redefines the boundary. The contour replaces or modifies the labelmap pixels inside the drawn contour region.

#### How to Use
1. Select **Labelmap Edit with Contour**.
2. Draw a contour on the image over or around the segment boundary you wish to modify.
3. The labelmap is updated to match the drawn contour region.

#### Technical Tools
- `@cornerstonejs/tools` — `LabelMapEditWithContourTool`
- Command: `setToolActiveToolbar`
- Command: `activateSelectedSegmentationOfType` (Labelmap)

---

### 9. Interpolate Labelmap

**Toolbar ID:** `InterpolateLabelmap`
**Icon:** `actions-interpolate`
**Location:** LabelMapTools toolbox → LabelMapUtilities section

#### What It Does
Automatically fills in missing slices between two or more manually drawn segments. If you paint a segment on slice 10 and slice 20, this tool creates smooth interpolated masks for slices 11–19. Works in any orientation (axial, sagittal, coronal).

#### How to Use
1. Paint segment on at least **two non-adjacent slices** using Brush or Threshold tools.
2. Click **Interpolate Labelmap** button.
3. The tool calculates and fills all slices between the painted slices.

#### Requirements
- At least 2 slices with segment painted
- Volume must be reconstructable (sufficient metadata for multi-planar geometry)

#### Technical Tools
- `@cornerstonejs/tools` — `interpolateLabelmap` command
- Uses morphological interpolation between binary labelmap slice masks
- Command: `activateSelectedSegmentationOfType` → ensures Labelmap active
- Command: `interpolateLabelmap` → runs the interpolation algorithm

---

### 10. Segment Bidirectional Measurement

**Toolbar ID:** `SegmentBidirectional`
**Icon:** `actions-bidirectional`
**Location:** LabelMapTools toolbox → LabelMapUtilities section

#### What It Does
Automatically detects the longest axis and the perpendicular widest axis across all slices of the selected segment and displays a **bidirectional measurement** annotation (length × width).

#### How to Use
1. Paint a segment using any brush/threshold tool.
2. Click **Segment Bidirectional**.
3. The tool scans all slices, finds the maximum length and maximum perpendicular width, and places a bidirectional annotation on the image.

#### What It Calculates

| Measurement | Description |
|------------|-------------|
| Length | Longest straight-line distance across the segment (max axis) |
| Width | Widest perpendicular measurement to the length axis |

#### Technical Tools
- `@cornerstonejs/tools` — `SegmentBidirectional` / `runSegmentBidirectional` command
- Scans labelmap voxel data across slices
- Command: `activateSelectedSegmentationOfType`
- Command: `runSegmentBidirectional`

---

### 11. Segment Label Display

**Toolbar ID:** `SegmentLabelTool`
**Icon:** `tool-segment-label`
**Location:** LabelMapTools toolbox

#### What It Does
Toggle tool. When enabled, hovering the mouse over a painted segment on the image shows a **floating label** with the segment's name and index.

#### How to Use
1. Click **Segment Label Display** to toggle on.
2. Move the mouse over any painted segment — a label appears.
3. Click again to toggle off.

#### Technical Tools
- `@cornerstonejs/tools` — `SegmentLabelTool`
- Command: `toggleSegmentLabel`
- Evaluate: `evaluate.cornerstoneTool.toggle` + `evaluate.cornerstone.hasSegmentation` (hidden when no segmentation exists)

---

## Tool Group Registration

All Smart Paint tools are registered in the **default** and **mpr** tool groups at mode entry:

```typescript
// modes/basic/src/initToolGroups.ts — passive tools list
{ toolName: 'CircularBrush',      parentTool: 'Brush', configuration: { activeStrategy: 'FILL_INSIDE_CIRCLE' } },
{ toolName: 'SphereBrush',        parentTool: 'Brush', configuration: { activeStrategy: 'FILL_INSIDE_SPHERE' } },
{ toolName: 'CircularEraser',     parentTool: 'Brush', configuration: { activeStrategy: 'ERASE_INSIDE_CIRCLE' } },
{ toolName: 'SphereEraser',       parentTool: 'Brush', configuration: { activeStrategy: 'ERASE_INSIDE_SPHERE' } },
{ toolName: 'ThresholdCircularBrush',       parentTool: 'Brush', configuration: { activeStrategy: 'THRESHOLD_INSIDE_CIRCLE' } },
{ toolName: 'ThresholdSphereBrush',         parentTool: 'Brush', configuration: { activeStrategy: 'THRESHOLD_INSIDE_SPHERE' } },
{ toolName: 'ThresholdCircularBrushDynamic',parentTool: 'Brush', configuration: { activeStrategy: 'THRESHOLD_INSIDE_CIRCLE', threshold: { isDynamic: true, dynamicRadius: 3 } } },
{ toolName: 'ThresholdSphereBrushDynamic',  parentTool: 'Brush', configuration: { activeStrategy: 'THRESHOLD_INSIDE_SPHERE', threshold: { isDynamic: true, dynamicRadius: 3 } } },
{ toolName: toolNames.LabelmapSlicePropagation },
{ toolName: toolNames.MarkerLabelmap },
{ toolName: toolNames.RegionSegmentPlus },
{ toolName: toolNames.LabelMapEditWithContourTool },
{ toolName: toolNames.CircleScissors },
{ toolName: toolNames.RectangleScissors },
{ toolName: toolNames.SphereScissors },
```

**Radius limits:**
```typescript
const MIN_SEGMENTATION_DRAWING_RADIUS = 0.5;   // mm
const MAX_SEGMENTATION_DRAWING_RADIUS = 99.5;  // mm
```

---

## Toolbar Section Layout

```
LabelMapTools (toolbox)
├── LabelmapSlicePropagation   ← AI slice assist
├── BrushTools
│   ├── Brush                  ← Free paint (Circle / Sphere)
│   └── Eraser                 ← Remove paint (Circle / Sphere)
├── MarkerLabelmap             ← SAM AI marker-guided
├── RegionSegmentPlus          ← One-click AI segment
├── Shapes                     ← Geometric fill (Circle / Sphere / Rectangle)
├── LabelMapEditWithContour    ← Contour-based edit

LabelMapUtilities
├── InterpolateLabelmap        ← Auto-fill missing slices
└── SegmentBidirectional       ← Auto length × width measurement
```

---

## File Reference

| File | Role |
|------|------|
| `modes/basic/src/toolbarButtons.ts` | Button definitions, options, radius sliders, shape radio buttons |
| `modes/basic/src/initToolGroups.ts` | Tool registration in `default` and `mpr` tool groups with strategies and configs |
| `modes/basic/src/index.tsx` | Mode layout; declares `LabelMapTools`, `BrushTools`, `LabelMapUtilities` sections |
| `extensions/cornerstone/src/commandsModule.ts` | `setBrushSize`, `setThresholdRange`, `interpolateLabelmap`, `runSegmentBidirectional` commands |
| `extensions/cornerstone-dicom-seg/src/getToolbarModule.ts` | Segmentation-specific toolbar evaluators |
| `platform/ui-next/` | UI components for toolbox buttons, sliders, radio groups |

---

## Technical Stack Summary

| Technology | Role |
|------------|------|
| `@cornerstonejs/tools` — `BrushTool` | Core paint/erase engine with pluggable strategies |
| `@cornerstonejs/tools` — Scissor tools | Shape-fill segmentation tools |
| `@cornerstonejs/tools` — `LabelmapSlicePropagation` | AI-assisted neighbor-slice propagation |
| `@cornerstonejs/tools` — `MarkerLabelmap` | SAM-based AI prompted segmentation |
| `@cornerstonejs/tools` — `RegionSegmentPlus` | One-click region-growing AI segment |
| `@cornerstonejs/tools` — `LabelMapEditWithContourTool` | Contour-to-labelmap editing |
| **SAM (Segment Anything Model)** | AI model used by MarkerLabelmap for mask generation |
| Cornerstone3D Labelmap | Voxel-based segmentation overlay stored per-segment |
| DICOM SEG | Standard format for saving/loading segmentation data |
| `ViewportGridService` | Event bus for viewport changes; used to sync tool state |
| `commandsManager` | OHIF command bus; runs `setBrushSize`, `setThresholdRange`, etc. |
