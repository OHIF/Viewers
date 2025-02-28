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
import { cleanDenaturalizedDataset } from './DicomWebDataSource/utils';
import { useViewportsByPositionStore } from './stores/useViewportsByPositionStore';
import { useViewportGridStore } from './stores/useViewportGridStore';
import { useUIStateStore } from './stores/useUIStateStore';
import { useDisplaySetSelectorStore } from './stores/useDisplaySetSelectorStore';
import { useHangingProtocolStageIndexStore } from './stores/useHangingProtocolStageIndexStore';
import { useToggleHangingProtocolStore } from './stores/useToggleHangingProtocolStore';
import { useToggleOneUpViewportGridStore } from './stores/useToggleOneUpViewportGridStore';
import {
  callLabelAutocompleteDialog,
  showLabelAnnotationPopup,
  callInputDialog,
} from './utils/callInputDialog';
import colorPickerDialog from './utils/colorPickerDialog';

import promptSaveReport from './utils/promptSaveReport';
import promptLabelAnnotation from './utils/promptLabelAnnotation';
import usePatientInfo from './hooks/usePatientInfo';
import { PanelStudyBrowserHeader } from './Panels/StudyBrowser/PanelStudyBrowserHeader';
import * as utils from './utils';

const defaultExtension: Types.Extensions.Extension = {
  /**
   * Only required property. Should be a unique value across all extensions.
   */
  id,
  preRegistration,
  onModeExit() {
    useViewportGridStore.getState().clearViewportGridState();
    useUIStateStore.getState().clearUIState();
    useDisplaySetSelectorStore.getState().clearDisplaySetSelectorMap();
    useHangingProtocolStageIndexStore.getState().clearHangingProtocolStageIndexMap();
    useToggleHangingProtocolStore.getState().clearToggleHangingProtocol();
    useViewportsByPositionStore.getState().clearViewportsByPosition();
  },
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
  cleanDenaturalizedDataset,
  // Export all stores
  useDisplaySetSelectorStore,
  useHangingProtocolStageIndexStore,
  useToggleHangingProtocolStore,
  useToggleOneUpViewportGridStore,
  useUIStateStore,
  useViewportGridStore,
  useViewportsByPositionStore,
  showLabelAnnotationPopup,
  callLabelAutocompleteDialog,
  callInputDialog,
  promptSaveReport,
  promptLabelAnnotation,
  colorPickerDialog,
  usePatientInfo,
  PanelStudyBrowserHeader,
  utils,
};
