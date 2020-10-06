import toolbarButtons from './toolbarButtons.js';
import { hotkeys } from '@ohif/core';

const ohif = {
  layout: 'org.ohif.default.layoutTemplateModule.viewerLayout',
  sopClassHandler: 'org.ohif.default.sopClassHandlerModule.stack',
};

const tracked = {
  measurements: 'org.ohif.measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: 'org.ohif.measurement-tracking.panelModule.seriesList',
  viewport: 'org.ohif.measurement-tracking.viewportModule.cornerstone-tracked',
};

const dicomsr = {
  sopClassHandler: 'org.ohif.dicom-sr.sopClassHandlerModule.dicom-sr',
  viewport: 'org.ohif.dicom-sr.viewportModule.dicom-sr',
};

export default function mode({ modeConfiguration }) {
  return {
    // TODO: We're using this as a route segment
    // We should not be.
    id: 'viewer',
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
    },
    onModeExit: () => {},
    validationTags: {
      study: [],
      series: [],
    },
    isValidMode: (studyTags, seriesTags) => {
      // All series are welcome in this mode!
      return true;
    },
    routes: [
      {
        path: 'longitudinal',
        init: ({ servicesManager, extensionManager }) => {
          const { ToolBarService } = servicesManager.services;
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
        layoutTemplate: ({ routeProps }) => {
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
              ],
            },
          };
        },
      },
    ],
    extensions: [
      'org.ohif.default',
      'org.ohif.cornerstone',
      'org.ohif.measurement-tracking',
      'org.ohif.dicom-sr',
    ],
    sopClassHandlers: [ohif.sopClassHandler, dicomsr.sopClassHandler],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

window.longitudinalMode = mode({});
