import { retrieveMeasurements, storeMeasurements } from './dataExchange';
import isToolSupported from './utils/isToolSupported';

const DICOMSR = {
  retrieveMeasurements,
  storeMeasurements,
  isToolSupported,
};

export default DICOMSR;
