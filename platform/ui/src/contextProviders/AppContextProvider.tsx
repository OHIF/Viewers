import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';
import merge from 'lodash.merge';

import PropTypes from 'prop-types';
import { AppContextService } from '@ohif/core';

const DEFAULT_STATE = {
  activeContexts: ['VIEWER'],
  contexts: ['VIEWER'],
};

export const AppContext = createContext(DEFAULT_STATE);

export function AppContextProvider({ children, service }) {
  const AppContextReducer = (state, action) => {
    switch (action.type) {
      /**
       * Adds the given active contexts to the state.
       * @param payload - An array of active contexts to be added.
       * @returns The new state with the added active contexts.
       */
      case 'ADD_ACTIVE_CONTEXTS':
        return {
          ...state,
          activeContexts: [...state.activeContexts, ...action.payload],
        };

      /**
       * Removes the given active contexts from the state.
       * @param payload - An array of active contexts to be removed.
       * @returns The new state with the removed active contexts.
       */
      case 'REMOVE_ACTIVE_CONTEXTS':
        return {
          ...state,
          activeContexts: state.activeContexts.filter(context => !action.payload.includes(context)),
        };

      /**
       * Resets the state to the default state.
       * @returns The default state.
       */
      case 'RESET':
        return DEFAULT_STATE;

      /**
       * Sets the state by merging the current state with the given payload.
       * @param payload - The new state to be merged.
       * @returns The new state after merging.
       */
      case 'SET':
        return merge({}, state, action.payload);

      default:
        return action.payload;
    }
  };

  const [appContexts, dispatch] = useReducer(AppContextReducer, DEFAULT_STATE);

  const getState = useCallback(() => {
    return appContexts;
  }, [appContexts]);

  const reset = useCallback(
    () =>
      dispatch({
        type: 'RESET',
        payload: {},
      }),
    [dispatch]
  );

  const set = useCallback(
    activeContexts =>
      dispatch({
        type: 'SET',
        payload: {
          activeContexts,
        },
      }),
    [dispatch]
  );

  const add = useCallback(
    activeContexts =>
      dispatch({
        type: 'ADD_ACTIVE_CONTEXTS',
        payload: activeContexts,
      }),
    [dispatch]
  );

  const remove = useCallback(
    activeContexts =>
      dispatch({
        type: 'REMOVE_ACTIVE_CONTEXTS',
        payload: activeContexts,
      }),
    [dispatch]
  );

  /**
   * Sets the implementation of ViewportGridService that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        getState,
        reset,
        onModeExit: reset,
        set,
        add,
        remove,
      });
    }
  }, [getState, service, reset, set, add, remove]);

  // run many of the calls through the service itself since we want to publish events
  const api = {
    getState,
    reset,
    set,
    add,
    remove,
  };

  return <AppContext.Provider value={[appContexts, api]}>{children}</AppContext.Provider>;
}

AppContextProvider.propTypes = {
  children: PropTypes.any,
  service: PropTypes.instanceOf(AppContextService),
};

export const useAppContext = () => useContext(AppContext);
