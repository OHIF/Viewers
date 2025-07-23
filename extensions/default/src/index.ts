import { Types } from '@ohif/core';

import getDataSourcesModule from './getDataSourcesModule';
import getLayoutTemplateModule from './getLayoutTemplateModule';
import getPanelModule from './getPanelModule';
import getSopClassHandlerModule from './getSopClassHandlerModule';
import getToolbarModule from './getToolbarModule';
import getCommandsModule from './commandsModule';
import getHangingProtocolModule from './getHangingProtocolModule';
import getStudiesForPatientByMRN from './Panels/getStudiesForPatientByMRN';
import getCustomizationModule from './getCustomizationModule';
import getViewportModule from './getViewportModule';
import { id } from './id';
import preRegistration from './init';
import { createReportDialogPrompt } from './Panels';

import { ContextMenuController, CustomizableContextMenuTypes } from './CustomizableContextMenu';
import * as dicomWebUtils from './DicomWebDataSource/utils';
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
import { callInputDialogAutoComplete, callInputDialog } from './utils/callInputDialog';
import colorPickerDialog from './utils/colorPickerDialog';

import promptSaveReport from './utils/promptSaveReport';
import promptLabelAnnotation from './utils/promptLabelAnnotation';
import usePatientInfo from './hooks/usePatientInfo';
import { PanelStudyBrowserHeader } from './Panels/StudyBrowser/PanelStudyBrowserHeader';
import * as utils from './utils';
import { Toolbox } from './utils';
import MoreDropdownMenu from './Components/MoreDropdownMenu';
import requestDisplaySetCreationForStudy from './Panels/requestDisplaySetCreationForStudy';
import { Toolbar } from './Toolbar/Toolbar';

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
  callInputDialogAutoComplete,
  promptSaveReport,
  promptLabelAnnotation,
  colorPickerDialog,
  usePatientInfo,
  PanelStudyBrowserHeader,
  utils,
  Toolbox,
  MoreDropdownMenu,
  requestDisplaySetCreationForStudy,
  callInputDialog,
  createReportDialogPrompt,
  Toolbar,
};
