import { Types } from '@ohif/core';

import getDataSourcesModule from './getDataSourcesModule.js';
import getLayoutTemplateModule from './getLayoutTemplateModule.js';
import getPanelModule from './getPanelModule';
import getSopClassHandlerModule from './getSopClassHandlerModule.js';
import getToolbarModule from './getToolbarModule';
import getCommandsModule from './commandsModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import getStudiesForPatientByMRN from './Panels/getStudiesForPatientByMRN';
import getCustomizationModule from './getCustomizationModule';
import getViewportModule from './getViewportModule';
import { id } from './id.js';
import preRegistration from './init';
import { ContextMenuController, CustomizableContextMenuTypes } from './CustomizableContextMenu';
import * as dicomWebUtils from './DicomWebDataSource/utils';
import { createReportDialogPrompt } from './Panels';
import createReportAsync from './Actions/createReportAsync';
import StaticWadoClient from './DicomWebDataSource/utils/StaticWadoClient';

const defaultExtension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  preRegistration,
  getDataSourcesModule,
  getViewportModule,
  getLayoutTemplateModule,
  getPanelModule,
  getHangingProtocolModule,
  getSopClassHandlerModule,
  getToolbarModule,
  getCommandsModule,
  getUtilityModule({ servicesManager }) {
    return [
      {
        name: 'common',
        exports: {
          getStudiesForPatientByMRN,
        },
      },
    ];
  },

  getCustomizationModule,
};

export default defaultExtension;

export {
  ContextMenuController,
  CustomizableContextMenuTypes,
  getStudiesForPatientByMRN,
  dicomWebUtils,
  createReportDialogPrompt,
  createReportAsync,
  StaticWadoClient,
};
