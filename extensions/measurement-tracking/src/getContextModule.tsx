import {
  TrackedMeasurementsContext,
  TrackedMeasurementsContextProvider,
  useTrackedMeasurements,
} from './contexts';

function getContextModule({ servicesManager, extensionManager }) {
  const BoundTrackedMeasurementsContextProvider = TrackedMeasurementsContextProvider.bind(
    null,
    { servicesManager, extensionManager }
  );

  return [
    {
      name: 'TrackedMeasurementsContext',
      context: TrackedMeasurementsContext,
      provider: BoundTrackedMeasurementsContextProvider,
    },
  ];
}

export { useTrackedMeasurements };
export default getContextModule;
