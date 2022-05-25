import { id } from './id';
import getHangingProtocolModule from './getHangingProtocolModule';
import getPanelModule from './getPanelModule';

/**
 *
 */
const tmtvExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  getPanelModule,
  getHangingProtocolModule,
};

export default tmtvExtension;
