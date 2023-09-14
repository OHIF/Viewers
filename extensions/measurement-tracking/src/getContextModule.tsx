import {
  TrackedMeasurementsContext,
  TrackedMeasurementsContextProvider,
  useTrackedMeasurements,
} from './contexts';

function getContextModule({ servicesManager, extensionManager, commandsManager }) {
  const BoundTrackedMeasurementsContextProvider = TrackedMeasurementsContextProvider.bind(null, {
    servicesManager,
    extensionManager,
    commandsManager,
  });

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
