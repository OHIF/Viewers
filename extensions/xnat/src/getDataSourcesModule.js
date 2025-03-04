// TODO: Pull in IWebClientApi from @ohif/core
// TODO: Use constructor to create an instance of IWebClientApi
// TODO: Use existing DICOMWeb configuration (previously, appConfig, to configure instance)

import { createDicomWebApi } from './DicomWebDataSource/index';
import { createDicomJSONApi } from './DicomJSONDataSource/index';
import { createDicomLocalApi } from './DicomLocalDataSource/index';
import { createDicomWebProxyApi } from './DicomWebProxyDataSource/index';

/**
 *
 */
function getDataSourcesModule() {
  return [
    {
      name: 'xnat',  // This matches the sourceName in config
      type: 'webApi',
      createDataSource: createDicomWebApi,
    },
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
  ];
}

export default getDataSourcesModule;
