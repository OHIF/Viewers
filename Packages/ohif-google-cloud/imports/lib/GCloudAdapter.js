import { OHIF } from 'meteor/ohif:core';

const GCloudAdapter = {};

const GCP_HEALTHCARE_CONFIG = 'GCP_HEALTHCARE_CONFIG';
let isEnabled = true;

GCloudAdapter.getConfig = function() {
  const configStr = sessionStorage.getItem(GCP_HEALTHCARE_CONFIG);
  if (configStr) return JSON.parse(configStr);
  return null;
};

GCloudAdapter.setConfig = function(config) {
  if (config) sessionStorage.setItem(GCP_HEALTHCARE_CONFIG, JSON.stringify(config));
  else sessionStorage.removeItem(GCP_HEALTHCARE_CONFIG);
};

GCloudAdapter.showDicomStorePicker = function(options) {
  return OHIF.ui.showDialog('dicomStorePicker', options).then(config => {
    if (config) {
      OHIF.gcloud.setConfig(config);
    }
    return config;
  });
};

GCloudAdapter.showUploadStudiesDialog = function() {
  return OHIF.ui.showDialog('uploadStudiesDialog')
};

const gcpConfig = GCloudAdapter.getConfig();
if (gcpConfig) {
    OHIF.servers.applyCloudServerConfig(gcpConfig);
}

GCloudAdapter.setEnabled = function(value) {
  isEnabled = value;
}

GCloudAdapter.isEnabled = function() {
  return isEnabled;
};

export default GCloudAdapter;
