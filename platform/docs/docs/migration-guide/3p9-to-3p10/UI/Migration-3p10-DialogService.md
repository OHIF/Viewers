---
title: uiDialogService
---


## DialogService

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


---

## Components

### CreateReportDialogPrompt


**Update Function Signature and Usage:**
*   The function now takes an object as an argument with `title`, `extensionManager` and 'servicesManager', instead of separate arguments, and the `title` and `customizationService` are now optional.
*   The title can be customized in the calling function now, and defaults to `Create Report`

```typescript
// Before (in calling files, e.g., commandsModule.ts)
const promptResult = await createReportDialogPrompt(uiDialogService, { extensionManager });

// After
  const {
    value: reportName,
    dataSource: selectedDataSource,
    action,
  } = await createReportDialogPrompt(uiDialogService, {
    extensionManager,
    title: 'Store Segmentation',
  });
```
