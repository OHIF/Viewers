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
    const { viewportIndex, StudyInstanceUID, SeriesInstanceUID } = evt;

    return new Promise(function(resolve, reject) {
      /**
       * TODO: Will have issues if "SeriesInstanceUID" exists in multiple displaySets?
       *
       * @param {number} result - -1 | 0 | 1 --> deny | cancel | accept
       * @return resolve { userResponse: number, StudyInstanceUID: string, SeriesInstanceUID: string }
       */
      const handleSubmit = result => {
        UIViewportDialogService.hide();
        resolve({ userResponse: result, StudyInstanceUID, SeriesInstanceUID });
      };

      UIViewportDialogService.show({
        viewportIndex,
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

  // Set StateMachine behavior for prompts (invoked services)
  const machineOptions = Object.assign({}, defaultOptions);
  machineOptions.services = Object.assign({}, machineOptions.services, {
    promptBeginTracking: promptUser.bind(null, 'Start tracking?'),
    promptTrackNewStudy: promptUser.bind(null, 'New study?'),
    promptTrackNewSeries: promptUser.bind(null, 'New series?'),
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
