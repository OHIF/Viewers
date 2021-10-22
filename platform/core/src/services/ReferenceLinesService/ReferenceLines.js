const name = 'ReferenceLinesService';

const publicAPI = {
  name,
  getState: _getState,
  setIsReferenceLinesEnabled: _setIsReferenceLinesEnabled,
  setServiceImplementation,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setIsReferenceLinesEnabled: () =>
    console.warn('setIsReferenceLinesEnabled() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setIsReferenceLinesEnabled(isReferneceLinesEnabled) {
  return serviceImplementation._setIsReferenceLinesEnabled(isReferneceLinesEnabled);
}

function setServiceImplementation({
  getState: getStateImplementation,
  setIsReferenceLinesEnabled: setIsReferenceLinesEnabledImplementation,
}) {
  if (getStateImplementation) {
    serviceImplementation._getState = getStateImplementation;
  }
  if (setIsReferenceLinesEnabledImplementation) {
    serviceImplementation._setIsReferenceLinesEnabled = setIsReferenceLinesEnabledImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
