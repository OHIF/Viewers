import OHIF from 'ohif-core';
import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import version from './version.js';

window.info = {
  version,
  homepage: `${process.env.PUBLIC_URL}`,
};

// For debugging
//if (process.env.node_env === 'development') {
window.cornerstone = cornerstone;
window.cornerstoneWADOImageLoader = cornerstoneWADOImageLoader;
//}

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

OHIF.user.getAccessToken = () => {
  // TODO: Get the Redux store from somewhere else
  const state = window.store.getState();
  if (!state.oidc || !state.oidc.user) {
    return;
  }

  return state.oidc.user.access_token;
};

cornerstoneWADOImageLoader.configure({
  beforeSend: function(xhr) {
    const headers = OHIF.DICOMWeb.getAuthorizationHeader();

    if (headers.Authorization) {
      xhr.setRequestHeader('Authorization', headers.Authorization);
    }
  },
});
