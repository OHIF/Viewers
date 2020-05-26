export default function mode({ modeConfiguration }) {
  return {
    // TODO: We're using this as a route segment
    // We should not be.
    id: 'longitudinal-workflow',
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
          ToolBarService.addButtons([
            {
              id: 'Zoom',
              namespace: 'org.ohif.cornerstone.toolbarModule.Zoom',
            },
            {
              id: 'Levels',
              namespace: 'org.ohif.cornerstone.toolbarModule.Wwwc',
            },
            {
              id: 'Pan',
              namespace: 'org.ohif.cornerstone.toolbarModule.Pan',
            },
            {
              id: 'Capture',
              namespace: 'org.ohif.cornerstone.toolbarModule.Capture',
            },
            {
              id: 'Layout',
              namespace: 'org.ohif.default.toolbarModule.Layout',
            },
            {
              id: 'Annotate',
              namespace: 'org.ohif.cornerstone.toolbarModule.Annotate',
            },
            {
              id: 'Bidirectional',
              namespace: 'org.ohif.cornerstone.toolbarModule.Bidirectional',
            },
            {
              id: 'Ellipse',
              namespace: 'org.ohif.cornerstone.toolbarModule.Ellipse',
            },
            {
              id: 'Length',
              namespace: 'org.ohif.cornerstone.toolbarModule.Length',
            },
          ]);

          // Could import layout selector here from org.ohif.default (when it exists!)
          ToolBarService.setToolBarLayout([
            // Primary
            {
              tools: ['Zoom', 'Levels', 'Pan', 'Capture', 'Layout'],
              moreTools: ['Zoom'],
            },
            // Secondary
            {
              tools: ['Annotate', 'Bidirectional', 'Ellipse', 'Length'],
            },
          ]);
        },
        layoutTemplate: ({ routeProps }) => {
          return {
            id: 'org.ohif.default.layoutTemplateModule.viewerLayout',
            props: {
              // named slots
              leftPanels: [
                'org.ohif.measurement-tracking.panelModule.seriesList',
              ],
              // TODO: Should be optional, or required to pass empty array for slots?
              rightPanels: [], // // ['org.ohif.default.panelModule.measure'],
              viewports: [
                {
                  namespace:
                    'org.ohif.measurement-tracking.viewportModule.cornerstone-tracked',
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
    extensions: ['org.ohif.default', 'org.ohif.cornerstone', 'org.ohif.measurement-tracking'],
    sopClassHandlers: ['org.ohif.default.sopClassHandlerModule.stack'],
  };
}

window.longitudinalMode = mode({});
