// import OHIF from '@ohif/core';
import cornerstone from 'cornerstone-core';
// import dicomParser from 'dicom-parser';
import version from './version.js';
// import { getCornerstoneWADOImageLoader } from './utils/cornerstoneWADOImageLoader';

let homepage;
const { process } = window;
if (process && process.env && process.env.PUBLIC_URL) {
  homepage = process.env.PUBLIC_URL;
}

window.info = {
  version,
  homepage,
};

window.cornerstone = cornerstone;
// getCornerstoneWADOImageLoader().then(cornerstoneWADOImageLoader => {
//   // For debugging
//   //if (process.env.node_env === 'development') {
//   window.cornerstoneWADOImageLoader = cornerstoneWADOImageLoader;
//   //}

//   cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
//   cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

//   OHIF.user.getAccessToken = () => {
//     // TODO: Get the Redux store from somewhere else
//     const state = window.store.getState();
//     if (!state.oidc || !state.oidc.user) {
//       return;
//     }

//     return state.oidc.user.accesstoken;
//   };

//   cornerstoneWADOImageLoader.configure({
//     beforeSend: function (xhr) {
//       const headers = OHIF.DICOMWeb.getAuthorizationHeader();

//       if (headers.Authorization) {
//         xhr.setRequestHeader('Authorization', headers.Authorization);
//       }
//     },
//   });
// });
