import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Machine } from 'xstate';
import { useMachine } from '@xstate/react';
import {
  machineConfiguration,
  defaultOptions,
} from './measurementTrackingMachine';

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
  function promptUser(message, ctx, evt) {
    const { StudyInstanceUID, SeriesInstanceUID } = evt;
    // TODO: ... ActiveViewport? Or Study + Series --> Viewport?
    // Let's just use zero for meow?
    return new Promise(function(resolve, reject) {
      const handleSubmit = result => {
        UIViewportDialogService.hide();
        // evt.data available for event transition
        resolve({ userResponse: result, StudyInstanceUID, SeriesInstanceUID });
      };

      UIViewportDialogService.show({
        viewportIndex: 0,
        type: 'info',
        message,
        actions: [
          { type: 'cancel', text: 'No', value: 0 },
          { type: 'secondary', text: 'No, do not ask again', value: -1 },
          { type: 'primary', text: 'Yes', value: 1 },
        ],
        onSubmit: handleSubmit,
      });
    });
  }

  const machOptions = Object.assign({}, defaultOptions);
  // Merge services
  machOptions.services = Object.assign({}, machOptions.services, {
    promptBeginTracking: promptUser.bind(null, 'Start tracking?'),
    promptTrackNewStudy: promptUser.bind(null, 'New study?'),
    promptTrackNewSeries: promptUser.bind(null, 'New series?'),
  });

  console.log(
    '~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~',
    machOptions
  );

  const measurementTrackingMachine = Machine(machineConfiguration, machOptions);

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
