import getSopClassHandlerModule from './getSopClassHandlerModule';
import { id } from './id';

/**
 *
 */
const dicomVideoExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,

  getSopClassHandlerModule,
};

export default dicomVideoExtension;
