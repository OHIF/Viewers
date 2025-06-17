---
sidebar_position: 2
sidebar_label: Other Changes
summary: Migration guide for OHIF 3.11 additional changes
---


**Key Changes:**

*   **`connectToolsToMeasurementService` parameters:** The `connectToolsToMeasurementService` function from the `@ohif/cornerstone-extensions` now take different arguments.
*   **`data-viewportId`** The `data-viewportId` naming was not compliant with react and was causing warnings.  Rename references to `data-viewportid`.

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
