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


### Props Kept same as before

| Prop | Description |
|------|-------------|
| `id` | Still required, but we don't return it from the `show` method anymore.  |
| `content` | This is now expected to be a *React component type* (a function or class that returns JSX) |
| `contentProps` | This continues to be the way to pass data *to* your custom dialog component. However, several specific props that *used* to be passed here (like `onClose`, `actions`) are no longer valid. |
| `isDraggable` | Controls whether the dialog can be moved by dragging. |
| `defaultPosition` | Allows you to specify an initial `{ x, y }` position for the dialog. |
| `title` | The title text to display in the dialog header. |
| `showOverlay` | default true - if the dialog is draggable the overlay is not shown by default |


### Removed Props:

| Prop | Description |
|------|-------------|
| `centralize` | Dialogs are now centered by default via CSS if you don't want center you pass defaultPosition |
| `preservePosition` | Work in progress and will be available in future |
| `containerDimensions` | Removed - should be specified directly in dialogs |
| `contentDimensions` | Removed - should be specified directly in dialogs |
| `onStart` | Removed  |
| `onDrag` | Removed  |
| `onStop` | Removed  |
| `onClickOutside` | Removed - if you want to close the dialog on click outside, you can use the `shouldCloseOnOverlayClick` prop |


### New Props:

| Prop | Description |
|------|-------------|
| `unstyled` | A boolean prop to render the dialog without the default styling. It is used for context menu dialogs |
| `shouldCloseOnEsc` | Default off for dialogs - Controls whether pressing the Escape key will close the dialog. |
| `shouldCloseOnOverlayClick` | Default off for dialogs - Controls whether clicking the overlay background will close the dialog. |


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

**Key Changes:**

*   **Function Signature Update:** The function now accepts an object with `servicesManager`, `extensionManager`,  `title`(optional).
*   **Return Value Structure:** The function now returns an object containing `value` (the report name), `dataSourceName` (the selected data source, if applicable), and `action` (indicating the user's choice).

**Migration Steps:**

1.  **Update Function Call:**

    Previously, the function was called with separate arguments. You should now pass an object:

    ```diff
    - const promptResult = await createReportDialogPrompt(uiDialogService, {
    -   extensionManager,
    - });

    + const {
    +  value: reportName,
    +  dataSourceName: selectedDataSource,
    +  action,
    + } = await createReportDialogPrompt({
    +   servicesManager,
    +   extensionManager,
    +   title: 'Store Segmentation', // Optional title
    + });

    ```
