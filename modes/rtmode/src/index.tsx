import { hotkeys } from '@ohif/core';
import { id } from './id';
// import { toolbarModule } from '@ohif/extension-default';
// const toolbarButtons = toolbarModule?.toolbarButtons || [];

import toolbarButtons from './toolbarButtons.js';





const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  rtHandler: '@ohif/extension-cornerstone-dicom-rt.sopClassHandlerModule.dicom-rt',
  leftPanel: '@ohif/extension-default.panelModule.seriesList',
  rightPanel: 'mammo.panelModule.PredictPanel', // ✅ your custom right panel
};

const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

const rtViewport = '@ohif/extension-cornerstone-dicom-rt.viewportModule.dicom-rt';

const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-seg': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-pmap': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-rt': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
  mammo: '^0.0.1', // ✅ matches your extension name
};

function modeFactory({ modeConfiguration }) {
  return {
    id,
    routeName: 'mammo',
    displayName: 'Mammogram Mode',

    onModeEnter: ({ servicesManager }) => {
      const { measurementService, toolbarService } = servicesManager.services;

      measurementService.clearMeasurements();

      // Register toolbar buttons
      toolbarService.addButtons(toolbarButtons);

      toolbarService.createButtonSection('primary', [
        'WindowLevel',
        'Pan',
        'Zoom',
        'TrackballRotate',
        'Capture',
        'Layout',
        'Crosshairs',
        'MoreTools',
      ]);

    },

    onModeExit: ({ servicesManager }) => {
      const {
        uiDialogService,
        uiModalService,
        toolGroupService,
        segmentationService,
        cornerstoneViewportService,
        syncGroupService,
      } = servicesManager.services;

      uiDialogService.dismissAll();
      uiModalService.hide();
      toolGroupService.destroy();
      segmentationService.destroy();
      cornerstoneViewportService.destroy();
      syncGroupService.destroy();
    },

    validationTags: {
      study: [],
      series: [],
    },

    isValidMode: ({ modalities }) => ({ valid: true }),

    routes: [
      {
        path: 'mammo',
        layoutTemplate: () => ({
          id: ohif.layout,
          props: {
            leftPanels: [ohif.leftPanel],
            rightPanels: [ohif.rightPanel],
            viewports: [
              {
                namespace: cornerstone.viewport,
                displaySetsToDisplay: [ohif.sopClassHandler],
              },
              {
                namespace: rtViewport,
                displaySetsToDisplay: [ohif.rtHandler],
              },
            ],
          },
        }),
      },
    ],

    extensions: extensionDependencies,
    sopClassHandlers: [ohif.sopClassHandler, ohif.rtHandler],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;



