// TODO: Pull in IWebClientApi from @ohif/core
// TODO: Use constructor to create an instance of IWebClientApi
// TODO: Use existing DICOMWeb configuration (previously, appConfig, to configure instance)

/**
 *
 */
function getDataSourcesModule() {
  return [
    {
      name: 'dicomweb-client',
      type: 'webApi',
      /**
       * TODO: Create JSDoc for this Data Source implementation.
       */
      createDataSource: dataSourceConfiguration => {
        // instantiate DicomWebClient
        // const dicomWebClient = new DicomWebClient(dataSourceConfiguration);

        return {
          query: {
            studies: {
              mapParams: params => params,
              searchStudies: params => {
                /** dicomWebClient.searchStudies(params) **/
              },
              searchSeries: params => {
                /** dicomWebClient.searchSeries(params) **/
              },
              processResults: results => results,
            },
          },
        };
      },
    },
  ];
}

export default getDataSourcesModule;
