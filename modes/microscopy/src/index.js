import toolbarButtons from './toolbarButtons.js';
import { hotkeys } from '@ohif/core';

const ohif = {
  layout: 'org.ohif.default.layoutTemplateModule.viewerLayout',
  sopClassHandler: 'org.ohif.default.sopClassHandlerModule.stack',
};
const microscopy = {
  //measurements: 'org.ohif.measurement-tracking.panelModule.trackedMeasurements',
  //thumbnailList: 'org.ohif.measurement-tracking.panelModule.seriesList',
  sopClassHandler: 'org.ohif.microscopy.sopClassHandlerModule.microscopy',
  viewport: 'org.ohif.microscopy.viewportModule.microscopy-default',
};

export default function mode({ modeConfiguration }) {
  return {
    // TODO: We're using this as a route segment
    // We should not be.
    id: 'microscopy',
    displayName: 'Whole-slide Microscopy',
    validationTags: {
      study: [],
      series: [],
    },
    isValidMode: (studyTags, seriesTags) => {
      return studyTags.modalities.includes('SM');
    },
    routes: [
      {
        path: 'microscopy',
        init: ({ servicesManager, extensionManager }) => {
          const { ToolBarService } = servicesManager.services;
          ToolBarService.init(extensionManager);
          ToolBarService.addButtons(toolbarButtons);
          ToolBarService.createButtonSection('primary', [
            'Pan',
            'Layout',
            'Divider',
          ]);
          ToolBarService.createButtonSection('secondary', [
            'Annotate',
            'Probe',
            'RectangleRoi',
            'Ellipse',
            'Length',
          ]);

          // Could import layout selector here from org.ohif.default (when it exists!)
        },
        layoutTemplate: ({ routeProps }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [],
              // TODO: Should be optional, or required to pass empty array for slots?
              rightPanels: [],
              viewports: [
                {
                  namespace: microscopy.viewport,
                  displaySetsToDisplay: [microscopy.sopClassHandler, ohif.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    extensions: [
      'org.ohif.default',
      'org.ohif.microscopy',
    ],
    sopClassHandlers: [microscopy.sopClassHandler, ohif.sopClassHandler],
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

window.microscopyMode = mode({});
