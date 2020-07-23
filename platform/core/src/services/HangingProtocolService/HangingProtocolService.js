const name = 'HangingProtocolService';

const publicAPI = {
  name,
  getState: _getState,
  setHangingProtocol: _setHangingProtocol,
  setHPAlreadyApplied: _setHPAlreadyApplied,
  setServiceImplementation,
  reset: _reset,
  set: _set,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setHangingProtocol: () => console.warn('_setHangingProtocol() NOT IMPLEMENTED'),
  _setHPAlreadyApplied: () => console.warn('_setHPAlreadyApplied() NOT IMPLEMENTED'),
  _reset: () => console.warn('reset() NOT IMPLEMENTED'),
  _set: () => console.warn('set() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setHangingProtocol(hangingProtocol) {
  return serviceImplementation._setHangingProtocol(hangingProtocol);
}

function _setHPAlreadyApplied(hpAlreadyApplied) {
  return serviceImplementation._setHPAlreadyApplied(hpAlreadyApplied);
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
  setHPAlreadyApplied: setHPAlreadyAppliedImplementation,
  reset: resetImplementation,
  set: setImplementation,
}) {
  if (getStateImplementation) {
    serviceImplementation._getState = getStateImplementation;
  }
  if (setHangingProtocolImplementation) {
    serviceImplementation._setHangingProtocol = setHangingProtocolImplementation;
  }
  if (setHPAlreadyAppliedImplementation) {
    serviceImplementation._setHPAlreadyApplied = setHPAlreadyAppliedImplementation;
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
