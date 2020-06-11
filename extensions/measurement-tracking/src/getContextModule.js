import {
  TrackedMeasurementsContext,
  TrackedMeasurementsContextProvider,
  useTrackedMeasurements,
} from './contexts';

function getContextModule({ servicesManager }) {
  const { UIViewportDialogService } = servicesManager.services;
  const BoundTrackedMeasurementsContextProvider = TrackedMeasurementsContextProvider.bind(
    null,
    UIViewportDialogService
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
