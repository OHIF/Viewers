// TODO: Pull in IWebClientApi from @ohif/core
// TODO: Use constructor to create an instance of IWebClientApi
// TODO: Use existing DICOMWeb configuration (previously, appConfig, to configure instance)

import { createDicomWebApi } from './DataSources/DicomWebDataSource/index';
import { createDicomWebMinimalApi } from './DataSources/DicomWebMinimalDataSource/index';
import { createDicomJSONApi } from './DataSources/DicomJSONDataSource/index';
import { createDicomLocalApi } from './DataSources/DicomLocalDataSource/index';
import { createDicomWebProxyApi } from './DataSources/DicomWebProxyDataSource/index';
import { createMergeDataSourceApi } from './DataSources/MergeDataSource/index';

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
      name: 'dicomweb_minimal',
      type: 'webApi',
      createDataSource: createDicomWebMinimalApi,
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
      name: 'merge',
      type: 'mergeApi',
      createDataSource: createMergeDataSourceApi,
    },
  ];
}

export default getDataSourcesModule;
