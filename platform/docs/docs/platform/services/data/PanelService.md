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
| ACTIVATE__PANEL       | Fires a `ActivatePanelEvent` when a particular panel should be activated (i.e. shown).     |


## API

### Panel Activation

- `activatePanel`: Fires the `ACTIVATE_PANEL` event for a particular panel (id).
An optional `forceActive` flag can be passed that when `true` "forces" a
panel to show. Ultimately, it is up to a panel's container whether it
is appropriate to activate/show the panel. For instance, if the user opened and then
closed a side panel that contains the panel to activate, that side panel
may decide that the user knows best and will not open the panel (again).

- `addActivatePanelTriggers`: Creates and returns event subscriptions that when
fired will activate the specified panel with an optional `forceActive` flag
(see `activatePanel`). This allows for panel activation to be directly triggered
by some other event(s). When the triggers are no longer needed, simply
unsubscribe to the returned subscriptions. For example, a panel
for tracking measurements might get activated every time the
`MeasurementService` fires a `MEASUREMENT_ADDED` event like this:
    ```js
    panelService.addActivatePanelTriggers('measurement-tracking-panel-id', [
        sourcePubSubService: measurementService,
        sourceEvents: [
            measurementService.EVENTS.MEASUREMENT_ADDED,
            measurementService.EVENTS.RAW_MEASUREMENT_ADDED,
        ],
    ]);
    ```
