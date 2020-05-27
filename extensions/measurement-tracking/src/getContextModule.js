import {
  TrackedMeasurementsContext,
  TrackedMeasurementsContextProvider,
  useTrackedMeasurements,
} from './contexts';

function getContextModule() {
  return [
    {
      name: 'TrackedMeasurementsContext',
      context: TrackedMeasurementsContext,
      provider: TrackedMeasurementsContextProvider,
    },
  ];
}

export { useTrackedMeasurements };
export default getContextModule;
