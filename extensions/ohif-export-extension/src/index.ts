import { Types } from '@ohif/core';

const id = '@ohif/extension-export';

const exportExtension: Types.Extensions.Extension = {
  // Only required property. Should be a unique value across all extensions.

  id,

  /**
   * Lifecycle hooks
   */
  preRegistration() {
    // Extension initialization logic can go here
    console.log('Export extension registered');
  },

  onModeEnter() {
    // Called when a mode using this extension is entered
    console.log('Export extension mode entered');
  },

  onModeExit() {
    // Called when exiting a mode using this extension
    console.log('Export extension mode exited');
  },
};

export default exportExtension;

export { id };
