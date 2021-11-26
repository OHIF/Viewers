const name = 'ViewerToolsetService';

const publicAPI = {
  name,
  getState: _getState,
  setIsReferenceLinesEnabled: _setIsReferenceLinesEnabled,
  setIsSeriesLinkingEnabled: _setIsSeriesLinkingEnabled,
  setServiceImplementation,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setIsReferenceLinesEnabled: () =>
    console.warn('setIsReferenceLinesEnabled() NOT IMPLEMENTED'),
  _setIsSeriesLinkingEnabled: () =>
    console.warn('setIsSeriesLinkingEnabled() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setIsReferenceLinesEnabled(isReferneceLinesEnabled) {
  return serviceImplementation._setIsReferenceLinesEnabled(isReferneceLinesEnabled);
}

function _setIsSeriesLinkingEnabled(isSeriesLinkingEnabled) {
  return serviceImplementation._setIsSeriesLinkingEnabled(isSeriesLinkingEnabled);
}

function setServiceImplementation({
  getState: getStateImplementation,
  setIsReferenceLinesEnabled: setIsReferenceLinesEnabledImplementation,
  setIsSeriesLinkingEnabled: setIsSeriesLinkingEnabledImplementation,
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
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
