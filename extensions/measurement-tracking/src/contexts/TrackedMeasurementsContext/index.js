import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useMachine } from '@xstate/react';
import {
  measurementTrackingMachine,
  defaultOptions,
} from './measurementTrackingMachine';

const TrackedMeasurementsContext = React.createContext();

TrackedMeasurementsContext.displayName = 'TrackedMeasurementsContext';

const useTrackedMeasurements = () => useContext(TrackedMeasurementsContext);

/**
 *
 * @param {*} param0
 */
function TrackedMeasurementsContextProvider({ children }) {
  // TODO: Configure `UIViewportNotificationService` for appropriate actions
  const measurementTrackingMachineOptions = Object.assign({}, defaultOptions);
  const [
    trackedMeasurements,
    sendTrackedMeasurementsEvent,
    trackedMeasurementsService,
  ] = useMachine(measurementTrackingMachine, measurementTrackingMachineOptions);

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
