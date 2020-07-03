const name = 'ViewportGridService';

const publicAPI = {
  name,
  getState: _getState,
  setActiveViewportIndex: _setActiveViewportIndex,
  setDisplaysetForViewport: _setDisplaysetForViewport,
  setLayout: _setLayout,
  setServiceImplementation,
  reset: _reset,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setActiveViewportIndex: () =>
    console.warn('setActiveViewportIndex() NOT IMPLEMENTED'),
  _setDisplaysetForViewport: () =>
    console.warn('setDisplaysetForViewport() NOT IMPLEMENTED'),
  _setLayout: () => console.warn('setLayout() NOT IMPLEMENTED'),
  _reset: () => console.warn('reset() NOT IMPLEMENTED'),
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

function _setLayout({ numCols, numRows }) {
  return serviceImplementation._setLayout({ numCols, numRows });
}

function _reset() {
  return serviceImplementation._reset({});
}

function setServiceImplementation({
  getState: getStateImplementation,
  setActiveViewportIndex: setActiveViewportIndexImplementation,
  setDisplaysetForViewport: setDisplaysetForViewportImplementation,
  setLayout: setLayoutImplementation,
  setReset: setResetImplementation,
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
  if (setLayoutImplementation) {
    serviceImplementation._setLayout = setLayoutImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
