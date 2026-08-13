// TODO: Pull in IWebClientApi from @ohif/core
// TODO: Use constructor to create an instance of IWebClientApi
// TODO: Use existing DICOMWeb configuration (previously, appConfig, to configure instance)

import { createDicomWebApi } from './DicomWebDataSource/index';
import { createDicomJSONApi } from './DicomJSONDataSource/index';
import { createDicomLocalApi } from './DicomLocalDataSource/index';
import { createDicomWebProxyApi } from './DicomWebProxyDataSource/index';
import { createDicomZipApi } from './DicomZipDataSource/index';
import { createMergeDataSourceApi } from './MergeDataSource/index';

/**
 *
 */
function getDataSourcesModule() {
  return [
    {
      name: 'dicomweb',
      type: 'webApi',
      createDataSource: createDicomWebApi,
    },
    {
      name: 'dicomwebproxy',
      type: 'webApi',
      createDataSource: createDicomWebProxyApi,
    },
    {
      name: 'dicomjson',
      type: 'jsonApi',
      createDataSource: createDicomJSONApi,
    },
    {
      name: 'dicomlocal',
      type: 'localApi',
      createDataSource: createDicomLocalApi,
    },
    {
      name: 'chavi',
      type: 'webApi',
      createDataSource: createDicomZipApi,
    },
    {
      name: 'merge',
      type: 'mergeApi',
      createDataSource: createMergeDataSourceApi,
    },
  ];
}

export default getDataSourcesModule;
