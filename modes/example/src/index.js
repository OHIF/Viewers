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
          toolBarManager.setToolBarLayout([
            // Primary
            {
              tools: ['Zoom', 'Levels', 'Pan', 'Capture', 'Layout'],
              moreTools: ['Zoom', 'Levels', 'Pan', 'Capture', 'Layout'],
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
