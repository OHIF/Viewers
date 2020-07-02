const name = 'ViewportGridService';

const publicAPI = {
  name,
  getState: _getState,
  setActiveViewportIndex: _setActiveViewportIndex,
  setDisplaysetForViewport: _setDisplaysetForViewport,
  setLayout: _setLayout,
  setCachedLayout: _setCachedLayout,
  setServiceImplementation,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setActiveViewportIndex: () =>
    console.warn('setActiveViewportIndex() NOT IMPLEMENTED'),
  _setDisplaysetForViewport: () =>
    console.warn('setDisplaysetForViewport() NOT IMPLEMENTED'),
  _setLayout: () => console.warn('setLayout() NOT IMPLEMENTED'),
  _setCachedLayout: () => console.warn('setCachedLayout() NOT IMPLEMENTED'),
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

function _setCachedLayout({ numCols, numRows, viewports }) {
  return serviceImplementation._setLayout({ numCols, numRows, viewports });
}

function setServiceImplementation({
  getState: getStateImplementation,
  setActiveViewportIndex: setActiveViewportIndexImplementation,
  setDisplaysetForViewport: setDisplaysetForViewportImplementation,
  setCachedLayout: setCachedLayoutImplementation,
  setLayout: setLayoutImplementation,
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
  if (setCachedLayoutImplementation) {
    serviceImplementation._setCachedLayout = setCachedLayoutImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};
