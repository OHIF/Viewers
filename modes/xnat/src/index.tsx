import { hotkeys } from '@ohif/core';
import toolbarButtons from './toolbarButtons';
import { id } from './id';
import SessionRouter from '@ohif/extension-xnat/src/xnat-components/XNATNavigation/helpers/SessionRouter.js';
import { defaultRouteInit } from '../../../platform/app/src/routes/Mode/defaultRouteInit';
import sessionMap from '@ohif/extension-xnat/src/utils/sessionMap.js';
import {
  mode as basicMode,
  modeInstance as basicModeInstance,
  extensionDependencies as basicDependencies,
  basicLayout,
  basicRoute,
  initToolGroups,
  cornerstone,
  ohif,
  dicomsr,
  dicomvideo,
  dicompdf,
  dicomSeg,
  dicomPmap,
  dicomRT,
} from '../../basic/src/index';

const xnat = {
  xnatNavList: '@ohif/extension-xnat.panelModule.xnatNavigation',
  studyBrowser: '@ohif/extension-xnat.panelModule.xnatStudyBrowser',
  segmentation: '@ohif/extension-xnat.panelModule.panelSegmentationWithTools',
  sopClassHandler: '@ohif/extension-xnat.sopClassHandlerModule.xnatSopClassHandler',
  measurements: '@ohif/extension-xnat.panelModule.xnatMeasurements',
  customForms: '@ohif/extension-xnat.panelModule.xnatCustomForms',
  overreadNavList: '@ohif/extension-xnat.panelModule.overreadNavigation',
};

const extensionDependencies = {
  ...basicDependencies,
  '@ohif/extension-measurement-tracking': '^3.11.0-beta.44',
  '@ohif/extension-xnat': '^0.0.1',
};

// Create a custom layout for XNAT that handles overread mode
const xnatLayout = {
  ...basicLayout,
  id: ohif.layout,
  props: {
    ...basicLayout.props,
    leftPanels: [xnat.studyBrowser, xnat.xnatNavList], // Default panels, will be overridden in route
    rightPanels: [xnat.segmentation, xnat.measurements], // Default panels, will be overridden in route
  },
};

// Create the XNAT route
const xnatRoute = {
  ...basicRoute,
  path: '/',
  layoutInstance: xnatLayout,
  layoutTemplate: ({ servicesManager }) => {
    // Check if we're in overread mode
    const isOverreadMode = servicesManager?.services?.isOverreadMode === true;

    // Choose panels based on mode
    const rightPanels = isOverreadMode
      ? [xnat.segmentation, xnat.measurements, xnat.customForms]  // Overread mode: include custom forms
      : [xnat.segmentation, xnat.measurements];                   // Regular mode: standard panels

    const leftPanels = isOverreadMode
      ? [xnat.studyBrowser, xnat.overreadNavList]
      : [xnat.studyBrowser, xnat.xnatNavList];

    return {
      ...xnatLayout,
      props: {
        ...xnatLayout.props,
        leftPanels: leftPanels,
        rightPanels: rightPanels,
        viewports: [
          // Ensure standard cornerstone viewport is primary
          {
            namespace: cornerstone.viewport,
            displaySetsToDisplay: [
              xnat.sopClassHandler,
              ohif.sopClassHandler,
              dicomvideo.sopClassHandler,
              dicomsr.sopClassHandler3D,
              ohif.wsiSopClassHandler,
            ],
          },
          // Other viewports needed by XNAT
          {
            namespace: dicomsr.viewport,
            displaySetsToDisplay: [dicomsr.sopClassHandler, dicomsr.sopClassHandler3D],
          },
          {
            namespace: dicompdf.viewport,
            displaySetsToDisplay: [dicompdf.sopClassHandler],
          },
          {
            namespace: dicomSeg.viewport,
            displaySetsToDisplay: [dicomSeg.sopClassHandler],
          },
          {
            namespace: dicomPmap.viewport,
            displaySetsToDisplay: [dicomPmap.sopClassHandler],
          },
          {
            namespace: dicomRT.viewport,
            displaySetsToDisplay: [dicomRT.sopClassHandler],
          },
          {
            namespace: cornerstone.viewport,
            displaySetsToDisplay: [ohif.wsiSopClassHandler],
          },
        ],
      },
    };
  },
  init: async ({ servicesManager, extensionManager, studyInstanceUIDs }) => {
    const layoutService = servicesManager.services.layoutService;

    // Get the study UIDs from the session router if available
    if (!studyInstanceUIDs || studyInstanceUIDs.length === 0) {
      const sessionRouter = servicesManager.services.sessionRouter;

      if (sessionRouter) {
        try {
          const studyUID = await sessionRouter.go();

          if (studyUID) {
            studyInstanceUIDs = [studyUID];

            // Explicitly update the data source
            const dataSource = extensionManager.getActiveDataSource();
            if (dataSource) {
              // Make sure viewports are ready for the study
              if (layoutService) {
                layoutService.setViewportsForStudies(studyInstanceUIDs);
              }

              // Tell OHIF to show the default hanging protocol for this study
              const hangingProtocolService = servicesManager.services.hangingProtocolService;
              if (hangingProtocolService) {
                hangingProtocolService.run({ studyInstanceUIDs });
              }
            }
          }
        } catch (error) {
          console.error('Route init - Error getting study from session router:', error);
        }
      }
    }

    // Initialize data source
    try {
      const [dataSource] = extensionManager.getActiveDataSource();
      if (dataSource && typeof dataSource.initialize === 'function') {
        const query = new URLSearchParams(window.location.search);
        await dataSource.initialize({ params: {}, query });
      } else {
        console.error('XNAT Mode Route Init: Could not find active data source or initialize function.');
      }
    } catch (error) {
      console.error('XNAT Mode Route Init: Error calling dataSource.initialize():', error);
      return;
    }

    // Now call defaultRouteInit
    const [dataSourceForDefaultRoute] = extensionManager.getActiveDataSource();

    // @ts-ignore
    await defaultRouteInit({
      servicesManager,
      extensionManager,
      studyInstanceUIDs,
      dataSource: dataSourceForDefaultRoute,
    });

    return studyInstanceUIDs;
  },
};

// Create the mode instance by extending the basic mode instance
const modeInstance = {
  ...basicModeInstance,
  id,
  routeName: '',
  displayName: ({ servicesManager }) => {
    const isOverreadMode = servicesManager?.services?.isOverreadMode === true;
    return isOverreadMode ? 'XNAT Overread Viewer' : 'XNAT Viewer';
  },
  onModeInit: ({ servicesManager, extensionManager, commandsManager, appConfig, query }) => {
    // Get query parameters
    const { projectId, parentProjectId, subjectId, experimentId, experimentLabel, overreadMode } =
      Object.fromEntries(query.entries());

    // Store overread mode flag in services manager for use in layout
    if (overreadMode === 'true') {
      servicesManager.services.isOverreadMode = true;
      console.log('XNAT Mode: Overread mode detected');
    }

    // Set session map parameters
    if (projectId) {
      sessionMap.setProject(projectId);
    }
    if (subjectId) {
      sessionMap.setSubject(subjectId);
    }
    if (parentProjectId) {
      sessionMap.setParentProject(parentProjectId);
    }

    // Initialize session router if we have experiment parameters
    if (experimentId && projectId) {
      try {
        const sessionRouter = new SessionRouter(
          projectId,
          parentProjectId,
          subjectId,
          experimentId,
          experimentLabel
        );

        servicesManager.services.sessionRouter = sessionRouter;

        const layoutService = servicesManager.services.layoutService;
        if (layoutService) {
          layoutService.setLayout({
            numRows: 1,
            numCols: 1,
            layoutType: 'grid',
          });
        }
      } catch (error) {
        console.error('XNAT Mode Init - Error creating session router:', error);
      }
    } else {
      console.warn('XNAT Mode Init - Missing required params for session router');
    }
  },
  onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
    // Call the basic mode's onModeEnter first
    basicModeInstance.onModeEnter({ servicesManager, extensionManager, commandsManager });

    // Log the current mode state
    const isOverreadMode = servicesManager?.services?.isOverreadMode === true;
    console.log('XNAT Mode Enter:', isOverreadMode ? 'Overread Mode' : 'Regular Mode');

    // Add visual indicator for overread mode
    if (isOverreadMode) {
      console.log('🎯 OVERREAD MODE ACTIVE - Custom forms panel should be visible');
      console.log('📋 Available panels:', servicesManager.services.panelService?.getPanels()?.map(p => p.name) || 'Not available');
    }

    const {
      toolbarService,
      customizationService,
    } = servicesManager.services;

    // Suppress verbose J2K decoder logs
    try {
      const windowWithLog = window as any;
      if (windowWithLog.log && windowWithLog.log.getLogger) {
        const dicomLoader = windowWithLog.log.getLogger('cs3d.dicomImageLoader');
        if (dicomLoader && dicomLoader.setLevel) {
          dicomLoader.setLevel('WARN');
        }
      }
    } catch (e) {
      console.warn('Could not configure J2K logging level:', e);
    }

    // Load cornerstone extension's customizations first
    try {
      const cornerstoneCustomizations = extensionManager.getModuleEntry('@ohif/extension-cornerstone.customizationModule.default');
      if (cornerstoneCustomizations && typeof cornerstoneCustomizations === 'object') {
        customizationService.setCustomizations(cornerstoneCustomizations as Record<string, any>);
      }
    } catch (error) {
      console.warn('Could not load cornerstone customizations:', error);
    }

    // Set up XNAT-specific customizations
    customizationService.setCustomizations({
      'panelSegmentation.readableText': {
        $set: {
          min: 'Min Value',
          max: 'Max Value',
          mean: 'Mean Value',
          stdDev: 'Standard Deviation',
          count: 'Voxel Count',
          volume: 'Volume',
        },
      },
      'panelSegmentation.disableEditing': { $set: false },
      'panelSegmentation.showAddSegment': { $set: true },
      'panelSegmentation.tableMode': { $set: 'collapsed' },
      'cornerstoneViewportClickCommands': {
        $set: {
          doubleClick: ['toggleOneUp'],
          button1: ['closeContextMenu'],
          button3: [
            {
              commandName: 'showCornerstoneContextMenu',
              commandOptions: {
                requireNearbyToolData: true,
                menuId: 'measurementsContextMenu',
              },
            },
          ],
        },
      },
      // Overread mode specific customizations
      ...(isOverreadMode && {
        'worklist.showStudyList': { $set: false },
        'worklist.showPatientInfo': { $set: false },
      }),
    });

    // Set up toolbar sections specific to XNAT
    toolbarService.updateSection(toolbarService.sections.primary, [
      'returnToXNAT',
      'MeasurementTools',
      'Zoom',
      'Pan',
      'TrackballRotate',
      'WindowLevel',
      'Layout',
      'Crosshairs',
      'MoreTools',
    ]);

    // Set up segmentation toolbox sections
    toolbarService.updateSection(toolbarService.sections.segmentationToolbox, [
      'SegmentationUtilities',
      'SegmentationTools',
    ]);
    toolbarService.updateSection('SegmentationUtilities', [
      'LabelmapSlicePropagation',
      'InterpolateLabelmap',
      'SegmentBidirectional',
    ]);
    toolbarService.updateSection('SegmentationTools', [
      'MarkerLabelmap',
      'RegionSegmentPlus',
      'Shapes',
      'Threshold',
      'Brush',
      'Eraser',
    ]);
    toolbarService.updateSection('BrushTools', ['Brush', 'Eraser', 'Threshold']);
  },
  routes: [xnatRoute],
  extensions: extensionDependencies,
  hangingProtocol: [
    'default',
    'mpr',
    'main3D',
    'mprAnd3DVolumeViewport',
    'only3D',
    'primary3D',
    'primaryAxial',
    'fourUp'
  ],
  sopClassHandlers: [
    xnat.sopClassHandler,
    dicomvideo.sopClassHandler,
    dicomSeg.sopClassHandler,
    dicomPmap.sopClassHandler,
    ohif.sopClassHandler,
    ohif.wsiSopClassHandler,
    dicompdf.sopClassHandler,
    dicomsr.sopClassHandler3D,
    dicomsr.sopClassHandler,
    dicomRT.sopClassHandler,
  ],
  dataSourcesConfig: {
    xnat: {
      friendlyName: 'XNAT Viewer',
      isValidStudyUID: true,
      isValidationRequired: false,
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
export { initToolGroups, toolbarButtons };