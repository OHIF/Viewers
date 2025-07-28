console.log('🔥 EXPORT EXTENSION: Loading...');

import { getToolbarModule } from './toolbarModule';
import { getCommandsModule } from './commandsModule';

const id = '@ohif/extension-export';
const version = '1.0.0';

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
};

/**
 * OHIF Export Extension
 * Provides functionality to export viewport images and metadata as ZIP files
 */
const extension = {
  id,
  version,

  preRegistration({ servicesManager, configuration = {} }) {
    console.log('🔥 EXPORT EXTENSION: Pre-registration');
  },

  getToolbarModule,
  getCommandsModule,
};

console.log('🔥 EXPORT EXTENSION: Loaded successfully');

export default extension;
