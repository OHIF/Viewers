import OHIF from '@ohif/core';
import version from './version.js';

let homepage;
const { process } = window;
if (process && process.env && process.env.PUBLIC_URL) {
  homepage = process.env.PUBLIC_URL;
}

window.info = {
  version,
  homepage,
};

OHIF.user.getAccessToken = () => {
  // TODO: Get the Redux store from somewhere else
  const state = window.store.getState();
  if (!state.oidc || !state.oidc.user) {
    return;
  }

  return state.oidc.user.access_token;
};
