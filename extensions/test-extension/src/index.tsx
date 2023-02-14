import { id } from './id';
import { Types } from '@ohif/core';

/**
 *
 */
const testExtension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  preRegistration() {
    console.debug('hello from test-extension init.js');
  },
};

export default testExtension;
