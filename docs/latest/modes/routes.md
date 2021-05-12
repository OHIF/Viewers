# Mode: Routes

- [Mode: Routes](#mode-routes)
  - [Overview](#overview)
  - [Route](#route)
    - [Route: path](#route-path)
    - [Route: init](#route-init)
    - [Route: layoutTemplate](#route-layouttemplate)
  - [FAQ](#faq)

## Overview

Modes are tied to a specific route in the viewer, and multiple modes/routes can be present within a single application. This makes `routes` config, THE most important part of the mode configuration.

## Route
`@ohif/viewer` **compose** extensions to build applications on different routes for the platform.

Below, you can see a simplified version of the `longitudinal` mode and the `routes` section
which has defined one `route`. Each route has three different configuration:

- **route path**: defines the route path to access the built application for that route
- **route init**: hook that runs when application enters the defined route path, if not defined the default init function will run for the mode.
- **route layout**: defines the layout of the application for the specified route (panels, viewports)


```js
export default function mode() {
  return {
    id: 'viewer',
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
                'org.ohif.measurement-tracking.panelModule.seriesList',
              ],
              rightPanels: [
                'org.ohif.measurement-tracking.panelModule.trackedMeasurements',
              ],
              viewports: [
                {
                  namespace:
                    'org.ohif.measurement-tracking.viewportModule.cornerstone-tracked',
                  displaySetsToDisplay: [
                    'org.ohif.default.sopClassHandlerModule.stack',
                  ],
                },
                {
                  namespace: 'org.ohif.dicom-sr.viewportModule.dicom-sr',
                  displaySetsToDisplay: [
                    'org.ohif.dicom-sr.sopClassHandlerModule.dicom-sr',
                  ],
                },
              ],
            },
          }
        },
      },
    ],
    /*
    ...
    */
  }
}
```

### Route: path
Upon initialization the viewer will consume extensions and modes and build up the route desired, these can then be accessed via the study list, or directly via url parameters.

> Note: Currently, only one route is built for each mode, but we will enhance route
> creation to create separate routes based on the `path` config for each `route` object.

There are two types of `routes` that are created by the mode.

- Routes with dataSourceName `/${mode.id}/${dataSourceName}`
- Routes without dataSourceName `/${mode.id}`

Therefore navigating to `http://localhost:3000/viewer/?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1` will run the app with the `viewer` mode layout and functionalities using the `defaultDataSourceName` which is defined in the [App Config](../configuring/index.md)

You can use the same exact mode using a different data source (e.g., `dicomjson`) by navigating to `http://localhost:3000/viewer/dicomjson/?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1`



### Route: init
The mode also has an init hook, which initializes the mode. For now this is just used to configure the toolbar, but may have more uses in the future.

### Route: layoutTemplate




## FAQ
> What is the difference between `onModeEnter` and `route.init`
