export default function mode({ modeConfiguration }) {
  return {
    id: 'example-mode',
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
        preInit: ({ toolbarManager }) => {
          toolbarManager &&
            toolbarManager.setDefaultLoadOut([
              [], // Primary
              [], // Secondary
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
                  namespace:
                    'org.ohif.cornerstone.viewportModule.OHIFCornerstoneViewport',
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
