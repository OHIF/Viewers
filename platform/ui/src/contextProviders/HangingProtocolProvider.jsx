import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';

const DEFAULT_STATE = {
  hangingProtocol: null,
  hpAlreadyApplied: {}
};

export const HangingProtocolContext = createContext(DEFAULT_STATE);

export function HangingProtocolProvider({ children, service }) {
  const hangingProtocolReducer = (state, action) => {
    switch (action.type) {
      case 'SET_HANGING_PROTOCOL': {
        return { ...state, ...{ hangingProtocol: action.payload.hangingProtocol } };
      }
      case 'SET_HANGING_PROTOCOL_ALREADY_APPLIED': {
        return { ...state, ...{ hpAlreadyApplied: action.payload.hpAlreadyApplied } };
      }
      case 'RESET': {
        return {
          hangingProtocol: null,
          hpAlreadyApplied: {}
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

  const [hangingProtocolState, dispatch] = useReducer(
    hangingProtocolReducer,
    DEFAULT_STATE
  );

  console.log('hangingProtocolState',hangingProtocolState)

  const getState = useCallback(() => hangingProtocolState, [hangingProtocolState]);

  const setHangingProtocol = useCallback(
    (hangingProtocol) =>
      dispatch({
        type: 'SET_HANGING_PROTOCOL',
        payload: {
          hangingProtocol,
        },
      }),
    [dispatch]
  );

  const setHPAlreadyApplied = useCallback(
    (hpAlreadyApplied) =>
      dispatch({
        type: 'SET_HANGING_PROTOCOL_ALREADY_APPLIED',
        payload: {
          hpAlreadyApplied,
        },
      }),
    [dispatch]
  );

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
   * Sets the implementation of the HangingProtocolService that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        getState,
        setHangingProtocol,
        setHPAlreadyApplied,
        reset,
        set,
      });
    }
  }, [
    getState,
    service,
    setHangingProtocol,
    setHPAlreadyApplied,
    reset,
    set,
  ]);

  const api = {
    // getState,
    setHangingProtocol,
    setHPAlreadyApplied,
    reset,
    set,
  };

  return (
    <HangingProtocolContext.Provider value={[hangingProtocolState, api]}>
      {children}
    </HangingProtocolContext.Provider>
  );
}

HangingProtocolProvider.propTypes = {
  children: PropTypes.any,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }).isRequired,
};

export const useHangingProtocol = () => useContext(HangingProtocolContext);
