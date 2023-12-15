import { hotkeys } from '@ohif/core';
import { id } from './id';
import initToolGroups from './initToolGroups';
import toolbarButtons from './toolbarButtons';
import moreTools from './moreTools';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  hangingProtocol: '@ohif/extension-default.hangingProtocolModule.default',
  leftPanel: '@ohif/extension-default.panelModule.seriesList',
  rightPanel: '@ohif/extension-default.panelModule.measure',
};

const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

/**
 * Just two dependencies to be able to render a viewport with panels in order
 * to make sure that the mode is working.
 */
const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-measurement-tracking': '^3.0.0',
};

function modeFactory() {
  return {
    /**
     * Mode ID, which should be unique among modes used by the viewer. This ID
     * is used to identify the mode in the viewer's state.
     */
    id,
    routeName: 'ultrasound',
    /**
     * Mode name, which is displayed in the viewer's UI in the workList, for the
     * user to select the mode.
     */
    displayName: 'Fetal ultrasound',
    /**
     * Runs when the Mode Route is mounted to the DOM. Usually used to initialize
     * Services and other resources.
     */
    onModeEnter: function ({ servicesManager, extensionManager, commandsManager }) {
      const { measurementService, toolbarService, toolGroupService } = servicesManager.services;

      measurementService.clearMeasurements();

      // Init Default and SR ToolGroups
      initToolGroups(extensionManager, toolGroupService, commandsManager, this.labelConfig);

      let unsubscribe;

      const activateTool = () => {
        toolbarService.recordInteraction({
          groupId: 'WindowLevel',
          interactionType: 'tool',
          commands: [
            {
              commandName: 'setToolActive',
              commandOptions: {
                toolName: 'WindowLevel',
              },
              context: 'CORNERSTONE',
            },
          ],
        });

        // We don't need to reset the active tool whenever a viewport is getting
        // added to the toolGroup.
        unsubscribe();
      };

      // Since we only have one viewport for the basic cs3d mode and it has
      // only one hanging protocol, we can just use the first viewport
      ({ unsubscribe } = toolGroupService.subscribe(
        toolGroupService.EVENTS.VIEWPORT_ADDED,
        activateTool
      ));

      toolbarService.init(extensionManager);
      toolbarService.addButtons([...toolbarButtons, ...moreTools]);
      toolbarService.createButtonSection('primary', [
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Pan',
        'Capture',
        'Layout',
        'MPR',
        'Crosshairs',
        'MoreTools',
      ]);
    },
    onModeExit: ({ servicesManager }) => {
      const {
        toolGroupService,
        syncGroupService,
        segmentationService,
        cornerstoneViewportService,
      } = servicesManager.services;

      toolGroupService.destroy();
      syncGroupService.destroy();
      segmentationService.destroy();
      cornerstoneViewportService.destroy();
    },
    /**
     * For labels listing in measurements.
    */
    labelConfig: {
      labelOnMeasure: true,
      exclusive: true,
      items: [
        { value: "BPD", label: "BPD (Biparietal Diameter)" },
        { value: "HC", label: "HC (Head Circumference)" },
        { value: "AC", label: "AC (Abdominal Circumference)" },
        { value: "FL", label: "FL (Femur Length)" },
        { value: "CRL", label: "CRL (Crown-Rump Length)" },
        { value: "HB", label: "HB (Heartbeat)" },
        { value: "ACF", label: "ACF (Amniotic Cavity/Amniotic Fluid)" },
        { value: "ROA", label: "ROA (Right Occiput Anterior)" },
        { value: "LOA", label: "LOA (Left Occiput Anterior)" },
        { value: "ROP", label: "ROP (Right Occiput Posterior)" },
        { value: "LOP", label: "LOP (Left Occiput Posterior)" },
        { value: "Kidneys", label: "Kidneys" },
        { value: "Liver", label: "Liver" },
        { value: "Stomach", label: "Stomach" },
        { value: "Bladder", label: "Bladder" },
        { value: "PPA", label: "PPA (Placenta Position Anterior)" },
        { value: "PPP", label: "PPP (Placenta Position Posterior)" },
        { value: "PPF", label: "PPF (Placenta Position Fundal)" },
      ]
    },
    /** */
    validationTags: {
      study: [],
      series: [],
    },
    /**
     * A boolean return value that indicates whether the mode is valid for the
     * modalities of the selected studies. For instance a PET/CT mode should be
     */
    isValidMode: ({ modalities }) => {
      const modalities_list = modalities.split('\\');
      return modalities_list.includes('US');
    },
    /**
     * Mode Routes are used to define the mode's behavior. A list of Mode Route
     * that includes the mode's path and the layout to be used. The layout will
     * include the components that are used in the layout. For instance, if the
     * default layoutTemplate is used (id: '@ohif/extension-default.layoutTemplateModule.viewerLayout')
     * it will include the leftPanels, rightPanels, and viewports. However, if
     * you define another layoutTemplate that includes a Footer for instance,
     * you should provide the Footer component here too. Note: We use Strings
     * to reference the component's ID as they are registered in the internal
     * ExtensionManager. The template for the string is:
     * `${extensionId}.{moduleType}.${componentId}`.
     */
    routes: [
      {
        path: 'ultrasound',
        layoutTemplate: () => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [tracked.thumbnailList],
              rightPanels: [tracked.measurements],
              viewports: [
                {
                  namespace: tracked.viewport,
                  displaySetsToDisplay: [ohif.sopClassHandler],
                },
              ],
            },
          };
        },
      },
    ],
    /** List of extensions that are used by the mode */
    extensions: extensionDependencies,
    /** HangingProtocol used by the mode */
    hangingProtocol: 'default',
    /** SopClassHandlers used by the mode */
    sopClassHandlers: [ohif.sopClassHandler],
    /** hotkeys for mode */
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
  };
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
