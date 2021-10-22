import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import PropTypes from 'prop-types';

const DEFAULT_STATE = {
  isReferenceLinesEnabled: false,
};

export const ReferenceLinesContext = createContext(DEFAULT_STATE);

export default function ReferenceLinesProvider({ children, service }) {
  const reducer = (state, action) => {
    switch (action.type) {
      case 'SET_IS_REFERENCE_LINES_ENABLED': {
        return { ...state, ...{ isReferenceLinesEnabled: action.payload } };
      }
      default:
        return action.payload;
    }
  };

  const [state, dispatch] = useReducer(
    reducer,
    DEFAULT_STATE
  );

  const getState = useCallback(() => state, [state]);

  const setIsReferenceLinesEnabled = useCallback(
    isReferenceLinesEnabled => dispatch({ type: 'SET_IS_REFERENCE_LINES_ENABLED', payload: isReferenceLinesEnabled }),
    [dispatch]
  );

  /**
   * Sets the implementation of a modal service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ getState, setIsReferenceLinesEnabled });
    }
  }, [
    getState,
    service,
    setIsReferenceLinesEnabled,
  ]);

  const api = {
    getState,
    setIsReferenceLinesEnabled,
  };

  return (
    <ReferenceLinesContext.Provider value={[state, api]}>
      {children}
    </ReferenceLinesContext.Provider>
  );
}

ReferenceLinesProvider.propTypes = {
  children: PropTypes.any,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }).isRequired,
};

export const useReferenceLines = () => useContext(ReferenceLinesContext);
