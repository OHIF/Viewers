---
title: Commands
summary: Migration guide for commands in OHIF 3.10, covering the replacement of deleteMeasurement with removeMeasurement and setSourceViewportForReferenceLinesTool with the more generic setViewportForToolConfiguration command.
---


# Commands

## Measurements

* The `deleteMeasurement` command has been completely removed from the codebase It has been replaced by `removeMeasurement` command with enhanced functionality

1. Replace any usage of `deleteMeasurement` with `removeMeasurement` in your custom code

```diff
- commandsManager.run('deleteMeasurement', { uid });
+ commandsManager.run('removeMeasurement', { uid });
```


## Important Notes:

* This change is part of a broader refactoring of the measurement system to provide more consistent and powerful APIs
* The new command structure follows a more consistent pattern throughout the codebase
* If you were using `measurementServiceSource.remove(uid)` directly, you should now use `measurementService.remove(uid)` instead
* The changes affect both UI components and any extensions that integrate with the measurement system
* Removal functionality now works with both individual UIDs and arrays of UIDs for batch operations



## `setSourceViewportForReferenceLinesTool`

* `setSourceViewportForReferenceLinesTool` has been replaced by the more generic `setViewportForToolConfiguration`
* The new API allows configuration of any tool, not just the ReferenceLinesTool
* Tool name is now a required parameter, not hardcoded to ReferenceLinesTool

## Migration Steps:

1. Update command references from `setSourceViewportForReferenceLinesTool` to `setViewportForToolConfiguration`

```diff
- {
-   commandName: 'setSourceViewportForReferenceLinesTool',
-   context: 'CORNERSTONE',
- }

+ {
+   commandName: 'setViewportForToolConfiguration',
+   commandOptions: {
+     toolName: 'ReferenceLines'
+   },
+   context: 'CORNERSTONE',
+ }
```
