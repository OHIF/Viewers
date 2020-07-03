import { useTrackedMeasurements } from './contexts';

export default function getOnSwitchModeRouteModule({ servicesManager }) {
  return () => {
    // TODO -> Clear tracking context
    // TODO: How do we do the below when this isn't a component? There is no equivalent service to hook into.
    //const [a, b] = useTrackedMeasurements();
  };
}
