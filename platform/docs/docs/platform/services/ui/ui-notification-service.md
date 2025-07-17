---
sidebar_position: 2
sidebar_label: UI Notification Service
title: UI Notification Service
summary: Documentation for OHIF's UI Notification Service, which provides a standardized way to display non-intrusive, contextual notifications for timely and relevant information to users throughout the application.
---
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



<div style={{padding:"56.25% 0 0 0", position:"relative"}}>
    <iframe src="https://player.vimeo.com/video/843233715?badge=0&amp;autopause=0&amp;player_id=0&amp;app_id=58479" frameBorder="0" allow="autoplay; fullscreen; picture-in-picture" allowFullScreen style= {{ position:"absolute",top:0,left:0,width:"100%",height:"100%"}} title="measurement-report"></iframe>
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
