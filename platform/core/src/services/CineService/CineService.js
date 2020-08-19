const name = 'CineService';

const publicAPI = {
  name,
  getState: _getState,
  setCine: _setCine,
  setIsCineEnabled: _setIsCineEnabled,
  setServiceImplementation,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setCine: () =>
    console.warn('setCine() NOT IMPLEMENTED'),
  _setIsCineEnabled: () =>
    console.warn('setIsCineEnabled() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setCine({ id, frameRate, isPlaying }) {
  return serviceImplementation._setCine({ id, frameRate, isPlaying });
}

function _setIsCineEnabled(isCineEnabled) {
  return serviceImplementation._setIsCineEnabled(isCineEnabled);
}

function setServiceImplementation({
  getState: getStateImplementation,
  setCine: setCineImplementation,
  setIsCineEnabled: setIsCineEnabledImplementation,
}) {
  if (getStateImplementation) {
    serviceImplementation._getState = getStateImplementation;
  }
  if (setCineImplementation) {
    serviceImplementation._setCine = setCineImplementation;
  }
  if (setIsCineEnabledImplementation) {
    serviceImplementation._setIsCineEnabled = setIsCineEnabledImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
