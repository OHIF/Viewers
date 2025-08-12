---
title: uiModalService
summary: Migration guide for the uiModalService in OHIF 3.10, covering props that remain unchanged, renamed props (containerDimensions to containerClassName), removed props (movable, isOpen, contentDimensions), and automatic handling of modal closing.
---


## ModalService


### Props Kept same as before

| Prop | Description |
|------|-------------|
| `content` | This is now expected to be a *React component type* (a function or class that returns JSX) |
| `contentProps` | This continues to be the way to pass data *to* your custom dialog component. However, several specific props that *used* to be passed here (like `onClose`, `actions`) are no longer valid. |
| `title` | The title text to display in the dialog header. |
| `shouldCloseOnEsc` | Allows closing the modal when the escape key is pressed. |
| `shouldCloseOnOverlayClick` | Allows closing the modal when the overlay is clicked. |

### Renamed Props:

| Prop | Description |
|------|-------------|
| `containerDimensions` | renamed to `containerClassName` |



### Removed Props:

| Prop | Description |
|------|-------------|
| `movable` | It's removed because modals shouldn't be movable. If you need to move a dialog, use `uidDialogService` and `dialogs` instead. |
| `isOpen` | always assumed `true` when `show` is called. |
| `contentDimensions` | Removed, it is now component's responsibility to set the size for the content |
| `customClassName` | renamed to `className` |
| `closeButton` | The component now manages modal closing internally. If you need a close button, you can add one, perhaps by checking out the `FooterActions` component. |


### Frequently Asked Questions

**Q: Why did my dialog's background color change?**

A: This can happen if you were previously setting the background color on the dialog's content directly. With the new API, the dialog's content is wrapped in a container. You should now pass any background or text color classes using the `containerClassName` property.

For example:
```diff
- containerClassName: 'w-[70%] max-w-[900px]',
+ containerClassName: 'w-[70%] max-w-[900px]  bg-primary-dark text-foreground',
```


**Migration Steps:**


### Rename of `containerDimensions` to `containerClassName` and removal of `contentDimensions`


Before

```js
uiModalService.show({
  title: 'Download High-Quality Image',
  content: CornerstoneViewportDownloadForm,
  contentProps: {
    activeViewportId,
  },
  containerDimensions: 'w-[70%] max-w-[900px]',
  contentDimensions: 'h-[493px] w-[460px] pl-[12px] pr-[12px]',
});
```

After: the component is responsible for setting the size

```js
function CornerstoneViewportDownloadForm({ activeViewportId }) {
  return (
    <div className="h-[493px] w-[460px] pl-[12px] pr-[12px]">
      <h2 className="text-lg font-bold">Download Image</h2>
      <p>Viewport ID: {activeViewportId}</p>
      <button className="mt-4 bg-blue-500 text-white p-2 rounded">Download</button>
    </div>
  );
}

// Show the modal
uiModalService.show({
  title: 'Download High-Quality Image',
  content: CornerstoneViewportDownloadForm,
  contentProps: { activeViewportId },
  containerClassName: 'w-[70%] max-w-[900px]',
});
```




### onClose
Previously, you had to pass in the `onClose` as `hide` function automatically added to the component.

```diff
- uiModalService.show({
-   title: 'Untrack Series',
-   content: UntrackSeriesModal,
-   contentProps: { onConfirm },
-   onClose: () => uiModalService.hide(),
- });

+ uiModalService.show({
+   title: 'Untrack Series',
+   content: UntrackSeriesModal,
+   contentProps: {
+     onConfirm,
+     hide, // passed in automatically in the background
+   },
+ });
```

6.  **Update Footer Action Buttons:**

    Previously, footer buttons might have been implemented using generic `<Button>` components. The new approach uses a dedicated `<FooterAction>` component for better structure and consistency.

    ```diff
    - <Button
    -   name="Cancel"
    -   size={ButtonEnums.size.medium}
    -   type={ButtonEnums.type.secondary}
    -   onClick={onClose}
    - > Cancel </Button>
    + <FooterAction>
    +   <FooterAction.Right>
    +     <FooterAction.Secondary onClick={hide}>Cancel</FooterAction.Secondary>
    +   </FooterAction.Right>
    + </FooterAction>
    ```

**Example: Simple Alert Modal**

This example shows how to migrate a simple alert modal.

*Before:*

```js
uiModalService.show({
  title: 'Untrack Series',
  content: UntrackSeriesModal,
  contentProps: {
    onConfirm,
    hide, // passed in automatically in the background
  },
});
```

*After:*

```js
function UntrackSeriesModal({ onConfirm, hide }) {
  return (
    <div>
      {/* Modal content */}
    </div>
  );
}

// Show the modal
uiModalService.show({
  title: 'Untrack Series',
  content: UntrackSeriesModal,
  contentProps: {
    onConfirm,
    hide, // passed in automatically in the background
  },
});
```
