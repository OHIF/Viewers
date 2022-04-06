import { hotkeys } from '@ohif/core';
import toolbarButtons from './toolbarButtons.js';
import { id } from './id.js';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  hangingProtocols: '@ohif/extension-default.hangingProtocolModule.default',
};

const tracked = {
  measurements:
    '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport:
    '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

const dicomsr = {
  sopClassHandler: '@ohif/extension-dicom-sr.sopClassHandlerModule.dicom-sr',
  viewport: '@ohif/extension-dicom-sr.viewportModule.dicom-sr',
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
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@ohif/extension-dicom-sr': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
};

function modeFactory({ modeConfiguration }) {
  return {
    // TODO: We're using this as a route segment
    // We should not be.
    id,
    routeName: 'viewer',
    displayName: 'Basic Viewer',
    /**
     * Lifecycle hooks
     */
    onModeEnter: ({ servicesManager, extensionManager }) => {
      // Note: If tool's aren't initialized, this doesn't have viewport/tools
      // to "set active". This is mostly for the toolbar UI state?
      // Could update tool manager to be always persistent, and to set state
      // on load?
      const { ToolBarService } = servicesManager.services;
      const interaction = {
        groupId: 'primary',
        itemId: 'Wwwc',
        interactionType: 'tool',
        commandOptions: undefined,
      };

      ToolBarService.recordInteraction(interaction);

      ToolBarService.init(extensionManager);
      ToolBarService.addButtons(toolbarButtons);
      ToolBarService.createButtonSection('primary', [
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Pan',
        'Capture',
        'Layout',
        'MoreTools',
      ]);
    },
    onModeExit: () => {},
    validationTags: {
      study: [],
      series: [],
    },
    isValidMode: ({ modalities }) => {
      const modalities_list = modalities.split('\\');

      // Slide Microscopy modality not supported by basic mode yet
      return !modalities_list.includes('SM');
    },
    routes: [
      {
        path: 'longitudinal',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [tracked.thumbnailList],
              // TODO: Should be optional, or required to pass empty array for slots?
              rightPanels: [tracked.measurements],
              viewports: [
                {
                  namespace: tracked.viewport,
                  displaySetsToDisplay: [ohif.sopClassHandler],
                },
                {
                  namespace: dicomsr.viewport,
                  displaySetsToDisplay: [dicomsr.sopClassHandler],
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
    // Order is important in sop class handlers when two handlers both use
    // the same sop class under different situations.  In that case, the more
    // general handler needs to come last.  For this case, the dicomvideo must
    // come first to remove video transfer syntax before ohif uses images
    sopClassHandlers: [
      dicomvideo.sopClassHandler,
      ohif.sopClassHandler,
      dicompdf.sopClassHandler,
      dicomsr.sopClassHandler,
    ],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
