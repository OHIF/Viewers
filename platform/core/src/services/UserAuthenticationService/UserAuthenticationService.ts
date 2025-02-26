import { PubSubService } from '../_shared/pubSubServiceInterface';

class UserAuthenticationService extends PubSubService {
  public static readonly EVENTS = {};

  public static REGISTRATION = {
    name: 'userAuthenticationService',
    altName: 'UserAuthenticationService',
    create: ({ configuration = {} }) => {
      return new UserAuthenticationService();
    },
  };

  serviceImplementation = {
    _getState: () => console.warn('getState() NOT IMPLEMENTED'),
    _setUser: () => console.warn('_setUser() NOT IMPLEMENTED'),
    _getUser: () => console.warn('_getUser() NOT IMPLEMENTED'),
    _getAuthorizationHeader: () => {}, // TODO: Implement this method
    _handleUnauthenticated: () => console.warn('_handleUnauthenticated() NOT IMPLEMENTED'),
    _reset: () => console.warn('reset() NOT IMPLEMENTED'),
    _set: () => console.warn('set() NOT IMPLEMENTED'),
  };

  constructor() {
    super(UserAuthenticationService.EVENTS);
    this.serviceImplementation = {
      ...this.serviceImplementation,
    };
  }

  public getState() {
    return this.serviceImplementation._getState();
  }

  public setUser(user) {
    return this.serviceImplementation._setUser(user);
  }

  public getUser() {
    return this.serviceImplementation._getUser();
  }

  public getAuthorizationHeader() {
    return this.serviceImplementation._getAuthorizationHeader();
  }

  public handleUnauthenticated() {
    return this.serviceImplementation._handleUnauthenticated();
  }

  public reset() {
    return this.serviceImplementation._reset();
  }

  public set(state) {
    return this.serviceImplementation._set(state);
  }

  public setServiceImplementation({
    getState: getStateImplementation,
    setUser: setUserImplementation,
    getUser: getUserImplementation,
    getAuthorizationHeader: getAuthorizationHeaderImplementation,
    handleUnauthenticated: handleUnauthenticatedImplementation,
    reset: resetImplementation,
    set: setImplementation,
  }) {
    if (getStateImplementation) {
      this.serviceImplementation._getState = getStateImplementation;
    }
    if (setUserImplementation) {
      this.serviceImplementation._setUser = setUserImplementation;
    }
    if (getUserImplementation) {
      this.serviceImplementation._getUser = getUserImplementation;
    }
    if (getAuthorizationHeaderImplementation) {
      this.serviceImplementation._getAuthorizationHeader = getAuthorizationHeaderImplementation;
    }
    if (handleUnauthenticatedImplementation) {
      this.serviceImplementation._handleUnauthenticated = handleUnauthenticatedImplementation;
    }
    if (resetImplementation) {
      this.serviceImplementation._reset = resetImplementation;
    }
    if (setImplementation) {
      this.serviceImplementation._set = setImplementation;
    }
  }
}

export default UserAuthenticationService;
