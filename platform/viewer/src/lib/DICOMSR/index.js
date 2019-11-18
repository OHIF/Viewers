import { retrieveMeasurements, storeMeasurements } from './dataExchange';
import { isToolSupported } from './isToolSupported';

const DICOMSR = {
  retrieveMeasurements,
  storeMeasurements,
  isToolSupported,
};

export default DICOMSR;
