---
sidebar_position: 3
sidebar_label: UI Modal Service
title: UI Modal Service
summary: Documentation for OHIF's UI Modal Service, which enables displaying centered, non-draggable modal windows for focused user interaction, with support for custom components and content throughout the application.
---
# UI Modal Service

Modals have similar characteristics to that of Dialogs, but are often larger,
and only allow for a single instance to be viewable at once. They also tend to
be centered, and not draggable. They're commonly used when:

- We need to grab the user's attention
- We need user input
- We need to show additional information

If you're curious about the DOs and DON'Ts of dialogs and modals, check out this
article: ["Best Practices for Modals / Overlays / Dialog Windows"][ux-article]



<div style={{padding:"56.25% 0 0 0", position:"relative"}}>
    <iframe src="https://player.vimeo.com/video/843233754?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479"  frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style= {{ position:"absolute",top:0,left:0,width:"100%",height:"100%"}} title="measurement-report"></iframe>
</div>

## Interface

For a more detailed look on the options and return values each of these methods
is expected to support, [check out it's interface in `@ohif/core`][interface]

| API Member | Description                           |
| ---------- | ------------------------------------- |
| `hide()`   | Hides the open modal                  |
| `show()`   | Shows the provided content in a modal |
| `customComponent()` | Overrides the default Modal component |

## Implementations

| Implementation                     | Consumer  |
| ---------------------------------- | --------- |
| [Modal Provider][modal-provider]\* | Modal.jsx |
| customComponent | user extensions via `setServiceImplementation({customComponent: Modal})` |



### Custom Component
If you would like to customize the modal component that OHIF uses, you can register your own
component with the `customComponent` property.

```js
setServiceImplementation({customComponent: Modal})
```


> 3rd Party implementers may be added to this table via pull requests.

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[interface]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/UIModalService/index.js
[modal-provider]: https://github.com/OHIF/Viewers/blob/master/platform/ui/src/contextProviders/ModalProvider.js
[modal-consumer]: https://github.com/OHIF/Viewers/tree/master/platform/ui/src/components/ohifModal
[ux-article]: https://uxplanet.org/best-practices-for-modals-overlays-dialog-windows-c00c66cddd8c
<!-- prettier-ignore-end -->
