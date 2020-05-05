export default {
  id: 'default',

  getDataSourceModule() {
    return [
      {
        name: 'dicom-web',
        type: 'webApi',
        /**
         * JSDoc for this Data Source implementation.
         * This is a JS "Factory Function"
         */
        createDataSource: () => {
          // instantiate DicomWebClient

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
  },
};
