---
sidebar_position: 3
sidebar_label: Data Source
---

# Module: Data Source

## Overview

We have built couple of methods for fetching and mapping data into OHIF’s native
format, which we call DataSources, and have provided one implementation of this
standard.

You can make another datasource implementation which communicates to your
backend and maps to OHIF’s native format, then use any existing mode on your
platform. Your data doesn’t even need to be DICOM if you can map some
proprietary data to the correct format.

The DataSource is also a place to add easy helper methods that platform-specific
extensions can call in order to interact with the backend, meaning proprietary
data interactions can be wrapped in extensions.

```js
const getDataSourcesModule = () => [
  {
    name: 'exampleDataSource',
    type: 'webApi', // 'webApi' | 'local' | 'other'
    createDataSource: dataSourceConfig => {
      return IWebApiDataSource.create(/* */);
    },
  },
];
```

Default extension provides two main data sources that are commonly used:
`dicomweb` and `dicomjson`

```js
import { createDicomWebApi } from './DicomWebDataSource/index.js';
import { createDicomJSONApi } from './DicomJSONDataSource/index.js';

function getDataSourcesModule() {
  return [
    {
      name: 'dicomweb',
      type: 'webApi',
      createDataSource: createDicomWebApi,
    },
    {
      name: 'dicomjson',
      type: 'jsonApi',
      createDataSource: createDicomJSONApi,
    },
  ];
}
```

## Custom DataSource

You can add your custom datasource by creating the implementation using
`IWebApiDataSource.create` from `@ohif/core`. This factory function creates a
new "Web API" data source that fetches data over HTTP.

```js title="platform/core/src/DataSources/IWebApiDataSource.js"
function create({
  initialize,
  query,
  retrieve,
  store,
  reject,
  parseRouteParams,
  deleteStudyMetadataPromise,
  getImageIdsForDisplaySet,
  getImageIdsForInstance,
}) {
  /* */
}
```

You can take a look at `dicomweb` data source implementation to get an idea
`extensions/default/src/DicomWebDataSource/index.js` but here here are some
important api endpoints that you need to implement:

- `initialize`: This method is called when the data source is first created in the mode.tsx, it is used to initialize the data source and set the configuration. For instance, `dicomwebDatasource` uses this method to grab the StudyInstanceUID from the URL and set it as the active study, as opposed to `dicomJSONDatasource` which uses url in the browser to fetch the data and store it in a cache
- `query.studies.search`: This is used in the study panel on the left to fetch the prior studies for the same MRN which is then used to display on the `All` tab. it is also used in the Worklist to show all the studies from the server.
- `query.series.search`: This is used to fetch the series information for a given study that is expanded in the Worklist.
- `retrieve.bulkDataURI`: used to render RTSTUCTURESET in the viewport.
- `retrieve.series.metadata`: It is a crucial end point that is used to fetch series level metadata which for hanging displaySets and displaySet creation.
- `store.dicom`: If you don't need store functionality, you can skip this method. This is used to store the data in the backend.

## Static WADO Client

If the configuration for the data source has the value staticWado set, then it
is assumed that queries for the studies return a super-set of the studies, as it
is assumed to be returning a static list. The StaticWadoClient performs the
search functionality manually, by interpreting the query parameters and then
applying them to the returned response. This functionality may be useful for
other types of DICOMweb back ends, where they are capable of performing queries,
but don't allow for querying certain types of fields. However, that only works
as long as the size of the studies list isn't too large that client side
selection isn't too expensive.

## DicomMetadataStore

In `OHIF-v3` we have a central location for the metadata of studies, and they are
located in `DicomMetadataStore`. Your custom datasource can communicate with
`DicomMetadataStore` to store, and fetch Study/Series/Instance metadata. We will
learn more about `DicomMetadataStore` in services.

## Adding a Data Source Outside a Module

A data source can be added outside a module via `ExtensionManager.addDataSource`.
The following snippet of code demonstrates how `addDataSource` can be used to add
a new DICOMWeb data source for the Google Cloud Healthcare API and set it as the
active data source.

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

## Updating a Data Source's Configuration

An existing data source can have its configuration updated using the
`ExtensionManager.updateDataSourceConfiguration` method. The following snippet of
code demonstrates how `updateDataSourceConfiguration` can be use to update the
configuration of an existing DICOMWeb data source (named `dicomweb`) with the
configuration for a Google Cloud Healthcare API data source.

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

## Merge Data Source
The built-in merge data source is a useful tool for combining results from multiple data sources.
Currently, this data source only supports merging at the series level. This means that series from data source 'A'
and series from data source 'B' will be retrieved under the same study. If the same series exists in both data sources,
the first series arrived is the one that gets stored, and any other conflicting series will be ignored.

The merge data source is particularly useful when dealing with derived data that is generated and stored in different servers.
For example, it can be used to retrieve annotation series from one data source and input data (images) from another data source.

A default data source can be defined as shown below. This allows defining which of the servers should be the
fallback server in case something goes wrong.

Configuration Example:
```js
window.config = {
  ...
  dataSources: [
    {
      sourceName: 'merge',
      namespace: '@ohif/extension-default.dataSourcesModule.merge',
      configuration: {
        name: 'merge',
        friendlyName: 'Merge dicomweb-1 and dicomweb-2 data at the series level',
        seriesMerge: {
          dataSourceNames: ['dicomweb-1', 'dicomweb-2'],
          defaultDataSourceName: 'dicomweb-1'
        },
      },
    },
    {
      sourceName: 'dicomweb-1',
      ...
    },
    {
      sourceName: 'dicomweb-2',
      ...
    },
  ],
};
```
