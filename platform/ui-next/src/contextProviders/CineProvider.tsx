import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

const DEFAULT_STATE = {
  isCineEnabled: false,
  cines: {
    /*
     * viewportId: { isPlaying: false, frameRate: 24 };
     */
  },
};

const DEFAULT_CINE = { isPlaying: false, frameRate: 24 };

export const CineContext = createContext(null);

export default function CineProvider({ children, service }) {
  const reducer = (state, action) => {
    switch (action.type) {
      case 'SET_CINE': {
        const { id, frameRate, isPlaying = undefined } = action.payload;
        const cines = state.cines;

        const syncedCineIds = service.getSyncedViewports(id).map(({ viewportId }) => viewportId);
        const cineIdsToUpdate = [id, ...syncedCineIds].filter(curId => {
          const currentCine = cines[curId] ?? {};
          const shouldUpdateFrameRate =
            currentCine.frameRate !== (frameRate ?? currentCine.frameRate);
          const shouldUpdateIsPlaying =
            currentCine.isPlaying !== (isPlaying ?? currentCine.isPlaying);

          return shouldUpdateFrameRate || shouldUpdateIsPlaying;
        });

        cineIdsToUpdate.forEach(currId => {
          let cine = cines[currId];

          if (!cine) {
            cine = { id, ...DEFAULT_CINE };
            cines[currId] = cine;
          }

          cine.frameRate = frameRate ?? cine.frameRate;
          cine.isPlaying = isPlaying ?? cine.isPlaying;
        });

        return { ...state, ...cines };
      }
      case 'SET_IS_CINE_ENABLED': {
        return { ...state, ...{ isCineEnabled: action.payload } };
      }
      default:
        return action.payload;
    }
  };

  const [state, dispatch] = useReducer(reducer, DEFAULT_STATE);

  const getState = useCallback(() => state, [state]);

  const setIsCineEnabled = useCallback(
    isCineEnabled => dispatch({ type: 'SET_IS_CINE_ENABLED', payload: isCineEnabled }),
    [dispatch]
  );

  const setCine = useCallback(
    ({ id, frameRate, isPlaying }) =>
      dispatch({
        type: 'SET_CINE',
        payload: {
          id,
          frameRate,
          isPlaying,
        },
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
      service.setServiceImplementation({ getState, setIsCineEnabled, setCine });
    }
  }, [getState, service, setCine, setIsCineEnabled]);

  const api = {
    getState,
    setCine,
    setIsCineEnabled: isCineEnabled => service.setIsCineEnabled(isCineEnabled),
    playClip: (element, playClipOptions) => service.playClip(element, playClipOptions),
    stopClip: (element, stopClipOptions) => service.stopClip(element, stopClipOptions),
    setViewportCineClosed: viewportId => service.setViewportCineClosed(viewportId),
    clearViewportCineClosed: viewportId => service.clearViewportCineClosed(viewportId),
    isViewportCineClosed: viewportId => service.isViewportCineClosed(viewportId),
  };

  return <CineContext.Provider value={[state, api]}>{children}</CineContext.Provider>;
}

export const useCine = () => useContext(CineContext);