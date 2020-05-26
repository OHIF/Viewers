import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';
import dicomParser from 'dicom-parser';
import version from './version.js';
import AppContext from './context/AppContext';

export function setConfiguration(appConfig) {
  let homepage;
  const { process } = window;
  if (process && process.env && process.env.PUBLIC_URL) {
    homepage = process.env.PUBLIC_URL;
  }

  window.info = {
    version,
    homepage,
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

  OHIF.errorHandler.getHTTPErrorHandler = () => {
    // const { appConfig = {} } = AppContext;

    return appConfig.httpErrorHandler;
  };

  cornerstoneWADOImageLoader.configure({
    beforeSend: function(xhr) {
      const headers = OHIF.DICOMWeb.getAuthorizationHeader();

      if (headers.Authorization) {
        xhr.setRequestHeader('Authorization', headers.Authorization);
      }
    },
    errorInterceptor: error => {
      // const { appConfig = {} } = AppContext;

      if (typeof appConfig.httpErrorHandler === 'function') {
        appConfig.httpErrorHandler(error);
      }
    },
  });
}
