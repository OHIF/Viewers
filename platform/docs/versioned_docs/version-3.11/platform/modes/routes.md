---
sidebar_position: 3
sidebar_label: Routes
title: Mode Routes
summary: Documentation for OHIF Mode routes, which define URL paths, initialization logic, and layout templates for specific viewer workflows, allowing multiple modes to coexist within a single application.
---

# Mode: Routes

## Overview

Modes are tied to a specific route in the viewer, and multiple modes/routes can
be present within a single application. This makes `routes` config, THE most
important part of the mode configuration.

## Route

`@ohif/app` **compose** extensions to build applications on different routes
for the platform.

Below, you can see a simplified version of the `longitudinal` mode and the
`routes` section which has defined one `route`. Each route has three different
configuration:

- **route path**: defines the route path to access the built application for
  that route
- **route init**: hook that runs when application enters the defined route path,
  if not defined the default init function will run for the mode.
- **route layout**: defines the layout of the application for the specified
  route (panels, viewports)

```js
function modeFactory() {
  return {
    id: 'viewer',
    version: '3.0.0',
    displayName: '',
    routes: [
      {
        path: 'longitudinal',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [
                '@ohif/extension-measurement-tracking.panelModule.seriesList',
              ],
              rightPanels: [
                '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
              ],
              viewports: [
                {
                  namespace:
                    '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
                  displaySetsToDisplay: [
                    '@ohif/extension-default.sopClassHandlerModule.stack',
                  ],
                },
                {
                  namespace: '@ohif/extension-cornerstone-dicom-sr.viewportModule.dicom-sr',
                  displaySetsToDisplay: [
                    '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr',
                  ],
                },
              ],
            },
          };
        },
      },
    ],
    /*
    ...
    */
  };
}
```

### Route: path

Upon initialization the viewer will consume extensions and modes and build up
the route desired, these can then be accessed via the study list, or directly
via url parameters.

> Note: Currently, only one route is built for each mode, but we will enhance
> route creation to create separate routes based on the `path` config for each
> `route` object.

There are two types of `routes` that are created by the mode.

- Routes with dataSourceName `/${mode.id}/${dataSourceName}`
- Routes without dataSourceName `/${mode.id}`

Therefore, navigating to
`http://localhost:3000/viewer/?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1`
will run the app with the layout and functionalities of the `viewer` mode using
the `defaultDataSourceName` which is defined in the
[App Config](../../configuration/configurationFiles.md)

You can use the same exact mode using a different registered data source (e.g.,
`dicomjson`) by navigating to
`http://localhost:3000/viewer/dicomjson/?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1`

### Route: init

The mode also has an init hook, which initializes the mode. If you don't define
an `init` function the `default init` function will get run (logic is located
inside `Mode.jsx`). However, you can define you own init function following
certain steps which we will discuss next.

#### Default init

Default init function will:

- `retriveSeriesMetaData` for the `studyInstanceUIDs` that are defined in the
  URL.
- Subscribe to `instanceAdded` event, to make display sets after a series have
  finished retrieving its instances' metadata.
- Subscribe to `seriesAdded` event, to run the `HangingProtocolService` on the
  retrieves series from the study.

A _simplified_ "pseudocode" for the `defaultRouteInit` is:

```jsx
async function defaultRouteInit({
  servicesManager,
  studyInstanceUIDs,
  dataSource,
}) {
  const {
    DisplaySetService,
    HangingProtocolService,
  } = servicesManager.services;

  // subscribe to run the function after the event happens
  DicomMetadataStore.subscribe(
    'instancesAdded',
    ({ StudyInstanceUID, SeriesInstanceUID }) => {
      const seriesMetadata = DicomMetadataStore.getSeries(
        StudyInstanceUID,
        SeriesInstanceUID
      );
      DisplaySetService.makeDisplaySets(seriesMetadata.instances);
    }
  );

  studyInstanceUIDs.forEach(StudyInstanceUID => {
    dataSource.retrieve.series.metadata({ StudyInstanceUID });
  });

  DicomMetadataStore.subscribe('seriesAdded', ({ StudyInstanceUID }) => {
    const studyMetadata = // get study metadata and displaySets
    HangingProtocolService.run({studies, displaySets, activeStudy});
  });

  return unsubscriptions;
}
```

#### Writing a custom init

You can add your custom init function to enhance the default initialization for:

- Fetching annotations from a server for the current study
- Changing the initial image index of the series to be displayed at first
- Caching the next study in the work list
- Adding a custom sort for the series to be displayed on the study browser panel

and lots of other modifications.

You just need to make sure, the mode `dataSource.retrieve.series.metadata`,
`makeDisplaySets` and `run` the HangingProtocols at some point. There are
various `events` that you can subscribe to and add your custom logic. **point to
events**

For instance for jumping to the slice where a measurement is located at the
initial render, you need to follow a pattern similar to the following:

```jsx
init: async ({
  servicesManager,
  extensionManager,
  hotkeysManager,
  dataSource,
  studyInstanceUIDs,
}) => {
  const { DisplaySetService } = servicesManager.services;

  /**
  ...
  **/

  const onDisplaySetsAdded = ({ displaySetsAdded, options }) => {
    const displaySet = displaySetsAdded[0];
    const { SeriesInstanceUID } = displaySet;

    const toolData = myServer.fetchMeasurements(SeriesInstanceUID);

    if (!toolData.length) {
      return;
    }

    toolData.forEach(tool => {
      const instance = displaySet.images.find(
        image => image.SOPInstanceUID === tool.SOPInstanceUID
      );
    });

    MeasurementService.addMeasurement(/**...**/);
  };

  // subscription to the DISPLAY_SETS_ADDED
  const { unsubscribe } = DisplaySetService.subscribe(
    DisplaySetService.EVENTS.DISPLAY_SETS_ADDED,
    onDisplaySetsAdded
  );

  /**
  ...
  **/

  return unsubscriptions;
};
```

### Route: layoutTemplate

`layoutTemplate` is the last configuration for a certain route in a `mode`.
`layoutTemplate` is a function that returns an object that configures the
overall layout of the application. The returned object has two properties:

- `id`: the id of the `layoutTemplate` being used (it should have been
  registered via an extension)
- `props`: the required properties to be passed to the `layoutTemplate`.

For instance `default extension` provides a layoutTemplate that builds the app
using left/right panels and viewports. Therefore, the `props` include
`leftPanels`, `rightPanels` and `viewports` sections. Note that the
`layoutTemplate` defines the properties it is expecting. So, if you write a
`layoutTemplate-2` that accepts a footer section, its logic should be written in
the extension, and any mode that is interested in using `layoutTemplate-2`
**should** provide the `id` for the footer component.

**What module should the footer be registered?**

```js
/*
...
*/
layoutTemplate: ({ location, servicesManager }) => {
  return {
    id: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
    props: {
      leftPanels: [
        'myExtension.panelModule.leftPanel1',
        'myExtension.panelModule.leftPanel2',
      ],
      rightPanels: ['myExtension.panelModule.rightPanel'],
      viewports: [
        {
          namespace: 'myExtension.viewportModule.viewport1',
          displaySetsToDisplay: ['myExtension.sopClassHandlerModule.sop1'],
        },
        {
          namespace: 'myExtension.viewportModule.viewport2',
          displaySetsToDisplay: ['myExtension.sopClassHandlerModule.sop2'],
        },
      ],
    },
  };
};
/*
...
*/
```

:::note
You can stack multiple panel components on top of each other by providing an array of panel components in the `rightPanels` or `leftPanels` properties.

For instance we can use

```
rightPanels: [[dicomSeg.panel, tracked.measurements], [dicomSeg.panel, tracked.measurements]]
```

This will result in two panels, one with `dicomSeg.panel` and `tracked.measurements` and the other with `dicomSeg.panel` and `tracked.measurements` stacked on top of each other.

:::

## FAQ

> What is the difference between `onModeEnter` and `route.init`

`onModeEnter` gets run first than `route.init`; however, each route can have
their own `init`, but they share the `onModeEnter`.

> How can I change the `workList` appearance or add a new login page?

This is where `OHIF-v3` shines! Since the default `layoutTemplate` is written
for the viewer part, you can simply add a new `layoutTemplate` and use the
component you have written for that route. `Mode` handle showing the correct
component for the specified route.

```js
function modeFactory() {
  return {
    id: 'viewer',
    displayName: '',
    routes: [
      {
        path: 'worklist',
        init,
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: 'worklistLayout',
            props: {
              component: 'myNewWorkList',
            },
          };
        },
      },
    ],
    /*
    ...
    */
  };
}
```

> How can I navigate to (or show) a different study via the browser history/URL?

There is a command that does this: `navigateHistory`. It takes an object
argument with the `NavigateHistory` type:

```
export type NavigateHistory = {
  to: string; // the URL to navigate to
  options?: {
    replace?: boolean; // replace or add/push to history?
  };
};
```

For instance one could bind a hot key to this command to show a specific study
like this...

```
  {
    commandName: 'navigateHistory',
    commandOptions: {
      to:
        '/viewer?StudyInstanceUIDs=1.2.3',
    },
    context: 'DEFAULT',
    label: 'Nav Study',
    keys: ['n'],
    isEditable: true,
  },
```
