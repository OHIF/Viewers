/**
 * Mode Template
 */
export default function mode({}) {
  return {
    /**
     * Mode ID, which should be unique among modes used by the viewer. This ID
     * is used to identify the mode in the viewer's state.
     */
    id: 'template',
    /**
     * Mode name, which is displayed in the viewer's UI in the worklist, for the
     * user to select the mode.
     */
    displayName: 'Template Mode',
    /**
     * Runs when the Mode Route is mounted to the DOM. Usually used to initialize
     * Services and other resources.
     */
    onModeEnter: ({ servicesManager, extensionManager }) => {},
    /**
     * Runs when the Mode Route is unmounted from the DOM. Usually used to clean
     * up resources and states
     */
    onModeExit: () => {},
    /** */
    validationTags: {
      study: [],
      series: [],
    },
    /**
     * A boolean return value that indicates whether the mode is valid for the
     * modalities of the selected studies. For instance a PET/CT mode should be
     */
    isValidMode: ({ modalities }) => {},
    /**
     * Mode Routes are used to define the mode's behavior. A list of Mode Route
     * that includes the mode's path and the layout to be used. The layout will
     * include the components that are used in the layout. For instance, if the
     * default layoutTemplate is used (id: 'org.ohif.default.layoutTemplateModule.viewerLayout')
     * it will include the leftPanels, rightPanels, and viewports. However, if
     * you define another layoutTemplate that includes a Footer for instance,
     * you should provide the Footer component here too. Note: We use Strings
     * to reference the component's ID as they are registered in the internal
     * ExtensionManager. The template for the string is:
     * `${extensionId}.{moduleType}.${componentId}`.
     */
    routes: [
      {
        path: 'template',
        layoutTemplate: ({ location, servicesManager }) => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [],
              rightPanels: [clock.panel],
              viewports: [
                {
                  namespace: ohif.viewport,
                  displaySetsToDisplay: [ohif.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    /** List of extensions that are used by the modde */
    extensions: [],
    /** HangingProtocols used by the mode */
    hangingProtocols: [],
    /** SopClassHandlers used by the mode */
    sopClassHandlers: [],
    /** hotkeys for mode */
    hotkeys: [],
  };
}

/**
 * Register the mode template
 */
window.templateMode = mode({});
