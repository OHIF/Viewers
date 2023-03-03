import getDataSourcesModule from './getDataSourcesModule.js';
import getLayoutTemplateModule from './getLayoutTemplateModule.js';
import getPanelModule from './getPanelModule';
import getSopClassHandlerModule from './getSopClassHandlerModule.js';
import getToolbarModule from './getToolbarModule';
import commandsModule from './commandsModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import getStudiesForPatientByStudyInstanceUID from './Panels/getStudiesForPatientByStudyInstanceUID';
import getCustomizationModule from './getCustomizationModule';
import { id } from './id.js';
import init from './init';

const defaultExtension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  preRegistration: ({ servicesManager, configuration = {} }) => {
    init({ servicesManager, configuration });
  },
  getDataSourcesModule,
  getLayoutTemplateModule,
  getPanelModule,
  getHangingProtocolModule,
  getSopClassHandlerModule,
  getToolbarModule,
  getCommandsModule({ servicesManager, commandsManager }) {
    return commandsModule({ servicesManager, commandsManager });
  },
  getUtilityModule({ servicesManager }) {
    return [
      {
        name: 'common',
        exports: {
          getStudiesForPatientByStudyInstanceUID,
        },
      },
    ];
  },

  getCustomizationModule,
};

export default defaultExtension;
