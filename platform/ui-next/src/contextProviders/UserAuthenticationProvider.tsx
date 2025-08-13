import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';

const DEFAULT_STATE = {
  user: null,
  enabled: false,
};

export const UserAuthenticationContext = createContext(DEFAULT_STATE);

export function UserAuthenticationProvider({ children, service }) {
  const userAuthenticationReducer = (state, action) => {
    switch (action.type) {
      case 'SET_USER': {
        return {
          ...state,
          ...{ user: action.payload.user },
        };
      }
      case 'RESET': {
        return {
          user: null,
        };
      }

      case 'SET': {
        return {
          ...state,
          ...action.payload,
        };
      }

      default:
        return action.payload;
    }
  };

  const [userAuthenticationState, dispatch] = useReducer(userAuthenticationReducer, DEFAULT_STATE);

  const getState = useCallback(() => userAuthenticationState, [userAuthenticationState]);

  const setUser = useCallback(
    user =>
      dispatch({
        type: 'SET_USER',
        payload: {
          user,
        },
      }),
    [dispatch]
  );

  const getUser = useCallback(() => userAuthenticationState.user, [userAuthenticationState]);

  const reset = useCallback(
    () =>
      dispatch({
        type: 'RESET',
        payload: {},
      }),
    [dispatch]
  );

  const set = useCallback(
    payload =>
      dispatch({
        type: 'SET',
        payload,
      }),
    [dispatch]
  );

  /**
   * Sets the implementation of the UserAuthenticationService that can be used by extensions.
   *
   * @returns void
   */
  // TODO: should this be a useEffect or not?
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        getState,
        setUser,
        getUser,
        reset,
        set,
      });
    }
  }, [getState, service, setUser, getUser, reset, set]);

  // TODO: This may not be correct, but I think we need to set the implementation for the service
  // immediately when this runs, since otherwise the authentication redirects will fail.
  // (useEffect only runs after the child components - in this case, routing logic - has failed)
  if (service) {
    service.setServiceImplementation({
      getState,
      setUser,
      getUser,
      reset,
      set,
    });
  }

  const api = {
    getState,
    setUser,
    getUser,
    getAuthorizationHeader: service.getAuthorizationHeader,
    handleUnauthenticated: service.handleUnauthenticated,
    reset,
    set,
  };

  return (
    <UserAuthenticationContext.Provider value={[userAuthenticationState, api]}>
      {children}
    </UserAuthenticationContext.Provider>
  );
}

export default UserAuthenticationProvider;

const UserAuthenticationConsumer = UserAuthenticationContext.Consumer;
export { UserAuthenticationConsumer };

UserAuthenticationProvider.propTypes = {
  children: PropTypes.any,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }).isRequired,
};

export const useUserAuthentication = () => useContext(UserAuthenticationContext);
