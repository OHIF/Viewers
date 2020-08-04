const name = 'ViewportGridService';

const publicAPI = {
  name,
  getState: _getState,
  setActiveViewportIndex: _setActiveViewportIndex,
  setDisplaysetForViewport: _setDisplaysetForViewport,
  setCineForViewport: _setCineForViewport,
  setIsCineEnabled: _setIsCineEnabled,
  setLayout: _setLayout,
  setCachedLayout: _setCachedLayout,
  setServiceImplementation,
  reset: _reset,
  set: _set,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setActiveViewportIndex: () =>
    console.warn('setActiveViewportIndex() NOT IMPLEMENTED'),
  _setDisplaysetForViewport: () =>
    console.warn('setDisplaysetForViewport() NOT IMPLEMENTED'),
  _setCineForViewport: () =>
    console.warn('setDisplaysetForViewport() NOT IMPLEMENTED'),
  _setIsCineEnabled: () =>
    console.warn('setIsCineEnabled() NOT IMPLEMENTED'),
  _setLayout: () => console.warn('setLayout() NOT IMPLEMENTED'),
  _reset: () => console.warn('reset() NOT IMPLEMENTED'),
  _setCachedLayout: () => console.warn('setCachedLayout() NOT IMPLEMENTED'),
  _set: () => console.warn('set() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setActiveViewportIndex(index) {
  return serviceImplementation._setActiveViewportIndex(index);
}

function _setDisplaysetForViewport({ viewportIndex, displaySetInstanceUID }) {
  return serviceImplementation._setDisplaysetForViewport({
    viewportIndex,
    displaySetInstanceUID,
  });
}

function _setCineForViewport({ viewportIndex, cine }) {
  return serviceImplementation._setCineForViewport({
    viewportIndex,
    cine,
  });
}

function _setIsCineEnabled(isCineEnabled) {
  return serviceImplementation._setIsCineEnabled(isCineEnabled);
}

function _setLayout({ numCols, numRows }) {
  return serviceImplementation._setLayout({ numCols, numRows });
}

function _set(state) {
  return serviceImplementation._set(state);
}

function _reset() {
  return serviceImplementation._reset({});
}

function _setCachedLayout({ numCols, numRows, viewports }) {
  return serviceImplementation._setLayout({ numCols, numRows, viewports });
}

function setServiceImplementation({
  getState: getStateImplementation,
  setActiveViewportIndex: setActiveViewportIndexImplementation,
  setDisplaysetForViewport: setDisplaysetForViewportImplementation,
  setCineForViewport: setCineForViewportImplementation,
  setIsCineEnabled: setIsCineEnabledImplementation,
  setCachedLayout: setCachedLayoutImplementation,
  setLayout: setLayoutImplementation,
  reset: resetImplementation,
  set: setImplementation,
}) {
  if (getStateImplementation) {
    serviceImplementation._getState = getStateImplementation;
  }
  if (setActiveViewportIndexImplementation) {
    serviceImplementation._setActiveViewportIndex = setActiveViewportIndexImplementation;
  }
  if (setDisplaysetForViewportImplementation) {
    serviceImplementation._setDisplaysetForViewport = setDisplaysetForViewportImplementation;
  }
  if (setCineForViewportImplementation) {
    serviceImplementation._setCineForViewport = setCineForViewportImplementation;
  }
  if (setIsCineEnabledImplementation) {
    serviceImplementation._setIsCineEnabled = setIsCineEnabledImplementation;
  }
  if (setLayoutImplementation) {
    serviceImplementation._setLayout = setLayoutImplementation;
  }
  if (resetImplementation) {
    serviceImplementation._reset = resetImplementation;
  }
  if (setCachedLayoutImplementation) {
    serviceImplementation._setCachedLayout = setCachedLayoutImplementation;
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
