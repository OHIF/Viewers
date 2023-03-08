---
sidebar_position: 8
sidebar_label: Panel Service
---

# Panel Service

## Overview

The Panel Service provides for activating/showing a panel that was registered
via the `getPanelModule` extension method. Such panels can be either explicitly
activated or implicitly triggered to activate when some other event occurs.

## Events

The following events are published in `PanelService`.

| Event                 | Description                                            |
| --------------------- | ------------------------------------------------------ |
| ACTIVATE__PANEL       | Fires a `ActivatePanelEvent` when a particular panel should be activated.     |


## API

### Panel Activation

- `activatePanel`: Fires the `ACTIVATE_PANEL` event for a particular panel (id).
An optional `forceActive` flag can be passed that when `true` forces the
panel to activate. Ultimately, it is up to the panel's container whether it
is appropriate to activate the panel. For instance, if the user opened and then
closed the panel, the container may decide the user knows best and will not
open the panel.

- `addActivatePanelTriggers`: Creates and returns event subscriptions that when
fired will activate the specified panel with an optional `forceActive` flag
(see `activatePanel`). This allows for panel activation to be directly triggered
by some other event(s). When the triggers are no longer needed, simply
unsubscribe to the returned subscriptions.

### Event Subscribing

- `subscribe`: Subscribes to a particular event for a particular panel (id).
