const name = 'ViewportGridService';

const publicAPI = {
  name,
  hide: _hide,
  show: _show,
  setServiceImplementation,
};

const serviceImplementation = {
  _hide: () => console.warn('hide() NOT IMPLEMENTED'),
  _show: () => console.warn('show() NOT IMPLEMENTED'),
};

function _show({ viewportIndex, type, message, actions, onSubmit }) {
  return serviceImplementation._show({
    viewportIndex,
    type,
    message,
    actions,
    onSubmit,
  });
}

function _hide() {
  return serviceImplementation._hide();
}

function setServiceImplementation({
  hide: hideImplementation,
  show: showImplementation,
}) {
  if (hideImplementation) {
    serviceImplementation._hide = hideImplementation;
  }
  if (showImplementation) {
    serviceImplementation._show = showImplementation;
  }
}

export default {
  name,
  create: ({ configuration = {} }) => {
    return publicAPI;
  },
};

// initialState={{
//   numRows: 1,
//   numCols: 1,
//   viewports: [],
//   activeViewportIndex: 0,
// }}
// reducer={viewportGridReducer}
