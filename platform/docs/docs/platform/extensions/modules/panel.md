---
sidebar_position: 6
sidebar_label: Panel
---

# Module: Panel

## Overview

The default LayoutTemplate has panels on the left and right sides, however one
could make a template with panels at the top or bottom and make extensions with
panels intended for such slots.

An extension can register a Panel Module by defining a `getPanelModule` method.
The panel module provides the ability to define `menuOptions` and `components`
that can be used by the consuming application. `components` are React Components
that can be displayed in the consuming application's "Panel" Component.

![panel-module-v3](../../../assets/img/panel-module-v3.png)

The `menuOptions`'s `target` key, points to a registered `components`'s `id`. A
`defaultContext` is applied to all `menuOption`s; however, each `menuOption` can
optionally provide its own `context` value.

The `getPanelModule` receives an object containing the `ExtensionManager`'s
associated `ServicesManager` and `CommandsManager`.

A `Panel` may also optionally specify a method to add a callback to notify its
parent/ancestor container when the `Panel` is ready to be shown. See
[Consuming Panels Inside Modes](#consuming-panels-inside-modes) for an example
of how this is used. To prevent memory leaks, the method to add the callback must
remove/unsubscribe any previous callback prior to adding the new callback.
In the code snippet below, the measurement panel invokes such a callback
whenever the first measurement is added.

```jsx
import PanelMeasurementTable from './PanelMeasurementTable.js';

function getPanelModule({
  commandsManager,
  extensionManager,
  servicesManager,
}) {
  const wrappedMeasurementPanel = () => {
    return (
      <PanelMeasurementTable
        commandsManager={commandsManager}
        servicesManager={servicesManager}
      />
    );
  };

  let measurementEventSubscriptions = [];

  const setMeasurementPanelContentReadyCallback = (
    callback: Types.PanelContentReadyCallback,
    servicesManager: ServicesManager
  ): void => {
    const { measurementService } = servicesManager.services;
    const measurementAddedEvents = [
      measurementService.EVENTS.MEASUREMENT_ADDED,
      measurementService.EVENTS.RAW_MEASUREMENT_ADDED,
    ];

    // Unsubscribe the previous callback.
    measurementEventSubscriptions.forEach(subscription =>
      subscription.unsubscribe()
    );
    measurementEventSubscriptions = [];

    if (!callback) {
      return;
    }

    measurementEventSubscriptions = measurementAddedEvents.map(event =>
      measurementService.subscribe(event, () => {
        // Once the first measurement is added there is no need to continue
        // listening because the panel is ready to show.
        measurementEventSubscriptions.forEach(subscription =>
          subscription.unsubscribe()
        );
        measurementEventSubscriptions = [];
        callback();
      })
    );
  };

  return [
    {
      name: 'measure',
      iconName: 'list-bullets',
      iconLabel: 'Measure',
      label: 'Measurements',
      isDisabled: studies => {}, // optional
      component: wrappedMeasurementPanel,
      setContentReadyCallback: setMeasurementPanelContentReadyCallback,
    },
  ];
}
```

## Consuming Panels Inside Modes

As explained earlier, extensions make the functionalities and components
available and `modes` utilize them to build an app. So, as seen above, we are
not actually defining which side the panel should be opened. Our extension is
providing the component with its.

New: You can easily add multiple panels to the left/right side of the viewer
using the mode configuration. As seen below, the `leftPanels` and `rightPanels`
accept an `Array` of the `IDs`. The default state of either/both the left and
right side panels may also be specified. The default state includes whether the side
panel should be closed initially and if closed initially, whether the side panel
should open as soon as one of its child panels is ready to be shown. In the code
snippet below, the right side panel is closed initially and opened whenever the
measurement panel is ready to show. Note however that once a side panel has
been opened once, no subsequent action is taken whenever one of its child
panels is ready to be shown.

```js

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
};

const id = 'viewer'
const version = '3.0.0

function modeFactory({ modeConfiguration }) {
  return {
    id,
    routes: [
      {
        path: 'longitudinal',
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id,
            props: {
              leftPanels: [
                '@ohif/extension-measurement-tracking.panelModule.seriesList',
              ],
              rightPanels: [
                '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
              ],
              rightPanelDefaultState: {
                closed: true,
                openWhenContentReady: true,
              },
              viewports,
            },
          };
        },
      },
    ],
    extensions: extensionDependencies
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;

```
