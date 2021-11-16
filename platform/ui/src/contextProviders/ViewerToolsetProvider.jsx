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
  isCrosshairsEnabled: false,
};

export const ViewerToolsetContext = createContext(DEFAULT_STATE);

export default function ViewerToolsetProvider({ children, service }) {
  const reducer = (state, action) => {
    switch (action.type) {
      case 'SET_IS_REFERENCE_LINES_ENABLED': {
        return { ...state, ...{ isReferenceLinesEnabled: action.payload } };
      }
      case 'SET_IS_CROSSHAIRS_ENABLED': {
        return { ...state, ...{ isCrosshairsEnabled: action.payload } };
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

  const setIsCrosshairsEnabled = useCallback(
    isCrosshairsEnabled => dispatch({ type: 'SET_IS_CROSSHAIRS_ENABLED', payload: isCrosshairsEnabled }),
    [dispatch]
  );

  /**
   * Sets the implementation of a modal service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({ getState, setIsReferenceLinesEnabled, setIsCrosshairsEnabled });
    }
  }, [
    getState,
    service,
    setIsReferenceLinesEnabled,
    setIsCrosshairsEnabled,
  ]);

  const api = {
    getState,
    setIsReferenceLinesEnabled,
    setIsCrosshairsEnabled,
  };

  return (
    <ViewerToolsetContext.Provider value={[state, api]}>
      {children}
    </ViewerToolsetContext.Provider>
  );
}

ViewerToolsetProvider.propTypes = {
  children: PropTypes.any,
  service: PropTypes.shape({
    setServiceImplementation: PropTypes.func,
  }).isRequired,
};

export const useViewerToolset = () => useContext(ViewerToolsetContext);
