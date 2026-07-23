---
sidebar_position: 4
sidebar_label: Commands
summary: Migration guide for OHIF 3.11's different commands
---



## updateStoredPositionPresentation

now uses displaySetInstanceUIDs instead of displaySetInstanceUID as a parameter.


## `loadSRMeasurements` Command

**Key Changes:**

*   The `loadSRMeasurements` command, previously part of the `@ohif/extension-cornerstone-dicom-sr` extension, has been **removed**.
*   Its functionality of hydrating a Structured Report (SR) and displaying its referenced series in a viewport is now primarily handled by the new `hydrateSecondaryDisplaySet` command available in the `@ohif/extension-cornerstone` extension.
*   The `hydrateStructuredReport` command (from `@ohif/extension-cornerstone-dicom-sr`) now solely focuses on hydrating the SR and returning its data, without directly manipulating viewports.

**Migration Steps:**

If you were previously using the `loadSRMeasurements` command to load and display SR measurements, you should update your code to use the `hydrateSecondaryDisplaySet` command.

1.  **Identify `loadSRMeasurements` Usage:**
    Locate where your code calls `commandsManager.runCommand('loadSRMeasurements', ...)`.

2.  **Update to `hydrateSecondaryDisplaySet`:**
    Replace the call to `loadSRMeasurements` with `hydrateSecondaryDisplaySet`. You will need to pass the full `displaySet` object for the SR and the target `viewportId`.

    ```diff
    - // Old way: using loadSRMeasurements
    - commandsManager.runCommand('loadSRMeasurements', {
    -   displaySetInstanceUID: srDisplaySetInstanceUID,
    -   // viewportId was implicitly the active one or not directly specifiable here
    - });
    -
    + // New way: using hydrateSecondaryDisplaySet
    + const { displaySetService, viewportGridService } = servicesManager.services;
    +
    + // 1. Get the SR displaySet object
    + const srDisplaySet = displaySetService.getDisplaySetByUID(srDisplaySetInstanceUID);
    +
    + // 2. Determine the target viewportId (e.g., active viewport)
    + const viewportId = viewportGridService.getActiveViewportId(); // Or your specific viewportId
    +
    + if (srDisplaySet && viewportId) {
    +   commandsManager.runCommand('hydrateSecondaryDisplaySet', {
    +     displaySet: srDisplaySet,
    +     viewportId: viewportId,
    +   });
    + } else {
    +   console.warn('SR DisplaySet or ViewportId not found, cannot hydrate.');
    + }
    ```

**Explanation:**

*   The `loadSRMeasurements` command was responsible for both hydrating the SR (getting its measurement data and referenced series UIDs) and then updating the viewport to show the referenced series.
*   The new `hydrateSecondaryDisplaySet` command, when given an SR `displaySet` (`displaySet.Modality === 'SR'`), will:
    1.  Internally call the `hydrateStructuredReport` command to parse the SR and get its details (including `SeriesInstanceUIDs` of referenced images).
    2.  Then, it will automatically find the corresponding image display sets for those `SeriesInstanceUIDs`.
    3.  Finally, it will update the specified `viewportId` to display the primary referenced image series.
*   This change centralizes the logic for hydrating secondary display sets (like SR, SEG, RTSTRUCT) and updating viewports into the `hydrateSecondaryDisplaySet` command within the core Cornerstone extension.

**Note on UI/Button Changes:**
The UI button typically associated with "Load SR" (often seen in viewport corners or specific contexts) has also been refactored. The hydration of SRs is now often triggered by:
*   The `TrackedMeasurementsContext` if the `@ohif/extension-measurement-tracking` is in use.
*   The new `ModalityLoadBadge` component, which can appear in viewports containing SR, SEG, or RTSTRUCT display sets, offering a "LOAD" action that calls `hydrateSecondaryDisplaySet`.

If you had custom UI invoking `loadSRMeasurements`, you'll need to adapt it to call `hydrateSecondaryDisplaySet` as described above.
