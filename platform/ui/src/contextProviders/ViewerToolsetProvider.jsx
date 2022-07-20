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
  isSeriesLinkingEnabled: false,
  isOverlayEnabled: false,
};

export const ViewerToolsetContext = createContext(DEFAULT_STATE);

export default function ViewerToolsetProvider({ children, service }) {
  const reducer = (state, action) => {
    switch (action.type) {
      case 'SET_IS_REFERENCE_LINES_ENABLED': {
        return { ...state, ...{ isReferenceLinesEnabled: action.payload } };
      }
      case 'SET_IS_SERIES_LINKING_ENABLED': {
        return { ...state, ...{ isSeriesLinkingEnabled: action.payload } };
      }
      case 'SET_IS_OVERLAY_ENABLED': {
        return { ...state, ...{ isOverlayEnabled: action.payload } };
      }
      default:
        return action.payload;
    }
  };

  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  const getState = useCallback(() => state, [state]);

  const setIsReferenceLinesEnabled = useCallback(
    isReferenceLinesEnabled =>
      dispatch({
        type: 'SET_IS_REFERENCE_LINES_ENABLED',
        payload: isReferenceLinesEnabled,
      }),
    [dispatch]
  );

  const setIsSeriesLinkingEnabled = useCallback(
    isSeriesLinkingEnabled =>
      dispatch({
        type: 'SET_IS_SERIES_LINKING_ENABLED',
        payload: isSeriesLinkingEnabled,
      }),
    [dispatch]
  );

  const setIsOverlayEnabled = useCallback(
    isOverlayEnabled =>
      dispatch({
        type: 'SET_IS_OVERLAY_ENABLED',
        payload: isOverlayEnabled,
      }),
    [dispatch]
  );

  /**
   * Sets the implementation of a modal service that can be used by extensions.
   *
   * @returns void
   */
  useEffect(() => {
    if (service) {
      service.setServiceImplementation({
        getState,
        setIsReferenceLinesEnabled,
        setIsSeriesLinkingEnabled,
        setIsOverlayEnabled,
      });
    }
  }, [
    getState,
    service,
    setIsReferenceLinesEnabled,
    setIsSeriesLinkingEnabled,
    setIsOverlayEnabled,
  ]);

  const api = {
    getState,
    setIsReferenceLinesEnabled,
    setIsSeriesLinkingEnabled,
    setIsOverlayEnabled,
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
