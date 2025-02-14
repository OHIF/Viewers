---
title: uiDialogService
---


This guide details the migration steps for the `uiDialogService` API changes, based on the provided diff.  The most significant change is a shift from methods like `.create()` and `.dismiss()` to `.show()` and `.hide()`, alongside structural changes in how dialogs are defined and rendered. The changes aim for a more streamlined and flexible dialog management, leveraging React context for state management.

**Key Changes:**

*   **`uiDialogService.create()` and `uiDialogService.dismiss()` are deprecated.**  They have been replaced with `uiDialogService.show()` and `uiDialogService.hide()`. This change
   makes it consistent with the `uiModalService` and `uiNotificationService` APIs.
*   **`content` property now expects a React Component Type**, not an instance.  Props for the content component are passed via `contentProps`.
*   **The `dialogId` is now consistently passed as `id` within the options** to `uiDialogService.show()`.
*   **Direct manipulation of DOM elements within callbacks (e.g., focusing buttons) is discouraged.**  Favor React-based solutions within your custom components.


**Migration Steps:**

1.  **Replace `.create()` with `.show()`:**

    ```diff
    - const dialogId = uiDialogService.create({
    -   id: 'my-dialog',
    -   content: MyDialogComponent,
    -   contentProps: { prop1: 'value1' },
    -   // ... other options ...
    - });

    + uiDialogService.show({
    +   id: 'my-dialog',
    +   content: MyDialogComponent,
    +   contentProps: { prop1: 'value1' },
    +   // ... other options ...
    + });
    ```

2.  **Replace `.dismiss({ id: dialogId })` with `.hide(dialogId)`:**

    ```diff
    - uiDialogService.dismiss({ id: dialogId });

    + uiDialogService.hide(dialogId);
    ```

3. **Replace `dismissAll` with `hideAll`**
    ```diff
   - uiDialogService.dismissAll();
   + uiDialogService.hideAll();
    ```
4.  **Update Dialog Content:**

    *   Ensure your dialog content is defined as a React component (functional or class-based).
    *   Pass props to the component via `contentProps`.
    *   You don't need to pass in `onClose` or `hide` as they are now handled passed in automatically.

    ```javascript
    // Example: MyDialogComponent.tsx
    function MyDialogComponent({ prop1, hide }) {
      return (
        <div>
          <p>Value of prop1: {prop1}</p>
          <button onClick={hide}>Close</button>
        </div>
      );
    }
    ```

6.  **Replace `createReportDialogPrompt`:**

    *   The `createReportDialogPrompt` function is removed.  You now need to create a custom component for your report dialog, similar to the `ReportDialog` in the diff. The example uses the `InputDialog`, `Select` and `Label` components from `@ohif/ui-next`.

    ```javascript
    // Example: ReportDialog.tsx
    // (See diff for complete implementation)
    function ReportDialog({ dataSources, hide, onSave }) {
      const [selectedDataSource, setSelectedDataSource] = useState(dataSources[0]?.value || null);

        const handleSave = (reportName: string) => {
          onSave({
            reportName,
            dataSource: selectedDataSource,
          });
          hide();
        };

        return (
          <div className="text-foreground mt-2 flex min-w-[300px] max-w-md flex-col gap-4">
            <div className="flex flex-col gap-3">
              {dataSources.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Label htmlFor="data-source">Data Source</Label>
                  <Select
                    value={selectedDataSource}
                    onValueChange={setSelectedDataSource}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a data source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources.map(source => (
                        <SelectItem
                          key={source.value}
                          value={source.value}
                        >
                          {source.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <InputDialog>
                <InputDialog.Field>
                  <InputDialog.Input placeholder="Enter report name" />
                </InputDialog.Field>
                <InputDialog.Actions>
                  <InputDialog.ActionsSecondary onClick={hide}>Cancel</InputDialog.ActionsSecondary>
                  <InputDialog.ActionsPrimary onClick={handleSave}>Save</InputDialog.ActionsPrimary>
                </InputDialog.Actions>
              </InputDialog>
            </div>
          </div>
        );
    }

    // Usage:
    uiDialogService.show({
      id: 'report-dialog',
      title: 'Create Report',
      content: ReportDialog,
      contentProps: {
        dataSources: dataSourcesList,
        onSave: async ({ reportName, dataSource }) => { /* ... */ },
      },
    });
    ```

7.  **Replace `callInputDialog` and `showLabelAnnotationPopup`:**

    ```diff
    - import { callInputDialog } from '@ohif/extension-default';
    + import { callInputDialog, callInputDialogAutoComplete } from '@ohif/extension-default';

    - callInputDialog(uiDialogService, /* ... */);
    + const label = await callInputDialog({
    +   uiDialogService,
    +   title: 'Edit Measurement Label',
    +   // ... other options ...
    + });

    // showLabelAnnotationPopup call:
    - showLabelAnnotationPopup(measurement, uiDialogService, labelConfig, renderContent)
    -   .then( (val: Map<any, any>) => {
    +   const val = await callInputDialogAutoComplete({
        measurement,
        uiDialogService,
        labelConfig,
        renderContent,
      });
    ```
8. **Replace `colorPickerDialog`**

      ```diff
      - import colorPickerDialog from './utils/colorPickerDialog';
      - colorPickerDialog(uiDialogService, rgbaColor, (newRgbaColor, actionId) => {
      -   if (actionId === 'cancel') {
      -     return;
      -   }
      + import ColorPickerDialog from './utils/colorPickerDialog';
      + uiDialogService.show({
      +    content: colorPickerDialog,
      +    title: 'Segment Color',
      +    contentProps: {
      +      value: rgbaColor,
      +      onSave: newRgbaColor => {
    ```

9. **Replace `CornerstoneViewportDownloadForm`**

```diff
-   uiModalService.show({
-   content: CornerstoneViewportDownloadForm,
-    title: 'Download High Quality Image',
-    contentProps: {
-      activeViewportId,
-      onClose: uiModalService.hide,
-      cornerstoneViewportService,
-    },
-    containerDimensions: 'w-[70%] max-w-[900px]',
-  });
+  const CornerstoneViewportDownloadForm = customizationService.getCustomization(
+  'ohif.captureViewportModal'
+  );
+  if (uiModalService) {
+    uiModalService.show({
+      content: CornerstoneViewportDownloadForm,
+      title: 'Download High Quality Image',
+      contentProps: {
+        activeViewportId,
+        cornerstoneViewportService,
+      },
+    });
+ }
    ```

10. **Migrate dialogs that receive props**
```diff
-  uiDialogService.create({
-     content: MyDialog,
-     contentProps: { data: externalData },
+  uiDialogService.show({
+     content: MyDialog,
+     contentProps: { data: externalData, hide: () => {uiDialogService.hide('mydialog')}},
```

**Example:  Updating a Simple Alert Dialog**

```javascript
// Before (using deprecated API)
let dialogId;
const showAlert = (message) => {
  dialogId = uiDialogService.create({
    centralize: true,
    isDraggable: false,
    content: Dialog,
    contentProps: {
      title: 'Alert',
      body: () => <p>{message}</p>,
      onClose: () => uiDialogService.dismiss({ id: dialogId }),
    },
  });
};

// After (using new API)
function AlertDialog({ message, hide }) {
  return (
    <div>
      <p>{message}</p>
      <button onClick={hide}>OK</button>
    </div>
  );
}

const showAlert = (message) => {
  uiDialogService.show({
    id: 'alert-dialog',
    title: 'Alert',
    content: AlertDialog,
    contentProps: { message },
  });
};

```

**Summary:**

These changes move the `uiDialogService` to a more declarative and component-based approach. By defining your dialogs as components and using `show()` and `hide()`, you have more control over the dialog's lifecycle and appearance, and the code becomes more maintainable and readable.  The removal of direct DOM manipulation within service callbacks further encourages best practices in React development. Be mindful to create the custom components mentioned in the new API description.
