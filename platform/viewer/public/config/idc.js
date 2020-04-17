window.config = function(props) {
  var servicesManager = props.servicesManager;

  return {
    routerBasename: '/',
    enableGoogleCloudAdapter: true,
    enableGoogleCloudAdapterUI: false,
    showStudyList: true,
    httpErrorHandler: () => {
      debugger;
    },
    healthcareApiEndpoint: 'https://idc-sandbox-002.appspot.com/v1beta1',
  };
};
