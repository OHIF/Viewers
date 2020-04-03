import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
import dicomParser from 'dicom-parser';
import React from 'react';

export function getCornerstoneWADOImageLoader() {
  return import(
    /* webpackChunkName: "CornerstoneWADOImageLoader" */ 'cornerstone-wado-image-loader'
  );
}

let initialized = false;
export async function initCornerstoneWADOImageLoader() {
  if (initialized) return;
  const cornerstoneWADOImageLoader = await getCornerstoneWADOImageLoader();
  // For debugging
  //if (process.env.node_env === 'development') {
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

    return state.oidc.user.accesstoken;
  };

  cornerstoneWADOImageLoader.configure({
    beforeSend: function (xhr) {
      const headers = OHIF.DICOMWeb.getAuthorizationHeader();

      if (headers.Authorization) {
        xhr.setRequestHeader('Authorization', headers.Authorization);
      }
    },
  });

  const config = {
    maxWebWorkers: Math.max(navigator.hardwareConcurrency - 1, 1),
    startWebWorkersOnDemand: true,
    taskConfiguration: {
      decodeTask: {
        initializeCodecsOnStartup: false,
        usePDFJS: false,
        strict: false,
      },
    },
  };
  cornerstoneWADOImageLoader.webWorkerManager.initialize(config);

  initialized = true;
}

export function withCornerstone(Component) {
  // eslint-disable-next-line react/display-name
  return props => {
    const [
      cornerstoneWADOImageLoaderInitialized,
      setCornerstoneWADOImageLoaderInitialized,
    ] = React.useState(false);

    React.useEffect(() => {
      initCornerstoneWADOImageLoader().then(() =>
        setCornerstoneWADOImageLoaderInitialized(true)
      );
    }, []);

    if (!cornerstoneWADOImageLoaderInitialized) {
      return null;
    }
    return <Component {...props} />;
  };
}
