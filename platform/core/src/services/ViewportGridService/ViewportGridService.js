const name = 'ViewportGridService';

const publicAPI = {
  name,
  getState: _getState,
  setActiveViewportIndex: _setActiveViewportIndex,
  setDisplaySetsForViewport: _setDisplaySetsForViewport,
  setDisplaySetsForViewports: _setDisplaySetsForViewports,
  setLayout: _setLayout,
  setCachedLayout: _setCachedLayout,
  restoreCachedLayout: _restoreCachedLayout,
  setServiceImplementation,
  reset: _reset,
  set: _set,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setActiveViewportIndex: () =>
    console.warn('setActiveViewportIndex() NOT IMPLEMENTED'),
  _setDisplaySetsForViewport: () =>
    console.warn('setDisplaySetsForViewport() NOT IMPLEMENTED'),
  _setDisplaySetsForViewports: () =>
    console.warn('setDisplaySetsForViewports() NOT IMPLEMENTED'),
  _setLayout: () => console.warn('setLayout() NOT IMPLEMENTED'),
  _reset: () => console.warn('reset() NOT IMPLEMENTED'),
  _setCachedLayout: () => console.warn('setCachedLayout() NOT IMPLEMENTED'),
  _restoreCachedLayout: () =>
    console.warn('_restoreCachedLayout() NOT IMPLEMENTED'),
  _set: () => console.warn('set() NOT IMPLEMENTED'),
};

function _getState() {
  return serviceImplementation._getState();
}

function _setActiveViewportIndex(index) {
  return serviceImplementation._setActiveViewportIndex(index);
}

function _setDisplaySetsForViewport({
  viewportIndex,
  displaySetInstanceUIDs,
  viewportOptions,
  displaySetOptions,
}) {
  return serviceImplementation._setDisplaySetsForViewport({
    viewportIndex,
    displaySetInstanceUIDs,
    viewportOptions,
    displaySetOptions,
  });
}

function _setDisplaySetsForViewports({ viewports }) {
  return serviceImplementation._setDisplaySetsForViewports({
    viewports,
  });
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

function _setCachedLayout({ cacheId, cachedLayout }) {
  return serviceImplementation._setCachedLayout({
    cacheId,
    cachedLayout,
  });
}

function _restoreCachedLayout(cacheId) {
  return serviceImplementation._restoreCachedLayout(cacheId);
}

function setServiceImplementation({
  getState: getStateImplementation,
  setActiveViewportIndex: setActiveViewportIndexImplementation,
  setDisplaySetsForViewport: setDisplaySetsForViewportImplementation,
  setDisplaySetsForViewports: setDisplaySetsForViewportsImplementation,
  setCachedLayout: setCachedLayoutImplementation,
  restoreCachedLayout: restoreCachedLayoutImplementation,
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
  if (setDisplaySetsForViewportImplementation) {
    serviceImplementation._setDisplaySetsForViewport = setDisplaySetsForViewportImplementation;
  }
  if (setDisplaySetsForViewportsImplementation) {
    serviceImplementation._setDisplaySetsForViewports = setDisplaySetsForViewportsImplementation;
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
  if (restoreCachedLayoutImplementation) {
    serviceImplementation._restoreCachedLayout = restoreCachedLayoutImplementation;
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
