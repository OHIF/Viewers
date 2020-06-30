import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Machine } from 'xstate';
import { useMachine } from '@xstate/react';
import {
  machineConfiguration,
  defaultOptions,
} from './measurementTrackingMachine';
import promptBeginTracking from './promptBeginTracking';
import promptTrackNewSeries from './promptTrackNewSeries';
import promptTrackNewStudy from './promptTrackNewStudy';

const TrackedMeasurementsContext = React.createContext();
TrackedMeasurementsContext.displayName = 'TrackedMeasurementsContext';
const useTrackedMeasurements = () => useContext(TrackedMeasurementsContext);

/**
 *
 * @param {*} param0
 */
function TrackedMeasurementsContextProvider(
  UIViewportDialogService,
  { children }
) {
  const machineOptions = Object.assign({}, defaultOptions);
  machineOptions.services = Object.assign({}, machineOptions.services, {
    promptBeginTracking: promptBeginTracking.bind(
      null,
      UIViewportDialogService
    ),
    promptTrackNewSeries: promptTrackNewSeries.bind(
      null,
      UIViewportDialogService
    ),
    promptTrackNewStudy: promptTrackNewStudy.bind(
      null,
      UIViewportDialogService
    ),
  });


  const measurementTrackingMachine = Machine(
    machineConfiguration,
    machineOptions
  );

  const [
    trackedMeasurements,
    sendTrackedMeasurementsEvent,
    trackedMeasurementsService,
  ] = useMachine(measurementTrackingMachine);

  return (
    <TrackedMeasurementsContext.Provider
      value={[trackedMeasurements, sendTrackedMeasurementsEvent]}
    >
      {children}
    </TrackedMeasurementsContext.Provider>
  );
}

TrackedMeasurementsContextProvider.propTypes = {
  children: PropTypes.oneOf([PropTypes.func, PropTypes.node]),
};

export {
  TrackedMeasurementsContext,
  TrackedMeasurementsContextProvider,
  useTrackedMeasurements,
};
