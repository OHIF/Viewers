---
sidebar_position: 3
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

<!-- <div style="text-align: center;">
  <a href="/assets/img/modal-example.gif">
    <img src="/assets/img/modal-example.gif" alt="UI Modal Service Example" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>GIF showing successful call of UIModalService from an extension.</i></div>
</div> -->

![UIModalService](../../assets/img/modal-example.gif)

## Interface

For a more detailed look on the options and return values each of these methods
is expected to support, [check out it's interface in `@ohif/core`][interface]

| API Member | Description                           |
| ---------- | ------------------------------------- |
| `hide()`   | Hides the open modal                  |
| `show()`   | Shows the provided content in a modal |

## Implementations

| Implementation                     | Consumer                      |
| ---------------------------------- | ----------------------------- |
| [Modal Provider][modal-provider]\* | [OHIFModal][modal-consumer]\* |

`*` - Denotes maintained by OHIF

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
