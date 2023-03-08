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

An extension can also trigger to activate/open a panel via the `PanelService` -
either by explicitly calling `PanelService.activatePanel` or triggering panel
activation when some other event fires.

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

  return [
    {
      name: 'measure',
      iconName: 'list-bullets',
      iconLabel: 'Measure',
      label: 'Measurements',
      isDisabled: studies => {}, // optional
      component: wrappedMeasurementPanel,
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
right side panels may also be specified.
```js
type PanelDefaultState = {
  closed: boolean; // indicates if the default state of the panel should be hidden/closed
  openWhenPanelActivated: boolean; // if the default state is closed, indicates if the panel should be shown when it requests to be activated
}
```
The default state includes whether the side
panel should be closed initially and if closed initially, whether the side panel
should open as soon as one of its child panels requests to activate via a
`PanelService.EVENTS.ACTIVATE_PANEL` event. In the code
snippet below, the right side panel is closed initially and opened whenever the
measurement panel requests to activate. In general, once a side panel has
been opened once, no subsequent action is taken whenever one of its child
panels requests to activate. However, if the `PanelService.EVENTS.ACTIVATE_PANEL`
event has `forceActivate === true` then the side panel will activate the child
panel.

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
                openWhenPanelActivated: true,
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
