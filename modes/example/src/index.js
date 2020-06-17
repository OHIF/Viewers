import toolbarButtons from './toolbarButtons.js';

export default function mode({ modeConfiguration }) {
  return {
    id: 'example-mode',
    displayName: 'Basic Viewer',
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
        path: 'viewer',
        init: ({ servicesManager, extensionManager }) => {
          const { ToolBarService } = servicesManager.services;
          ToolBarService.init(extensionManager);
          ToolBarService.addButtons(toolbarButtons);
          ToolBarService.createButtonSection('primary', [
            'Zoom',
            'Wwwc',
            'Pan',
            'Capture',
            'Layout',
            'Divider',
            [
              'ResetView',
              'RotateClockwise',
              'FlipHorizontally',
              'StackScroll',
              'Magnify',
              'Invert',
              'Cine',
              'Angle',
              'Probe',
              'RectangleRoi',
            ],
          ]);
          ToolBarService.createButtonSection('secondary', [
            'Annotate',
            'Bidirectional',
            'Ellipse',
            'Length',
          ]);
        },
        layoutTemplate: ({ routeProps }) => {
          return {
            id: 'org.ohif.default.layoutTemplateModule.viewerLayout',
            props: {
              // named slots
              leftPanels: ['org.ohif.default.panelModule.seriesList'],
              rightPanels: ['org.ohif.default.panelModule.measure'],
              viewports: [
                {
                  namespace: 'org.ohif.cornerstone.viewportModule.cornerstone',
                  displaySetsToDisplay: [
                    'org.ohif.default.sopClassHandlerModule.stack',
                  ],
                },
              ],
            },
          };
        },
      },
    ],
    extensions: ['org.ohif.default', 'org.ohif.cornerstone'],
    sopClassHandlers: ['org.ohif.default.sopClassHandlerModule.stack'],
  };
}

window.exampleMode = mode({});
