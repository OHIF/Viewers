window.config = function(props) {
  var servicesManager = props.servicesManager;

  return {
    routerBasename: '/',
    enableGoogleCloudAdapter: true,
    enableGoogleCloudAdapterUI: false,
    showStudyList: true,
    httpErrorHandler: error => {
      // This is 429 when rejected from the public idc sandbox too often.
      console.warn(error.status);

      // Could use services manager here to bring up a dialog/modal if needed.
      console.warn('test, navigate to https://ohif.org/');
      window.location = 'https://ohif.org/';
    },
    healthcareApiEndpoint: 'https://idc-sandbox-002.appspot.com/v1beta1',
  };
};
