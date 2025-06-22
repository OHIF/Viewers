
import { hotkeys } from '@ohif/core';
import { id } from './id';

// import initToolGroups from './initToolGroups';
import toolbarButtons from './toolbarButtons.js';
// import moreTools from './moreTools';

// 🧩 OHIF Extension Mappings
const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  leftPanel: '@ohif/extension-default.panelModule.seriesList',
};

// 📺 Cornerstone Viewport
const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

// 📦 Extension Dependencies
const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  extension2: '^0.0.1', // Your custom AI panel extension
};

// 🧠 Mode Factory
function modeFactory({ modeConfiguration }) {
  return {
    id,
    routeName: 'template',
    displayName: 'Bio-Grid Server',

    // async onModeEnter({ servicesManager }) {
    //   const {
    //     displaySetService,
    //     measurementService,
    //     toolGroupService,
    //     viewportGridService,
    //   } = servicesManager.services ?? {};
    onModeEnter: ({ servicesManager, extensionManager, commandsManager }: withAppTypes) => {
    const { measurementService, toolbarService, toolGroupService } = servicesManager.services;

      measurementService?.clearMeasurements();



      toolbarService.addButtons(toolbarButtons);
      // toolbarService.addButtons(segmentationButtons);

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

      // 🔍 Filter display sets
      // const activeSets = displaySetService?.getActiveDisplaySets?.() || [];
      // const validSets = activeSets.filter(ds =>
      //   ['CT', 'MR', 'PT', 'DX'].includes(ds.Modality)
      // );
      // displaySetService?.setActiveDisplaySets(validSets);

      console.log('✅ Entered Bio-Grid Server mode');
    },

    onModeExit({ servicesManager }) {
      const {
        toolGroupService,
        syncGroupService,
        segmentationService,
        cornerstoneViewportService,
        uiDialogService,
        uiModalService,
      } = servicesManager.services ?? {};

      uiDialogService?.dismissAll();
      uiModalService?.hide();
      toolGroupService?.destroy();
      syncGroupService?.destroy();
      segmentationService?.destroy();
      cornerstoneViewportService?.destroy();

      console.log('👋 Exited Bio-Grid Server mode');
    },

    validationTags: {
      study: [],
      series: [],
    },

    isValidMode: ({ modalities }) => ({ valid: true }),

    routes: [
      {
        path: 'template',
        layoutTemplate: () => ({
          id: ohif.layout,
          props: {
            leftPanels: [ohif.leftPanel],
            rightPanels: ['extension2.panelModule.aiSegmentation'],
            viewports: [
              {
                namespace: cornerstone.viewport,
                displaySetsToDisplay: [ohif.sopClassHandler],
              },
            ],
          },
        }),
      },
    ],

    extensions: extensionDependencies,
    sopClassHandlers: [ohif.sopClassHandler],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

// 🚀 Export Mode
const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;


