import {
  TrackedMeasurementsContext,
  TrackedMeasurementsContextProvider,
  useTrackedMeasurements,
} from './contexts';

function getContextModule({
  servicesManager,
  extensionManager,
  commandsManager,
  appConfig,
}) {
  const BoundTrackedMeasurementsContextProvider = TrackedMeasurementsContextProvider.bind(
    null,
    { servicesManager, extensionManager, commandsManager, appConfig }
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
