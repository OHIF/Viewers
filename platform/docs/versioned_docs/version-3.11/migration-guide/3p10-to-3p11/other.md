---
sidebar_position: 2
sidebar_label: Other Changes
summary: Migration guide for OHIF 3.11 additional changes
---


**Key Changes:**

*   **`connectToolsToMeasurementService` parameters:** The `connectToolsToMeasurementService` function from the `@ohif/cornerstone-extensions` now take different arguments.
*   **`data-viewportId`** The `data-viewportId` naming was not compliant with react and was causing warnings.  Rename references to `data-viewportid`.
*   **`setIsReferenceViewable`** is no longer available or required by ViewportGridService.  Instead, the cornerstone viewports
    themselves provide the isReferenceViewable.  This occurs because there were a lot more deciding issues to navigate to viewports than could be added to viewport grid service.
*   **`JUMP_TO_MEASUREMENT_VIEWPORT` and `JUMP_TO_MEASUREMENT_LAYOUT`** are combined into `JUMP_TO_MEASUREMENT` with no
    consume event.  Only the single event is fired.  This will need to be handled to redirect the changes to the appropriate viewport type as it was not possible to figure that out with generic information available in `ViewportGridService`

**Migration Steps:**

1.  **Update `connectToolsToMeasurementService` Method Calls:**
    *   Now the connectToolsToMeasurementService receives all service object arguments (servicesManager, commandsManager and extensionManager).

    ```diff
    // Before
    - connectToolsToMeasurementService(servicesManager);

    // After
    + connectToolsToMeasurementService({
    +   servicesManager,
    +   commandsManager,
    +   extensionsManager
    + });
    ```

**Images sort by position patient**

The ImageSet sort has been modified: images are now sorted by ImagePositionPatient by default. If ImagePositionPatient is not available, the sort will fall back to InstanceNumber.

**To revert to the previous sorting method, you can add the customization instanceSortingCriteria as shown below:**

```
    customizationService.setCustomizations({
        'instanceSortingCriteria': {
          $set: {defaultSortFunctionName: 'default'},
        },
      });
```
