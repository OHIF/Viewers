export default {
  name: 'dicom-web',
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
