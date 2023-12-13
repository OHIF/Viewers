const name = 'CineService';

const publicAPI = {
  name,
  getState: _getState,
  setCine: _setCine,
  setIsCineEnabled: _setIsCineEnabled,
  playClip: _playClip,
  stopClip: _stopClip,
  onModeExit: _onModeExit,
  setServiceImplementation,
};

const serviceImplementation = {
  _getState: () => console.warn('getState() NOT IMPLEMENTED'),
  _setCine: () => console.warn('setCine() NOT IMPLEMENTED'),
  _playClip: () => console.warn('playClip() NOT IMPLEMENTED'),
  _stopClip: () => console.warn('stopClip() NOT IMPLEMENTED'),
  _setIsCineEnabled: () => console.warn('setIsCineEnabled() NOT IMPLEMENTED'),
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

function _playClip(element, playClipOptions) {
  return serviceImplementation._playClip(element, playClipOptions);
}

function _stopClip(element) {
  return serviceImplementation._stopClip(element);
}

function _onModeExit() {
  _setIsCineEnabled(false);
}

function setServiceImplementation({
  getState: getStateImplementation,
  setCine: setCineImplementation,
  setIsCineEnabled: setIsCineEnabledImplementation,
  playClip: playClipImplementation,
  stopClip: stopClipImplementation,
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

  if (playClipImplementation) {
    serviceImplementation._playClip = playClipImplementation;
  }

  if (stopClipImplementation) {
    serviceImplementation._stopClip = stopClipImplementation;
  }
}

const CineService = {
  REGISTRATION: {
    altName: name,
    name: 'cineService',
    create: ({ configuration = {} }) => {
      return publicAPI;
    },
  },
};

export default CineService;
