import React, { useContext, useReducer } from 'react';

const TRACKED_MEASUREMENTS_INITIAL_STATE = {
  /** StudyInstanceUID */
  trackedStudy: '',
  /** string[] of SeriesInstanceUID */
  trackedSeries: [],
  /** key, value => displaySetInstanceUID, string label */
  viewportLabels: new Map(),
};

const TrackedMeasurementsContext = React.createContext();

TrackedMeasurementsContext.displayName = 'TrackedMeasurementsContext';

const useTrackedMeasurements = () => useContext(TrackedMeasurementsContext);

/**
 *
 * @param {*} param0
 */
function TrackedMeasurementsContextProvider({ children }) {
  /**
   *
   * @param {object} state - previous state
   * @param {object} action
   * @param {string} action.type
   * @param {object} action.payload
   */
  const reducer = (state, action) => {
    switch (action.type) {
      case 'TRACK_SERIES':
        const { StudyInstanceUID, SeriesInstanceUID } = action.payload;
        return state;
      case 'UNTRACK_SERIES':
        return state;
      default:
        return state;
    }
  };

  // Computed:
  // numTrackedSeries

  // API
  // -
  // - TrackSeries(studyUid, seriesUid) (or... TrackViewport?)
  //    - Checks against tracked study + series
  //    - Initiates prompt if required
  //    - does nothing for SR modality? (how do we know SR viewport?????????)
  // - UntrackSeries(seriesUid)
  const [trackedMeasurements, dispatchTrackedMeasurements] = useReducer(
    reducer,
    TRACKED_MEASUREMENTS_INITIAL_STATE
  );

  return (
    <TrackedMeasurementsContext.Provider
      value={[trackedMeasurements, dispatchTrackedMeasurements]}
    >
      {children}
    </TrackedMeasurementsContext.Provider>
  );
}

export {
  TrackedMeasurementsContext,
  TrackedMeasurementsContextProvider,
  useTrackedMeasurements,
};
