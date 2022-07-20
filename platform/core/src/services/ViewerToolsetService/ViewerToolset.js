const name = 'ViewerToolsetService';

const publicAPI = {
  name,
  getState: _getState,
  setIsReferenceLinesEnabled: _setIsReferenceLinesEnabled,
  setIsSeriesLinkingEnabled: _setIsSeriesLinkingEnabled,
  setIsOverlayEnabled: _setIsOverlayEnabled,
  setServiceImplementation,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setIsReferenceLinesEnabled: () =>
    console.warn('setIsReferenceLinesEnabled() NOT IMPLEMENTED'),
  _setIsSeriesLinkingEnabled: () =>
    console.warn('setIsSeriesLinkingEnabled() NOT IMPLEMENTED'),
  _setIsOverlayEnabled: () =>
    console.warn('setIsOverlayEnabled() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setIsReferenceLinesEnabled(isReferneceLinesEnabled) {
  return serviceImplementation._setIsReferenceLinesEnabled(
    isReferneceLinesEnabled
  );
}

function _setIsSeriesLinkingEnabled(isSeriesLinkingEnabled) {
  return serviceImplementation._setIsSeriesLinkingEnabled(
    isSeriesLinkingEnabled
  );
}

function _setIsOverlayEnabled(isOverlayEnabled) {
  return serviceImplementation._setIsOverlayEnabled(isOverlayEnabled);
}

function setServiceImplementation({
  getState: getStateImplementation,
  setIsReferenceLinesEnabled: setIsReferenceLinesEnabledImplementation,
  setIsSeriesLinkingEnabled: setIsSeriesLinkingEnabledImplementation,
  setIsOverlayEnabled: setIsOverlayEnabledImplementation,
}) {
  if (getStateImplementation) {
    serviceImplementation._getState = getStateImplementation;
  }
  if (setIsReferenceLinesEnabledImplementation) {
    serviceImplementation._setIsReferenceLinesEnabled = setIsReferenceLinesEnabledImplementation;
  }
  if (setIsSeriesLinkingEnabledImplementation) {
    serviceImplementation._setIsSeriesLinkingEnabled = setIsSeriesLinkingEnabledImplementation;
  }
  if (setIsOverlayEnabledImplementation) {
    serviceImplementation._setIsOverlayEnabled = setIsOverlayEnabledImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
