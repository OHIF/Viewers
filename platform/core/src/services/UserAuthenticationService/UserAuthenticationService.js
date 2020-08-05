const name = 'UserAuthenticationService';

const publicAPI = {
  name,
  getState: _getState,
  setUser: _setUser,
  getUser: _getUser,
  getAuthorizationHeader: _getAuthorizationHeader,
  setServiceImplementation,
  reset: _reset,
  set: _set,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setUser: () => console.warn('_setUser() NOT IMPLEMENTED'),
  _getUser: () => console.warn('_setUser() NOT IMPLEMENTED'),
  _getAuthorizationHeader: () => console.warn('_getAuthorizationHeader() NOT IMPLEMENTED'),
  _reset: () => console.warn('reset() NOT IMPLEMENTED'),
  _set: () => console.warn('set() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setUser(user) {
  return serviceImplementation._setUser(user);
}

function _getUser() {
  return serviceImplementation._getUser();
}

function _getAuthorizationHeader() {
  return serviceImplementation._getAuthorizationHeader();
}

function _set(state) {
  return serviceImplementation._set(state);
}

function _reset() {
  return serviceImplementation._reset({});
}

function setServiceImplementation({
  getState: getStateImplementation,
  setUser: setUserImplementation,
  getUser: getUserImplementation,
  getAuthorizationHeader: getAuthorizationHeaderImplementation,
  reset: resetImplementation,
  set: setImplementation,
}) {
  if (getStateImplementation) {
    serviceImplementation._getState = getStateImplementation;
  }
  if (setUserImplementation) {
    serviceImplementation._setUser = setUserImplementation;
  }
  if (getUserImplementation) {
    serviceImplementation._getUser = getUserImplementation;
  }
  if (getAuthorizationHeaderImplementation) {
    serviceImplementation._getAuthorizationHeader = getAuthorizationHeaderImplementation;
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
