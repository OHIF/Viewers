---
sidebar_position: 2
sidebar_label: Extension Manager
---

# Extension Manager

## Overview

The `ExtensionManager` is a class made available to us via the `@ohif/core`
project (platform/core). Our application instantiates a single instance of it,
and provides a `ServicesManager` and `CommandsManager` along with the
application's configuration through the appConfig key (optional).

```js
const commandsManager = new CommandsManager();
const servicesManager = new ServicesManager();
const extensionManager = new ExtensionManager({
  commandsManager,
  servicesManager,
  appConfig,
});
```
## Events
The following events get published by the `ExtensionManager`:

| Event                        | Description                                            |
| ---------------------------- | ------------------------------------------------------ |
| ACTIVE_DATA_SOURCE_CHANGED   | Fired when the active data source is changed - either replaced with an entirely different one or the existing active data source gets its definition changed via `updateDataSourceConfiguration`. |

## API
The `ExtensionManager` only has the following public API:

- `setActiveDataSource` - Sets the active data source for the application
- `getDataSources` - Returns the registered data sources
- `getActiveDataSource` - Returns the currently active data source
- `getModuleEntry` - Returns the module entry by the give id.
- `addDataSource` - Dynamically adds a data source and optionally sets it as the active data source
- `updateDataSourceConfiguration` - Updates the configuration of a specified data source (name).

### `addDataSource` Example

The following snippet of code demonstrates how `addDataSource` can be used to add a new DICOMWeb data source for the Google Healthcare Cloud API and set it as the active data source.

```js
extensionManager.addDataSource({
  namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
  sourceName: 'google',
  configuration: {
    friendlyName: 'dcmjs DICOMWeb Server',
    name: 'GCP',
    wadoUriRoot:
      'https://healthcare.googleapis.com/v1/projects/ohif-cloud-healthcare/locations/us-east4/datasets/ohif-qa-dataset/dicomStores/ohif-qa-2/dicomWeb',
    qidoRoot:
      'https://healthcare.googleapis.com/v1/projects/ohif-cloud-healthcare/locations/us-east4/datasets/ohif-qa-dataset/dicomStores/ohif-qa-2/dicomWeb',
    wadoRoot:
      'https://healthcare.googleapis.com/v1/projects/ohif-cloud-healthcare/locations/us-east4/datasets/ohif-qa-dataset/dicomStores/ohif-qa-2/dicomWeb',
    qidoSupportsIncludeField: true,
    imageRendering: 'wadors',
    thumbnailRendering: 'wadors',
    enableStudyLazyLoad: true,
    supportsFuzzyMatching: true,
    supportsWildcard: false,
    dicomUploadEnabled: true,
    omitQuotationForMultipartRequest: true,
  },
  {activate:true}
});
```

### `updateDataSourceConfiguration` Example

The following snippet of code demonstrates how `updateDataSourceConfiguration` can be use to update the configuration of an existing DICOMWeb data source (named `dicomweb`) with the configuration for a Google Healthcare Cloud API data source.

```js
extensionManager.updateDataSourceConfiguration( "dicomweb",
  {
    name: 'GCP',
    wadoUriRoot:
      'https://healthcare.googleapis.com/v1/projects/ohif-cloud-healthcare/locations/us-east4/datasets/ohif-qa-dataset/dicomStores/ohif-qa-2/dicomWeb',
    qidoRoot:
      'https://healthcare.googleapis.com/v1/projects/ohif-cloud-healthcare/locations/us-east4/datasets/ohif-qa-dataset/dicomStores/ohif-qa-2/dicomWeb',
    wadoRoot:
      'https://healthcare.googleapis.com/v1/projects/ohif-cloud-healthcare/locations/us-east4/datasets/ohif-qa-dataset/dicomStores/ohif-qa-2/dicomWeb',
    qidoSupportsIncludeField: true,
    imageRendering: 'wadors',
    thumbnailRendering: 'wadors',
    enableStudyLazyLoad: true,
    supportsFuzzyMatching: true,
    supportsWildcard: false,
    dicomUploadEnabled: true,
    omitQuotationForMultipartRequest: true,
  },
);
```
## Accessing Modules

We use `getModuleEntry` in our `ViewerLayout` logic to find the panels based on
the provided IDs in the mode's configuration.

For instance:
`extensionManager.getModuleEntry("@ohif/extension-measurement-tracking.panelModule.seriesList")`
accesses the `seriesList` panel from `panelModule` of the
`@ohif/extension-measurement-tracking` extension.

```js
const getPanelData = id => {
  const entry = extensionManager.getModuleEntry(id);
  const content = entry.component;

  return {
    iconName: entry.iconName,
    iconLabel: entry.iconLabel,
    label: entry.label,
    name: entry.name,
    content,
  };
};
```
