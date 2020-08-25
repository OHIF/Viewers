const name = 'HangingProtocolService';

const publicAPI = {
  name,
  getState: _getState,
  setHangingProtocol: _setHangingProtocol,
  setHangingProtocolAppliedForViewport: _setHangingProtocolAppliedForViewport,
  setServiceImplementation,
  reset: _reset,
  set: _set,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setHangingProtocol: () =>
    console.warn('_setHangingProtocol() NOT IMPLEMENTED'),
  _setHangingProtocolAppliedForViewport: () =>
    console.warn('_setHangingProtocolAppliedForViewport() NOT IMPLEMENTED'),
  _reset: () => console.warn('reset() NOT IMPLEMENTED'),
  _set: () => console.warn('set() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setHangingProtocol(hangingProtocol) {
  return serviceImplementation._setHangingProtocol(hangingProtocol);
}

function _setHangingProtocolAppliedForViewport(hpAlreadyApplied) {
  return serviceImplementation._setHangingProtocolAppliedForViewport(
    hpAlreadyApplied
  );
}

function _set(state) {
  return serviceImplementation._set(state);
}

function _reset() {
  return serviceImplementation._reset({});
}

function setServiceImplementation({
  getState: getStateImplementation,
  setHangingProtocol: setHangingProtocolImplementation,
  setHangingProtocolAppliedForViewport: setHangingProtocolAppliedForViewportImplementation,
  reset: resetImplementation,
  set: setImplementation,
}) {
  if (getStateImplementation) {
    serviceImplementation._getState = getStateImplementation;
  }
  if (setHangingProtocolImplementation) {
    serviceImplementation._setHangingProtocol = setHangingProtocolImplementation;
  }
  if (setHangingProtocolAppliedForViewportImplementation) {
    serviceImplementation._setHangingProtocolAppliedForViewport = setHangingProtocolAppliedForViewportImplementation;
  }
  if (resetImplementation) {
    serviceImplementation._reset = resetImplementation;
  }
  if (setImplementation) {
    serviceImplementation._set = setImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
