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
  function promptUser() {
    // TODO: ... ActiveViewport? Or Study + Series --> Viewport?
    // Let's just use zero for meow?
    return new Promise(function(resolve, reject) {
      const handleSubmit = result => {
        UIViewportDialogService.hide();
        resolve(result);
      };

      UIViewportDialogService.show({
        viewportIndex: 0,
        type: 'info',
        message: 'Would you like to track?',
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
    shouldTrackPrompt: promptUser,
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
