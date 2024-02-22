import { PubSubService } from '../_shared/pubSubServiceInterface';

class AppContextService extends PubSubService {
  public static readonly EVENTS = {
    APP_CONTEXT_UPDATED: 'event::appContextUpdated',
  };

  public static REGISTRATION = {
    name: 'appContextService',
    altName: 'AppContextService',
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
}

export default AppContextService;

export type { PresentationIds };
