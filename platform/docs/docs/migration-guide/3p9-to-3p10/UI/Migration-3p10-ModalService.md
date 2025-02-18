---
title: uiModalService
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


### Removed Props:

| Prop | Description |
|------|-------------|
| `movable` | It's removed because modals shouldn't be movable. If you need to move a dialog, use `uidDialogService` and `dialogs` instead. |
| `isOpen` | always assumed `true` when `show` is called. |
| `containerDimensions` | Removed, it is now component's responsibility to set the size |
| `contentDimensions` | Removed, it is now component's responsibility to set the size |
| `customClassName` | renamed to `className` |
| `closeButton` | The component now manages modal closing internally. If you need a close button, you can add one, perhaps by checking out the `FooterActions` component. |




**Migration Steps:**


### Removal of `containerDimensions` and `contentDimensions`


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
    <div className="w-[70%] max-w-[900px] h-[493px] p-4 bg-white rounded-lg shadow-lg">
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
