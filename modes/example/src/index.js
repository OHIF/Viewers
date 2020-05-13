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
        init: ({ toolBarManager }) => {
          toolBarManager.addButtons([
            {
              id: 'StackScroll', // If id not given will use default in button definition.
              namespace: 'org.ohif.cornerstone.toolbarModule.StackScroll',
            },
            {
              id: 'Zoom',
              namespace: 'org.ohif.cornerstone.toolbarModule.Zoom',
            },
          ]);

          debugger;

          // Could import layout selector here from org.ohif.default (when it exists!)
          toolBarManager.setToolBarLayout([
            // Primary
            {
              tools: ['Zoom'],
              moreTools: ['Zoom'],
            },
            // Secondary
            {
              tools: ['Zoom'],
            },
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
