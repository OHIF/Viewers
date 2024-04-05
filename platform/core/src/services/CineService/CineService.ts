import { PubSubService } from '../_shared/pubSubServiceInterface';

class CineService extends PubSubService {
  public static readonly EVENTS = {
    CINE_STATE_CHANGED: 'event::cineStateChanged',
  };

  public static REGISTRATION = {
    name: 'cineService',
    altName: 'CineService',
    create: ({ configuration = {} }) => {
      return new CineService();
    },
  };

  serviceImplementation = {};

  constructor() {
    super(CineService.EVENTS);
    this.serviceImplementation = {};
  }

  public getState() {
    return this.serviceImplementation._getState();
  }

  public setCine({ id, frameRate, isPlaying }) {
    return this.serviceImplementation._setCine({ id, frameRate, isPlaying });
  }

  public setIsCineEnabled(isCineEnabled) {
    this.serviceImplementation._setIsCineEnabled(isCineEnabled);
    // Todo: for some reason i need to do this setTimeout since the
    // reducer state does not get updated right away and if we publish the
    // event and we use the cineService.getState() it will return the old state
    setTimeout(() => {
      this._broadcastEvent(this.EVENTS.CINE_STATE_CHANGED, isCineEnabled);
    }, 0);
  }

  public playClip(element, playClipOptions) {
    return this.serviceImplementation._playClip(element, playClipOptions);
  }

  public stopClip(element) {
    return this.serviceImplementation._stopClip(element);
  }

  public _onModeExit() {
    this.setIsCineEnabled(false);
  }

  public setServiceImplementation({
    getState: getStateImplementation,
    setCine: setCineImplementation,
    setIsCineEnabled: setIsCineEnabledImplementation,
    playClip: playClipImplementation,
    stopClip: stopClipImplementation,
  }) {
    if (getStateImplementation) {
      this.serviceImplementation._getState = getStateImplementation;
    }
    if (setCineImplementation) {
      this.serviceImplementation._setCine = setCineImplementation;
    }
    if (setIsCineEnabledImplementation) {
      this.serviceImplementation._setIsCineEnabled = setIsCineEnabledImplementation;
    }

    if (playClipImplementation) {
      this.serviceImplementation._playClip = playClipImplementation;
    }

    if (stopClipImplementation) {
      this.serviceImplementation._stopClip = stopClipImplementation;
    }
  }
}

export default CineService;
