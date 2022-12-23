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

You need to make sure, you implement the following functions for the data
source.

```js title="platform/core/src/DataSources/IWebApiDataSource.js"
function create({
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
`extensions/default/src/DicomWebDataSource/index.js`

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
