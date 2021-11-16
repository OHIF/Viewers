const name = 'ViewerToolsetService';

const publicAPI = {
  name,
  getState: _getState,
  setIsReferenceLinesEnabled: _setIsReferenceLinesEnabled,
  setIsCrosshairsEnabled: _setIsCrosshairsEnabled,
  setServiceImplementation,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setIsReferenceLinesEnabled: () =>
    console.warn('setIsReferenceLinesEnabled() NOT IMPLEMENTED'),
  _setIsCrosshairsEnabled: () =>
    console.warn('setIsCrosshairsEnabled() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setIsReferenceLinesEnabled(isReferneceLinesEnabled) {
  return serviceImplementation._setIsReferenceLinesEnabled(isReferneceLinesEnabled);
}

function _setIsCrosshairsEnabled(isCrosshairsEnabled) {
  return serviceImplementation._setIsCrosshairsEnabled(isCrosshairsEnabled);
}

function setServiceImplementation({
  getState: getStateImplementation,
  setIsReferenceLinesEnabled: setIsReferenceLinesEnabledImplementation,
  setIsCrosshairsEnabled: setIsCrosshairsEnabledImplementation,
}) {
  if (getStateImplementation) {
    serviceImplementation._getState = getStateImplementation;
  }
  if (setIsReferenceLinesEnabledImplementation) {
    serviceImplementation._setIsReferenceLinesEnabled = setIsReferenceLinesEnabledImplementation;
  }
  if (setIsCrosshairsEnabledImplementation) {
    serviceImplementation._setIsCrosshairsEnabled = setIsCrosshairsEnabledImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
