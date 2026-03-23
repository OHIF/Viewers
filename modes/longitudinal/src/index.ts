import i18n from 'i18next';
import { id } from './id';
import { initToolGroups as basicInitToolGroups, toolbarButtons, cornerstone,
  ohif,
  dicomsr,
  dicomvideo,
  basicLayout,
  basicRoute,
  extensionDependencies as basicDependencies,
  mode as basicMode,
  modeInstance as basicModeInstance,
 } from '@ohif/mode-basic';
import segmentationInitToolGroups from '../../segmentation/src/initToolGroups';
import { toolbarButtons as segmentationToolbarButtons } from '../../segmentation/src/toolbarButtons';

export const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
};

export const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  ...basicDependencies,
  '@ohif/extension-measurement-tracking': '^3.0.0',
};

export const longitudinalInstance = {
  ...basicLayout,
  id: ohif.layout,
  props: {
    ...basicLayout.props,
    leftPanels: [tracked.thumbnailList],
    rightPanels: [cornerstone.labelMapSegmentationPanel, tracked.measurements],
    rightPanelClosed: false,
    viewports: [
      {
        namespace: tracked.viewport,
        // Re-use the display sets from basic
        displaySetsToDisplay: basicLayout.props.viewports[0].displaySetsToDisplay,
      },
      ...basicLayout.props.viewports,
      ],
    }
  };


export const longitudinalRoute =
    {
      ...basicRoute,
      path: 'longitudinal',
        /*init: ({ servicesManager, extensionManager }) => {
          //defaultViewerRouteInit
        },*/
      layoutInstance: longitudinalInstance,
    };

export const modeInstance = {
    ...basicModeInstance,
    // TODO: We're using this as a route segment
    // We should not be.
    id,
    routeName: 'viewer',
    displayName: i18n.t('Modes:Basic Viewer'),
    routes: [
      longitudinalRoute
    ],
    extensions: extensionDependencies,
    enableSegmentationEdit: true,

    onModeEnter({ servicesManager, extensionManager, commandsManager, panelService, segmentationService }: withAppTypes) {
      const { measurementService, toolbarService, toolGroupService, customizationService } =
        servicesManager.services;

      measurementService.clearMeasurements();

      // Use segmentation initToolGroups so brush/eraser tools are registered in tool groups
      segmentationInitToolGroups(extensionManager, toolGroupService, commandsManager);

      // Register basic toolbar buttons
      toolbarService.register(this.toolbarButtons);
      // Register segmentation toolbar buttons (Brush, Eraser, Threshold, etc.)
      toolbarService.register(segmentationToolbarButtons);

      // Update sections from basic toolbarSections
      for (const [key, section] of Object.entries(this.toolbarSections)) {
        toolbarService.updateSection(key, section);
      }

      // Set up label map toolbox sections
      toolbarService.updateSection('labelMapSegmentationToolbox', ['LabelMapTools']);
      toolbarService.updateSection('LabelMapTools', [
        'LabelmapSlicePropagation',
        'BrushTools',
        'MarkerLabelmap',
        'RegionSegmentPlus',
        'Shapes',
        'LabelMapEditWithContour',
      ]);
      toolbarService.updateSection('BrushTools', ['Brush', 'Eraser', 'Threshold']);

      // Activate panel triggers
      if (this.activatePanelTrigger) {
        this._activatePanelTriggersSubscriptions = [
          ...panelService.addActivatePanelTriggers(
            cornerstone.labelMapSegmentationPanel,
            [
              {
                sourcePubSubService: segmentationService,
                sourceEvents: [segmentationService.EVENTS.SEGMENTATION_ADDED],
              },
            ],
            true
          ),
          ...panelService.addActivatePanelTriggers(
            tracked.measurements,
            [
              {
                sourcePubSubService: measurementService,
                sourceEvents: [
                  measurementService.EVENTS.MEASUREMENT_ADDED,
                  measurementService.EVENTS.RAW_MEASUREMENT_ADDED,
                ],
              },
            ],
            true
          ),
          true,
        ];
      }
    },
  };

const mode = {
  ...basicMode,
  id,
  modeInstance,
  extensionDependencies,
};

export default mode;
export { basicInitToolGroups as initToolGroups, toolbarButtons };
