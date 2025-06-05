---
sidebar_position: 2
sidebar_label: Other Changes
summary: Migration guide for OHIF 3.11 additional changes
---


**Key Changes:**

*   **`connectToolsToMeasurementService` parameters:** The `connectToolsToMeasurementService` function from the `@ohif/cornerstone-extensions` now take different arguments.

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
