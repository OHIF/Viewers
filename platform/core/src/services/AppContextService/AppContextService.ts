import { PubSubService } from '../_shared/pubSubServiceInterface';

class AppContextService extends PubSubService {
  public static readonly EVENTS = {
    APP_CONTEXT_UPDATED: 'event::appContextUpdated',
  };

  public static REGISTRATION = {
    name: 'appContextService',
    create: ({ configuration = {} }) => {
      return new AppContextService();
    },
  };

  serviceImplementation = {};

  constructor() {
    super(AppContextService.EVENTS);
    this.serviceImplementation = {};
  }

  public setServiceImplementation({
    getState: getStateImplementation,
    reset: resetImplementation,
    set: setImplementation,
    add: addImplementation,
    remove: removeImplementation,
  }): void {
    if (getStateImplementation) {
      this.serviceImplementation._getState = getStateImplementation;
    }

    if (resetImplementation) {
      this.serviceImplementation._reset = resetImplementation;
    }

    if (setImplementation) {
      this.serviceImplementation._set = setImplementation;
    }

    if (addImplementation) {
      this.serviceImplementation._add = addImplementation;
    }

    if (removeImplementation) {
      this.serviceImplementation._remove = removeImplementation;
    }
  }

  public getState() {
    this.serviceImplementation._getState();
  }

  public reset() {
    this.serviceImplementation._reset();
  }

  public setActiveContexts(activeContexts) {
    this.serviceImplementation._set(activeContexts);
  }

  public addActiveContexts(activeContexts) {
    this.serviceImplementation._add(activeContexts);
  }

  public removeActiveContexts(activeContexts) {
    this.serviceImplementation._remove(activeContexts);
  }

  public onModeExit() {
    this.reset();
  }
}

export default AppContextService;
