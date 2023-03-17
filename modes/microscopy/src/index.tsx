import { hotkeys } from '@ohif/core';
import { addIcon } from '@ohif/ui';
import ConfigPoint from "config-point";

import { id } from './id';
import toolbarButtons from './toolbarButtons';

import toolCircle from '../public/assets/icons/tool-circle.svg';
import toolFreehand from '../public/assets/icons/tool-freehand.svg';
import toolFreehandPolygon from '../public/assets/icons/tool-freehand-polygon.svg';
import toolPolygon from '../public/assets/icons/tool-polygon.svg';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  hangingProtocols: '@ohif/extension-default.hangingProtocolModule.default',
  leftPanel: '@ohif/extension-default.panelModule.seriesList',
  rightPanel: '@ohif/extension-default.panelModule.measure',
};

export const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
};

const dicomsr = {
  sopClassHandler:
    '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr',
  viewport: '@ohif/extension-cornerstone-dicom-sr.viewportModule.dicom-sr',
};

const dicomvideo = {
  sopClassHandler:
    '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
  viewport: '@ohif/extension-dicom-video.viewportModule.dicom-video',
};

const dicompdf = {
  sopClassHandler: '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
  viewport: '@ohif/extension-dicom-pdf.viewportModule.dicom-pdf',
};

const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
  '@ohif/extension-dicom-microscopy': '^3.0.0',
};

function modeFactory() {
  return {
    // TODO: We're using this as a route segment
    // We should not be.
    id,
    routeName: 'microscopy',
    displayName: 'Microscopy',

    /**
     * Lifecycle hooks
     */
    onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
      const { ToolBarService } = servicesManager.services;

      addIcon('tool-point', toolCircle)
      addIcon('tool-circle', toolCircle)
      addIcon('tool-freehand-line', toolFreehand)
      addIcon('tool-freehand-polygon', toolFreehandPolygon)
      addIcon('tool-polygon', toolPolygon)

      ToolBarService.init(extensionManager);
      ToolBarService.addButtons(toolbarButtons);
      ToolBarService.createButtonSection('primary', [
        'MeasurementTools',
        'dragPan',
      ]);
    },

    onModeExit: ({ servicesManager }) => {
      const {
        MeasurementService,
        ToolBarService,
      } = servicesManager.services;

      ToolBarService.reset();
    },

    validationTags: {
      study: [],
      series: [],
    },

    isValidMode: ({ modalities }) => {
      const modalities_list = modalities.split('\\');

      // Slide Microscopy and ECG modality not supported by basic mode yet
      return modalities_list.includes('SM');
    },

    routes: [
      {
        path: 'microscopy',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [ohif.leftPanel],
              rightPanels: ['@ohif/extension-dicom-microscopy.panelModule.measure'],
              viewports: [
                {
                  namespace: "@ohif/extension-dicom-microscopy.viewportModule.microscopy-dicom",
                  displaySetsToDisplay: [
                    "@ohif/extension-dicom-microscopy.sopClassHandlerModule.DicomMicroscopySopClassHandler",
                    "@ohif/extension-dicom-microscopy.sopClassHandlerModule.DicomMicroscopySRSopClassHandler",
                  ],
                },
                {
                  namespace: dicomvideo.viewport,
                  displaySetsToDisplay: [dicomvideo.sopClassHandler],
                },
                {
                  namespace: dicompdf.viewport,
                  displaySetsToDisplay: [dicompdf.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    extensions: extensionDependencies,
    hangingProtocols: [ohif.hangingProtocols],
    hangingProtocol: ['default'],

    // Order is important in sop class handlers when two handlers both use
    // the same sop class under different situations.  In that case, the more
    // general handler needs to come last.  For this case, the dicomvideo must
    // come first to remove video transfer syntax before ohif uses images
    sopClassHandlers: [
      "@ohif/extension-dicom-microscopy.sopClassHandlerModule.DicomMicroscopySopClassHandler",
      "@ohif/extension-dicom-microscopy.sopClassHandlerModule.DicomMicroscopySRSopClassHandler",
      dicomvideo.sopClassHandler,
      dicompdf.sopClassHandler,
    ],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

const mode = ConfigPoint.createConfiguration("microscopyMode", {
  id,
  modeFactory,
  extensionDependencies,
});

console.log('microscopy-mode=', mode)

export default mode;
