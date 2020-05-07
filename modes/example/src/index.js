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
            id: 'org.ohif.defaults.viewerlayout',
            props: {
              // named slots
              leftPanels: ['org.ohif.defaults.seriesList'],
              rightPanels: ['org.ohif.defaults.measure'],
            },
          };
        },
      },
    ],
    extensions: ['org.ohif.defaults', 'org.ohif.cornerstone'],
    sopClassHandlers: ['org.ohif.defaults.stack'],
  };
}
