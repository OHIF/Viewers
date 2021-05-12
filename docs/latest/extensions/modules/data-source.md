# Module: Data Source



## Overview
The internal data structure of OHIF’s metadata follows naturalized DICOM JSON, A format pioneered by `dcmjs`. In short DICOM metadata headers with DICOM Keywords instead of tags and sequences as arrays, for easy development and clear code.

We have built a standard for fetching and mapping data into OHIF’s native format, which we call DataSources, and have provided one implementation of this standard.

You can make another datasource implementation which communicates to your backend and maps to OHIF’s native format, then use any existing mode on your platform. Your data doesn’t even need to be DICOM if you can map some proprietary data to the correct format.

The DataSource is also a place to add easy helper methods that platform-specific extensions can call in order to interact with the backend, meaning proprietary data interactions can be wrapped in extensions.

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




Default extension provides two main data sources that are commonly used: `dicomweb` and `dicomjson`

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
You can add your custom datasource by creating the implementation using `IWebApiDataSource.create` from `@ohif/core`. This factory function creates a new "Web API" data source that fetches data over HTTP.

You need to make sure, you implement the following functions for the data source.



```js
// platform/core/src/DataSources/IWebApiDataSource.js

function create({
  query,
  retrieve,
  store,
  reject,
  parseRouteParams,
  retrieveSeriesMetadata,
  deleteStudyMetadataPromise,
  getImageIdsForDisplaySet,
  getImageIdsForInstance,
}) {
  /* */
}
```

You can take a look at `dicomweb` data source implementation to get an idea
`extensions/default/src/DicomWebDataSource/index.js`



## DicomMetadataStore
In `OHIF-v3` we have a central location for the metadata of studies and they are located
in `DicomMetadataStore`. Your custom datasource can communicate with `DicomMetadataStore` to store, and fetch Study/Series/Instance metadata. We will learn more about `DicomMetadataStore` in services.
