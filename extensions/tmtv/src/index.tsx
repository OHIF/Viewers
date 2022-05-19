import { id } from './id';
import getHangingProtocolModule from './getHangingProtocolModule';

/**
 *
 */
const tmtvExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  getHangingProtocolModule,
};

export default tmtvExtension;
