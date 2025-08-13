---
title: Icons
summary: Migration guide for OHIF 3.10's Icon component updates, covering the transition from @ohif/ui to @ohif/ui-next with new PascalCase naming conventions, legacy fallback options, and a comprehensive renaming table for all icons.
---

## Migration Guide: Icon Component Updates

### General Overview

This migration involves changes to how icons are used within the OHIF platform. The core change is the move to a new icon component library, `@ohif/ui-next`, which provides more flexibility and a more consistent naming convention for icons.

**Key Changes:**

1.  **New Icon Library:** The primary change is the shift from using `<Icon>` from `@ohif/ui` to using the new `Icons` component from `@ohif/ui-next`.
2.  **`AbcDef` Naming Convention:** The new library uses a `AbcDef` (PascalCase) naming convention for the icons. For instance, `status-alert` is now `StatusAlert`.
3.  **Legacy Fallback:**  To ease the transition, a legacy fallback has been provided using `Icons.ByName`. This allows you to continue using the old `name="status-alert"` format but is not the recommended way moving forward.
4.  **Direct Icon Component Access:** The recommended approach is to use `Icons.StatusAlert` instead of `<Icons.ByName name="status-alert"/>` this way will make code more clear and readable.

### Migration Strategies

You have two ways to approach the migration:

1.  **Recommended Approach (Gradual Adoption):**
    *   Start by updating your codebase to use the `Icons.Method` for the new icon naming convention.
    *   For example, replace `<Icon name="status-alert" />` with `<Icons.StatusAlert />`.
    *   This ensures your code is aligned with the new standard and provides optimal compatibility in the future.
    *   This method can be rolled out in phases.

2.  **Legacy Fallback Approach (Temporary):**
    *   If a full migration is not immediately feasible, you can use the legacy fallback temporarily:
        *  Replace `<Icon name="status-alert" />` with `<Icons.ByName name="status-alert" />`.
    *   This option allows you to complete the migration with minimal disruption to the old code
    *   However, it is highly recommended to move towards the `Icons.Method` approach to take advantage of all the new library offers and have a cleaner code base.

**Recommendation:** We strongly recommend using the *Recommended Approach* for a more maintainable and consistent codebase going forward.

### Specific Changes (Code Examples)

Here are some specific examples based on the diff you provided, illustrating both the legacy fallback and recommended approach:

**Example 1: Status Icons in `_getStatusComponent.tsx`**

**Old Code (`@ohif/ui`):**

```jsx
import { Icon, Tooltip } from '@ohif/ui';

// ...
  case true:
    StatusIcon = () => <Icon name="status-alert" />;
    break;
  case false:
    StatusIcon = () => (
      <Icon
        className="text-aqua-pale"
        name="status-untracked"
      />
    );
    break;
//...

```

**Legacy Fallback Approach (`Icons.ByName`):**

```jsx
import { Tooltip } from '@ohif/ui';
import { Icons } from '@ohif/ui-next';

// ...
  case true:
    StatusIcon = () => <Icons.ByName name="status-alert" />;
    break;
  case false:
    StatusIcon = () => (
      <Icons.ByName
        className="text-aqua-pale"
        name="status-untracked"
      />
    );
    break;
//...
```

**Recommended Approach (`Icons.StatusAlert`, `Icons.StatusUntracked`):**

```jsx
import { Tooltip } from '@ohif/ui';
import { Icons } from '@ohif/ui-next';

// ...
 case true:
    StatusIcon = () => <Icons.StatusAlert />;
    break;
  case false:
    StatusIcon = () => (
      <Icons.StatusUntracked
        className="text-aqua-pale"
      />
    );
    break;
//...
```


**Example 5:  Icon usage in `WorkList.tsx`**

**Old Code (`@ohif/ui`):**

```jsx
   <Icon
      name="group-layers"
```
**Recommended Approach (`Icons.GroupLayers`):**

```jsx
    <Icons.GroupLayers
```
```jsx
   <Icons.ByName
      className="!h-[20px] !w-[20px] text-black"
      name={isValidMode ? 'launch-arrow' : 'launch-info'}
    />
```
**Recommended Approach (`Icons.LaunchArrow`, `Icons.LaunchInfo`):**

```jsx
     isValidMode ? (
      <Icons.LaunchArrow className="!h-[20px] !w-[20px] text-black" />
    ) : (
      <Icons.LaunchInfo className="!h-[20px] !w-[20px] text-black" />
    )
```




### Creating New Custom Icons

This section explains how to migrate your custom icons from the old SVG import method to the new React component-based system in `@ohif/ui-next`. The new approach improves consistency, allows for better tree-shaking, and provides type safety.

The process involves converting your existing SVG files into React components and then registering them.

#### 1. Convert SVG to a React Component

First, take your raw SVG file and convert it into a `.tsx` React functional component.

**Before: Raw SVG File**

Previously, you might have had a file like `Baseline.svg`:

```xml
// Baseline.svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
  < some svg content>
</svg>
```

**After: React Icon Component**

Now, create a `.tsx` file that exports a React component. Note the following changes:
- SVG attributes like `text-anchor` and `stroke-width` are converted to camel case (i.e. `textAnchor`, `strokeWidth`).
- The component accepts `IconProps` and spreads them onto the root `<svg>` element.

```typescript
// Baseline.tsx
import React from 'react';
import type { IconProps } from '../types';

export const Baseline = (props: IconProps) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" {...props}>
     < some svg content>
  </svg>
);

export default Baseline;
```

#### 2. Register the New Icon

After creating the component, you must register it with the `Icons` service from `@ohif/ui-next`. This is typically done in a centralized location where you initialize your UI components (for example, an extension's preRegistration is a good spot for this). You'll need a unique name for the icon, which can be managed with an enum for consistency.

```typescript
// Example: in your setup/initialization code
import { Icons, IconNameEnum } from '@ohif/ui-next';
import Baseline from './sources/Baseline'; // Import your new icon component

// Add the icon to the registry
Icons.addIcon(IconNameEnum.BASELINE, Baseline);
```

By following these steps, your custom icon will be available for use throughout the application just like any of the default icons.




### Detailed Renaming Table

| Old Icon Name                   | New Icon Component Name                     | Example Usage (`Icons.`)                                  | Notes                                                                                                                                                                                             |
| :------------------------------ | :------------------------------------------ | :--------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `status-alert`                  | `StatusAlert`                              | `Icons.StatusAlert`                                         |                                                                                                                                                                                                 |
| `status-untracked`              | `StatusUntracked`                          | `Icons.StatusUntracked`                                     |                                                                                                                                                                                                 |
| `status-locked`                 | `StatusLocked`                            | `Icons.StatusLocked`                                        |                                                                                                                                                                                                 |
| `icon-transferring`             | `IconTransferring`                          | `Icons.IconTransferring`                                    |                                                                                                                                                                                                 |
| `icon-alert-small`              | `Alert`                                     | `Icons.Alert`                                              |                                                                                                                                                                                                 |
| `icon-alert-outline`            | `AlertOutline`                             | `Icons.AlertOutline`                                       |                                                                                                                                                                                                 |
| `icon-status-alert`             | `Alert`                                     | `Icons.Alert`                                              |                                                                                                                                                                                                 |
| `action-new-dialog`             | `ActionNewDialog`                         | `Icons.ActionNewDialog`                                    |                                                                                                                                                                                                 |
| `VolumeRendering`               | `VolumeRendering`                           | `Icons.VolumeRendering`                                    |                                                                                                                                                                                                 |
| `chevron-left`                  | `ChevronClosed`                            | `Icons.ChevronClosed`                                     | Use when arrow direction needs to point left                                                                                                                                                        |
| `chevron-down`                  | `ChevronOpen`                             | `Icons.ChevronOpen`                                      | Use when arrow direction needs to point down                                                                                                                                                      |
| `launch-arrow`                  | `LaunchArrow`                              | `Icons.LaunchArrow`                                         |                                                                                                                                                                                                 |
| `launch-info`                   | `LaunchInfo`                               | `Icons.LaunchInfo`                                         |                                                                                                                                                                                                 |
| `group-layers`                  | `GroupLayers`                              | `Icons.GroupLayers`                                        |                                                                                                                                                                                                 |
| `icon-upload`                   | `Upload`                                    | `Icons.Upload`                                             |                                                                                                                                                                                                 |
| `icon-search`                   | `Search`                                    | `Icons.Search`                                             |                                                                                                                                                                                                 |
| `icon-clear-field`              | `Clear`                                     | `Icons.Clear`                                              |                                                                                                                                                                                                 |
| `icon-add`                      | `Add`                                        | `Icons.Add`                                                |                                                                                                                                                                                                 |
| `icon-close`                    | `Close`                                       | `Icons.Close`                                               |                                                                                                                                                                                                 |
| `icon-pause`                    | `Pause`                                       | `Icons.Pause`                                                |                                                                                                                                                                                                 |
| `icon-play`                     | `Play`                                       | `Icons.Play`                                                |                                                                                                                                                                                                 |
| `icon-multiple-patients`        | `MultiplePatients`                          | `Icons.MultiplePatients`                                    |                                                                                                                                                                                                 |
| `icon-settings`                 | `Settings`                                  | `Icons.Settings`                                          |                                                                                                                                                                                                 |
| `icon-more-menu`                | `More`                                      | `Icons.More`                                               |                                                                                                                                                                                                 |
| `content-prev`                  | `ContentPrev`                              | `Icons.ContentPrev`                                        |                                                                                                                                                                                                 |
| `content-next`                  | `ContentNext`                              | `Icons.ContentNext`                                        |                                                                                                                                                                                                 |
| `checkbox-checked`              | `CheckBoxChecked`                          | `Icons.CheckBoxChecked`                                   |                                                                                                                                                                                                 |
| `checkbox-unchecked`            | `CheckBoxUnchecked`                        | `Icons.CheckBoxUnchecked`                                |                                                                                                                                                                                                 |
| `checkbox-default`            | `CheckBoxUnchecked`                        |    `Icons.CheckBoxUnchecked`                             |   |
|`checkbox-active`|    `CheckBoxChecked`|   `Icons.CheckBoxChecked`|   |
| `sorting-active-up`            | `SortingAscending`                         |  `Icons.SortingAscending`                               |                                                                                                                                                                                             |
| `sorting-active-down`         | `SortingDescending`                      |   `Icons.SortingDescending`                              |                                                                                                                                                                                            |
| `sorting`                      | `Sorting`                                 |  `Icons.Sorting`                            |                                                                                                                                                                                             |
|`link`                        | `Link`                              | `Icons.Link` |    |
|`unlink`                        | `Link`                              | `Icons.Link` |     |
|`info-action`                 | `Info`                  |   `Icons.Info` |      |
|`database` |  `Database`|    `Icons.Database`|     |
|`tool-3d-rotate`|    `Tool3DRotate`| `Icons.Tool3DRotate`|   |
|`tool-angle`|    `ToolAngle`|   `Icons.ToolAngle`|   |
|`tool-annotate`|    `ToolAnnotate`|   `Icons.ToolAnnotate`|   |
|`tool-bidirectional`|   `ToolBidirectional`|  `Icons.ToolBidirectional`|      |
|`tool-calibration`|    `ToolCalibrate`|  `Icons.ToolCalibrate`|    |
|`tool-capture`|    `ToolCapture`|   `Icons.ToolCapture`|     |
|`tool-cine`|   `ToolCine`|   `Icons.ToolCine`|       |
|`tool-circle`|   `ToolCircle`|   `Icons.ToolCircle`|     |
|`tool-cobb-angle`|  `ToolCobbAngle`|    `Icons.ToolCobbAngle`|   |
|`tool-create-threshold`| `ToolCreateThreshold`  | `Icons.ToolCreateThreshold`  |   |
|`tool-crosshair`|    `ToolCrosshair`|    `Icons.ToolCrosshair`|   |
|`dicom-tag-browser`|   `ToolDicomTagBrowser` | `Icons.ToolDicomTagBrowser` |     |
|`tool-flip-horizontal`|   `ToolFlipHorizontal` | `Icons.ToolFlipHorizontal` |    |
|`tool-freehand-polygon`|    `ToolFreehandPolygon`|   `Icons.ToolFreehandPolygon`|      |
|`tool-freehand-roi`|   `ToolFreehandRoi` |   `Icons.ToolFreehandRoi`|     |
|`tool-freehand`|   `ToolFreehand`|    `Icons.ToolFreehand`|     |
|`tool-fusion-color`|    `ToolFusionColor`|    `Icons.ToolFusionColor`|     |
|`tool-invert`|   `ToolInvert`|   `Icons.ToolInvert`|     |
|`tool-layout-default`|   `ToolLayoutDefault`|  `Icons.ToolLayoutDefault`|    |
|`tool-length`|   `ToolLength`|   `Icons.ToolLength`|    |
|`tool-magnetic-roi`|   `ToolMagneticRoi` |  `Icons.ToolMagneticRoi`|   |
|`tool-magnify`|    `ToolMagnify`|   `Icons.ToolMagnify`|     |
|`tool-measure-ellipse`|   `ToolMeasureEllipse`|    `Icons.ToolMeasureEllipse`|     |
|`tool-more-menu`|   `ToolMoreMenu`|    `Icons.ToolMoreMenu`|    |
|`tool-move`|    `ToolMove`|    `Icons.ToolMove`|      |
|`tool-polygon`|   `ToolPolygon`|    `Icons.ToolPolygon`|     |
|`tool-quick-magnify`|   `ToolQuickMagnify` | `Icons.ToolQuickMagnify` |    |
|`tool-rectangle`|   `ToolRectangle` |  `Icons.ToolRectangle` |      |
|`tool-referenceLines`|   `ToolReferenceLines`| `Icons.ToolReferenceLines`|    |
|`tool-reset`|  `ToolReset`|   `Icons.ToolReset`|    |
|`tool-rotate-right`|   `ToolRotateRight`|    `Icons.ToolRotateRight`|    |
|`tool-seg-brush`|   `ToolSegBrush`|   `Icons.ToolSegBrush`|     |
|`tool-seg-eraser`|   `ToolSegEraser`|    `Icons.ToolSegEraser`|    |
|`tool-seg-shape`|  `ToolSegShape` | `Icons.ToolSegShape`|      |
|`tool-seg-threshold`|  `ToolSegThreshold` |  `Icons.ToolSegThreshold` |    |
|`tool-spline-roi`|   `ToolSplineRoi`|    `Icons.ToolSplineRoi`|    |
|`tool-stack-image-sync`|    `ToolStackImageSync`|   `Icons.ToolStackImageSync`|     |
|`tool-stack-scroll`|   `ToolStackScroll` |  `Icons.ToolStackScroll`|     |
|`tool-toggle-dicom-overlay`|    `ToolToggleDicomOverlay`|  `Icons.ToolToggleDicomOverlay`|    |
|`tool-ultrasound-bidirectional`|  `ToolUltrasoundBidirectional`|  `Icons.ToolUltrasoundBidirectional`|    |
|`tool-window-level`|   `ToolWindowLevel`|    `Icons.ToolWindowLevel`|      |
|`tool-window-region`|   `ToolWindowRegion`|    `Icons.ToolWindowRegion`|      |
|`tool-zoom` | `ToolZoom` | `Icons.ToolZoom`|       |
| `tool-layout` | `ToolLayout` | `Icons.ToolLayout` | |
|`icon-tool-eraser`|  `ToolEraser` | `Icons.ToolEraser`|      |
|`icon-tool-brush`|    `ToolBrush`|    `Icons.ToolBrush`|     |
|`icon-tool-threshold`|  `ToolThreshold` |  `Icons.ToolThreshold` |     |
|`icon-tool-shape`|    `ToolShape`|  `Icons.ToolShape` |   |
|`icon-color-lut`|   `IconColorLUT` |  `Icons.IconColorLUT` |    |
| `viewport-window-level`|`ViewportWindowLevel`|`Icons.ViewportWindowLevel`|    |
|`notifications-info`|   `NotificationInfo`|   `Icons.NotificationInfo`|      |
|`layout-advanced-3d-four-up` | `LayoutAdvanced3DFourUp` | `Icons.LayoutAdvanced3DFourUp` |    |
|`layout-advanced-3d-main` | `LayoutAdvanced3DMain` | `Icons.LayoutAdvanced3DMain` |    |
|`layout-advanced-3d-only` | `LayoutAdvanced3DOnly` | `Icons.LayoutAdvanced3DOnly`|    |
|`layout-advanced-3d-primary` | `LayoutAdvanced3DPrimary` | `Icons.LayoutAdvanced3DPrimary` |  |
|`layout-advanced-axial-primary` |`LayoutAdvancedAxialPrimary`| `Icons.LayoutAdvancedAxialPrimary` |   |
|`layout-advanced-mpr`| `LayoutAdvancedMPR` | `Icons.LayoutAdvancedMPR` |  |
|`layout-common-1x1`  | `LayoutCommon1x1` | `Icons.LayoutCommon1x1` |  |
|`layout-common-1x2`  | `LayoutCommon1x2`|`Icons.LayoutCommon1x2`|    |
|`layout-common-2x2`  | `LayoutCommon2x2`|`Icons.LayoutCommon2x2` |    |
|`layout-common-2x3`  | `LayoutCommon2x3`| `Icons.LayoutCommon2x3`|   |
|`illustration-investigational-use`|`InvestigationalUse`|`Icons.InvestigationalUse`|    |
