window.config = function(props) {
  var servicesManager = props.servicesManager;

  return {
    disableMeasurementPanel: true,
    routerBasename: '/',
    enableGoogleCloudAdapter: true,
    splitQueryParameterCalls: true, // Allows the user to split QIDO SeriesInstanceUID filters into multiple calls, if the server does not support multi-valued query parameters.
    enableGoogleCloudAdapterUI: false,
    showStudyList: true,
    filterQueryParam: true,
    httpErrorHandler: error => {
      // This is 429 when rejected from the public idc sandbox too often.
      console.warn(error.status);

      // Could use services manager here to bring up a dialog/modal if needed.
      console.warn('test, navigate to https://ohif.org/');
      window.location = 'https://ohif.org/';
    },
    healthcareApiEndpoint: 'https://proxy-dot-idc-dev.appspot.com/v1beta1',
  };
};
