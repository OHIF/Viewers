---
sidebar_position: 1
sidebar_label: Viewport Corners
summary: Migration guide for OHIF 3.11's viewport corners customization changes, including the transition from individual item configurations to location-based arrays and the removal of index priorities.
---


Okay, here's a migration guide based on the provided diff, focusing on the introduction of `TrackingStatus`, `ModalityLoadBadge`, and `NavigationComponent`.

**Key Changes:**

*   **Deprecated `ViewportActionCornersService`**: The `ViewportActionCornersService` and its associated provider (`ViewportActionCornersProvider`) have been removed. UI elements previously managed by this service are now typically handled by dedicated components integrated via the `ToolbarService`.
*   **New Centralized UI Components**:
    *   `ModalityLoadBadge`: A new component in `@ohif/extension-cornerstone` that displays the status (e.g., SEG/RT/SR loaded or requiring hydration) and a "LOAD" button for secondary display sets (SEG, RTSTRUCT, SR). This replaces the inline status and load logic within individual viewport components like `OHIFCornerstoneSEGViewport` and `OHIFCornerstoneRTViewport`.
    *   `TrackingStatus`: A new component in `@ohif/extension-cornerstone` to indicate if measurements in a viewport are being tracked. This replaces inline tracking status indicators previously in `OHIFCornerstoneSRMeasurementViewport` and `TrackedCornerstoneViewport`.
    *   `NavigationComponent`: A new component in `@ohif/extension-cornerstone` that provides navigation arrows (e.g., for segments in SEG/RT or measurements in SR/tracked series). This replaces the `ViewportActionArrows` previously instantiated directly within viewport components.
*   **Viewport Simplification**: Viewport components like `OHIFCornerstoneSEGViewport`, `OHIFCornerstoneRTViewport`, and `OHIFCornerstoneSRMeasurementViewport` have been simplified. They no longer manage their own status indicators, load buttons, or navigation arrows. They now primarily delegate rendering to `OHIFCornerstoneViewport`.
*   **Refactored Hydration Prompts**: Utility functions like `promptHydrateSEG` and `promptHydrateRT` now use a centralized `utils.promptHydrationDialog` from `@ohif/extension-cornerstone`.
*   **Centralized Hydration Command**: A new command `hydrateSecondaryDisplaySet` has been added to `@ohif/extension-cornerstone` to handle the hydration logic for SEG, RTSTRUCT, and SR display sets.
*   **New Hooks**: Several new hooks have been introduced in `@ohif/extension-cornerstone` (e.g., `useViewportDisplaySets`, `useMeasurementTracking`, `useViewportSegmentations`, `useViewportHover`) to provide data and state for these new UI components.

**Migration Steps:**

1.  **Remove `ViewportActionCornersService` Usage**:
    *   If you were using `ViewportActionCornersService` to add custom components to viewport corners, you will need to refactor this. The recommended approach is to define these components as toolbar buttons and place them in designated viewport action menu sections (e.g., `viewportActionMenu.topLeft`) using the `ToolbarService`.
    *   The internal status components (`_getStatusComponent`) and `ViewportActionArrows` within specific viewports (SEG, RT, SR) have been removed. Their functionality is now provided by `ModalityLoadBadge`, `TrackingStatus`, and `NavigationComponent`.


3.  **Integrate New UI Components via `ToolbarService`**:
    *   The `ModalityLoadBadge`, `TrackingStatus`, and `NavigationComponent` are now registered with the `ToolbarService` within the `@ohif/extension-cornerstone`'s `getToolbarModule`.
    *   Modes (e.g., `longitudinal`) should define toolbar sections for viewport corners and add these components to those sections.

    *Example: Adding components to viewport corners in `longitudinal` mode*
    ```diff
    // modes/longitudinal/src/index.ts
    function modeFactory({ modeConfiguration }) {
      return {
        // ...
        onModeEnter: ({ servicesManager, extensionManager, commandsManager }: withAppTypes) => {
          // ...
          toolbarService.addButtons(toolbarButtons);
          toolbarService.createButtonSection('primary', [
            // ... primary tools
          ]);

    +      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.topLeft, [
    +        'orientationMenu',
    +        'dataOverlayMenu',
    +        'windowLevelMenu',
    +      ]);
    +      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.topRight, [
    +        'modalityLoadBadge',
    +        'trackingStatus',
    +        'navigationComponent',
    +      ]);
          // ...
        },
    ```
    And ensure these buttons are defined in your mode's `toolbarButtons.ts`:
    ```diff
    // modes/longitudinal/src/toolbarButtons.ts
    +  {
    +    id: 'modalityLoadBadge',
    +    uiType: 'ohif.modalityLoadBadge',
    +    props: {
    +      // ... props like icon, label, tooltip, evaluate
    +      evaluate: {
    +        name: 'evaluate.modalityLoadBadge',
    +        hideWhenDisabled: true,
    +      },
    +    },
    +  },
    +  {
    +    id: 'navigationComponent',
    +    uiType: 'ohif.navigationComponent',
    +    props: {
    +      // ... props
    +      evaluate: {
    +        name: 'evaluate.navigationComponent',
    +        hideWhenDisabled: true,
    +      },
    +    },
    +  },
    +  {
    +    id: 'trackingStatus',
    +    uiType: 'ohif.trackingStatus',
    +    props: {
    +      // ... props
    +      evaluate: {
    +        name: 'evaluate.trackingStatus',
    +        hideWhenDisabled: true,
    +      },
    +    },
    +  },
    ```


5.  **Direct Import of `OHIFCornerstoneViewport`**:
    *   Extensions that were previously getting the cornerstone viewport component dynamically via `extensionManager.getModuleEntry('@ohif/extension-cornerstone.viewportModule.cornerstone')` should now import `OHIFCornerstoneViewport` directly from `@ohif/extension-cornerstone`.

    ```diff
    // extensions/cornerstone-dicom-pmap/src/viewports/OHIFCornerstonePMAPViewport.tsx
    import PropTypes from 'prop-types';
    import React, { useCallback, useEffect, useRef, useState } from 'react';
    import { useViewportGrid } from '@ohif/ui-next';
    +import { OHIFCornerstoneViewport } from '@ohif/extension-cornerstone';

    function OHIFCornerstonePMAPViewport(props: withAppTypes) {
    // ...
      const getCornerstoneViewport = useCallback(() => {
    -    const { component: Component } = extensionManager.getModuleEntry(
    -      '@ohif/extension-cornerstone.viewportModule.cornerstone'
    -    );
    // ...
        return (
    -      <Component
    +      <OHIFCornerstoneViewport
            {...props}
            // ...
    -      ></Component>
    +      />
        );
    // ...
    ```
