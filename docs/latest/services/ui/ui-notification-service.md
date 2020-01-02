# UI Notification Service

Notifications can be annoying and disruptive. They can also deliver timely
helpful information, or expedite the user's workflow. Here is some high level
guidance on when and how to use them:

- Notifications should be non-interfering (timely, relevant, important)
- We should only show small/brief notifications
- Notifications should be contextual to current behavior/actions
- Notifications can serve warnings (acting as a confirmation)

If you're curious about the DOs and DON'Ts of notifications, check out this
article: ["How To Design Notifications For Better UX"][ux-article]

<div style="text-align: center;">
  <a href="/assets/img/notification-example.gif">
    <img src="/assets/img/notification-example.gif" alt="UI Notification Service Example" style="margin: 0 auto; max-width: 500px;" />
  </a>
  <div><i>GIF showing successful call of UINotificationService from an extension.</i></div>
</div>

## Interface

For a more detailed look on the options and return values each of these methods
is expected to support, [check out it's interface in `@ohif/core`][interface]

| API Member | Description                             |
| ---------- | --------------------------------------- |
| `hide()`   | Hides the specified notification        |
| `show()`   | Creates and displays a new notification |

## Implementations

| Implementation                           | Consumer                                  |
| ---------------------------------------- | ----------------------------------------- |
| [Snackbar Provider][snackbar-provider]\* | [SnackbarContainer][snackbar-container]\* |

`*` - Denotes maintained by OHIF

> 3rd Party implementers may be added to this table via pull requests.

<!--
  LINKS
-->

<!-- prettier-ignore-start -->
[interface]: https://github.com/OHIF/Viewers/blob/master/platform/core/src/services/UINotificationService/index.js
[snackbar-provider]: https://github.com/OHIF/Viewers/blob/master/platform/ui/src/contextProviders/SnackbarProvider.js
[snackbar-container]: https://github.com/OHIF/Viewers/blob/master/platform/ui/src/components/snackbar/SnackbarContainer.js
[ux-article]: https://uxplanet.org/how-to-design-notifications-for-better-ux-6fb0711be54d
<!-- prettier-ignore-end -->
