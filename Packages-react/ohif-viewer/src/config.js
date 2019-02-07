import dicomParser from 'dicom-parser';
import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import cornerstoneMath from 'cornerstone-math';
import OHIF from 'ohif-core';
import sha from './sha.js';
import version from './version.js';
import { homepage } from '../package.json';

window.info = {
  sha,
  version,
  homepage
};

// For debugging
window.cornerstone = cornerstone;
window.cornerstoneWADOImageLoader = cornerstoneWADOImageLoader;

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

OHIF.external.cornerstone = cornerstone;
OHIF.external.cornerstoneMath = cornerstoneMath;
OHIF.external.cornerstoneWADOImageLoader = cornerstoneWADOImageLoader;

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
  }
});
