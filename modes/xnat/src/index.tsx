import { hotkeys } from '@ohif/core';
import initToolGroups from './initToolGroups';
import toolbarButtons from './toolbarButtons';
import { id } from './id';
import SessionRouter from '@ohif/extension-xnat/src/xnat-components/XNATNavigation/helpers/SessionRouter.js';
import { defaultRouteInit } from '../../../platform/app/src/routes/Mode/defaultRouteInit';
import sessionMap from '@ohif/extension-xnat/src/utils/sessionMap.js';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
  wsiSopClassHandler:
    '@ohif/extension-cornerstone.sopClassHandlerModule.DicomMicroscopySopClassHandler',
};

const cornerstone = {
  viewport: '@ohif/extension-cornerstone.viewportModule.cornerstone',
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
  segmentation: '@ohif/extension-cornerstone.panelModule.panelSegmentationWithTools',
};

const dicomsr = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr',
  sopClassHandler3D: '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr-3d',
  viewport: '@ohif/extension-cornerstone-dicom-sr.viewportModule.dicom-sr',
};

const dicomvideo = {
  sopClassHandler: '@ohif/extension-dicom-video.sopClassHandlerModule.dicom-video',
  viewport: '@ohif/extension-dicom-video.viewportModule.dicom-video',
};

const dicompdf = {
  sopClassHandler: '@ohif/extension-dicom-pdf.sopClassHandlerModule.dicom-pdf',
  viewport: '@ohif/extension-dicom-pdf.viewportModule.dicom-pdf',
};

const dicomSeg = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-seg.sopClassHandlerModule.dicom-seg',
  viewport: '@ohif/extension-cornerstone-dicom-seg.viewportModule.dicom-seg',
};

const dicomPmap = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-pmap.sopClassHandlerModule.dicom-pmap',
  viewport: '@ohif/extension-cornerstone-dicom-pmap.viewportModule.dicom-pmap',
};

const dicomRT = {
  viewport: '@ohif/extension-cornerstone-dicom-rt.viewportModule.dicom-rt',
  sopClassHandler: '@ohif/extension-cornerstone-dicom-rt.sopClassHandlerModule.dicom-rt',
};

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
  // Can derive the versions at least process.env.from npm_package_version
  '@ohif/extension-default': '^3.11.0-beta.44',
  '@ohif/extension-cornerstone': '^3.11.0-beta.44',
  '@ohif/extension-cornerstone-dicom-sr': '^3.11.0-beta.44',
  '@ohif/extension-cornerstone-dicom-seg': '^3.11.0-beta.44',
  '@ohif/extension-cornerstone-dicom-pmap': '^3.11.0-beta.44',
  '@ohif/extension-cornerstone-dicom-rt': '^3.11.0-beta.44',
  '@ohif/extension-dicom-pdf': '^3.11.0-beta.44',
  '@ohif/extension-dicom-video': '^3.11.0-beta.44',
  '@ohif/extension-measurement-tracking': '^3.11.0-beta.44',
  '@ohif/extension-xnat': '^0.0.1',

};

function modeFactory({ modeConfiguration }) {
  let _activatePanelTriggersSubscriptions = [];
  let _displaySetAddedSubscription = null;
  return {
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
      
      // ---> ADD SESSION MAP SETTERS HERE <---
      if (projectId) {
        sessionMap.setProject(projectId);
      }
      if (subjectId) {
        sessionMap.setSubject(subjectId);
      }
      if (parentProjectId) {
         sessionMap.setParentProject(parentProjectId);
      }
      // --------------------------------------

      // If we have experiment/session parameters, initialize the session router
      if (experimentId && projectId) {
        try {
          const sessionRouter = new SessionRouter(
            projectId,
            parentProjectId,
            subjectId,
            experimentId,
            experimentLabel
          );

          // Store the router instance in the services manager
          servicesManager.services.sessionRouter = sessionRouter;
          
          // Set up the layout right away since we know we'll need it
          const layoutService = servicesManager.services.layoutService;
          if (layoutService) {
            // Use a standard viewport layout
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
    /**
     * Runs when the Mode Route is mounted to the DOM. Usually used to initialize
     * Services and other resources.
     */
    onModeEnter: ({ servicesManager, extensionManager, commandsManager }) => {
      // Log the current mode state
      const isOverreadMode = servicesManager?.services?.isOverreadMode === true;
      console.log('XNAT Mode Enter:', isOverreadMode ? 'Overread Mode' : 'Regular Mode');
      
      // Add visual indicator for overread mode
      if (isOverreadMode) {
        console.log('🎯 OVERREAD MODE ACTIVE - Custom forms panel should be visible');
        console.log('📋 Available panels:', servicesManager.services.panelService?.getPanels()?.map(p => p.name) || 'Not available');
      }
      
      const {
        measurementService,
        toolbarService,
        toolGroupService,
        customizationService,
        userAuthenticationService,
      } = servicesManager.services;

      measurementService.clearMeasurements();

      // Suppress verbose J2K decoder logs
      try {
        const windowWithLog = window as any;
        if (windowWithLog.log && windowWithLog.log.getLogger) {
          const dicomLoader = windowWithLog.log.getLogger('cs3d.dicomImageLoader');
          if (dicomLoader && dicomLoader.setLevel) {
            dicomLoader.setLevel('WARN'); // Only show warnings and errors, not info logs
          }
        }
      } catch (e) {
        console.warn('Could not configure J2K logging level:', e);
      }
      
      toolbarService.register(toolbarButtons);

      // Load cornerstone extension's customizations first
      try {
        const cornerstoneCustomizations = extensionManager.getModuleEntry('@ohif/extension-cornerstone.customizationModule.default');
        if (cornerstoneCustomizations && typeof cornerstoneCustomizations === 'object') {
          customizationService.setCustomizations(cornerstoneCustomizations as Record<string, any>);
        }
      } catch (error) {
        console.warn('Could not load cornerstone customizations:', error);
      }

      // Set up segmentation panel customizations
      customizationService.setCustomizations({
        'panelSegmentation.readableText': {
          $set: {
            // the values will appear in this order
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
        // Add viewport click commands to prevent button1 undefined error
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

      // Init Default and SR ToolGroups
      initToolGroups(extensionManager, toolGroupService, commandsManager);

      // Set up toolbar refresh on tool activation
      const { viewportGridService } = servicesManager.services;
      
      // Listen for tool activation events to refresh toolbar state
      const toolGroupServiceSubscription = (toolGroupService as any).subscribe(
        (toolGroupService as any).EVENTS.PRIMARY_TOOL_ACTIVATED,
        () => {
          const activeViewportId = viewportGridService.getActiveViewportId();
          if (activeViewportId) {
            toolbarService.refreshToolbarState({ 
              viewportId: activeViewportId 
            });
          }
        }
      );
      
      // Store subscription for cleanup on mode exit
      _activatePanelTriggersSubscriptions.push(toolGroupServiceSubscription);

      toolbarService.updateSection(toolbarService.sections.primary, [
        'returnToXNAT',
        'MeasurementTools',
        'Zoom',
        'Pan',
        'TrackballRotate',
        'WindowLevel',
        // 'Capture',
        'Layout',
        'Crosshairs',
        'MoreTools',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.topLeft, [
        'orientationMenu',
        'dataOverlayMenu',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.bottomRight, [
        'AdvancedRenderingControls',
      ]);

      toolbarService.updateSection('AdvancedRenderingControls', [
        'windowLevelMenuEmbedded',
        'voiManualControlMenu',
        'Colorbar',
        'opacityMenu',
        'thresholdMenu',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.topRight, [
        'modalityLoadBadge',
        'trackingStatus',
        'navigationComponent',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.bottomLeft, [
        'windowLevelMenu',
      ]);

      toolbarService.updateSection('MeasurementTools', [
        'Length',
        'Bidirectional',
        'ArrowAnnotate',
        'EllipticalROI',
        'RectangleROI',
        'CircleROI',
        'PlanarFreehandROI',
        'SplineROI',
        'LivewireContour',
      ]);

      toolbarService.updateSection('MoreTools', [
        'Reset',
        'rotate-right',
        'flipHorizontal',
        'ImageSliceSync',
        'ReferenceLines',
        'ImageOverlayViewer',
        'StackScroll',
        'invert',
        'Probe',
        'Cine',
        'Angle',
        'CobbAngle',
        'Magnify',
        'CalibrationLine',
        'TagBrowser',
        'AdvancedMagnify',
        'UltrasoundDirectionalTool',
        'WindowLevelRegion',
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
    onModeExit: ({ servicesManager }: withAppTypes) => {
      const {
        toolGroupService,
        syncGroupService,
        segmentationService,
        cornerstoneViewportService,
        uiDialogService,
        uiModalService,
      } = servicesManager.services;

      _activatePanelTriggersSubscriptions.forEach(sub => sub.unsubscribe());
      _activatePanelTriggersSubscriptions = [];

      if (_displaySetAddedSubscription) {
        _displaySetAddedSubscription.unsubscribe();
        _displaySetAddedSubscription = null;
      }

      uiDialogService.hideAll();
      uiModalService.hide();
      toolGroupService.destroy();
      syncGroupService.destroy();
      segmentationService.destroy();
      cornerstoneViewportService.destroy();
    },
    validationTags: {
      study: [],
      series: [],
    },
    /**
     * A boolean return value that indicates whether the mode is valid for the
     * modalities of the selected studies. For instance a PET/CT mode should be
     */
    isValidMode: ({ modalities }) => {
      return { valid: true };
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
        path: '/',
        layoutTemplate: ({ servicesManager }) => {
          // Check if we're in overread mode
          const isOverreadMode = servicesManager?.services?.isOverreadMode === true;
          
          // Choose panels based on mode
          const rightPanels = isOverreadMode 
            ? [xnat.segmentation, xnat.measurements, xnat.customForms]  // Overread mode: include custom forms
            : [xnat.segmentation, xnat.measurements];                   // Regular mode: standard panels
          
            const leftPanels = isOverreadMode
              ? [ xnat.studyBrowser, xnat.overreadNavList]
              : [ xnat.studyBrowser, xnat.xnatNavList];
          return {
            id: ohif.layout,
            props: {
              leftPanels: leftPanels,
              leftPanelResizable: true,
              rightPanels: rightPanels,
              rightPanelResizable: true,
              rightPanelClosed: true,
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
                    // Include handlers relevant to longitudinal/standard viewing
                    // Keep other specific handlers needed by XNAT below
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
                // Add WSI handler if needed, maybe to primary viewport?
                 {
                   namespace: cornerstone.viewport, // Or specific WSI viewport if available
                   displaySetsToDisplay: [ohif.wsiSopClassHandler],
                 },
              ],
            },
          };
        },
        init: async ({ servicesManager, extensionManager, studyInstanceUIDs }) => {
            
          // Re-enable init logic
          // console.log('XNAT Route Init - Temporarily Disabled');
          // return []; // Return empty array to prevent further processing
          // /*
          const layoutService = servicesManager.services.layoutService;
          
          // Get the study UIDs from the session router if available
          if (!studyInstanceUIDs || studyInstanceUIDs.length === 0) {
            const sessionRouter = servicesManager.services.sessionRouter;
            
            if (sessionRouter) {
              try {
                // Make sure to await the result
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
          
          // <<< --- ADD DATASOURCE INITIALIZE CALL HERE --- >>>
          try {
            const [dataSource] = extensionManager.getActiveDataSource();
            if (dataSource && typeof dataSource.initialize === 'function') {
              // Pass the query parameters needed for initialization
              const query = new URLSearchParams(window.location.search); 
              await dataSource.initialize({ params: {}, query }); // Assuming params might not be needed here, pass query
            } else {
              console.error('XNAT Mode Route Init: Could not find active data source or initialize function.');
            }
          } catch (error) {
            console.error('XNAT Mode Route Init: Error calling dataSource.initialize():', error);
            // Decide how to handle error - maybe prevent further execution?
            return; // Stop processing if initialization fails
          }
          // <<< --- END DATASOURCE INITIALIZE CALL --- >>>

          // Subscribe to display set additions before defaultRouteInit
          const { displaySetService } = servicesManager.services;
          if (displaySetService && displaySetService.EVENTS && displaySetService.subscribe) {
            _displaySetAddedSubscription = displaySetService.subscribe(
              displaySetService.EVENTS.DISPLAY_SETS_ADDED,
              (eventData) => { 
                const displaySetsAdded = eventData?.displaySetsAdded;
                const options = eventData?.options;
                if (displaySetsAdded && displaySetsAdded.length > 0) {

                } else {
                  console.log('XNAT Mode - EVENT: DISPLAY_SETS_ADDED fired, but displaySetsAdded array is empty or missing in eventData.');
                }
              }
            );
          } else {
            console.warn('XNAT Mode - Route Init - DisplaySetService or its event system not available for subscription.');
          }

          // Now call defaultRouteInit - Reverting back to single object argument
          // based on runtime error and function definition.
          // Ignore the incorrect linter error about argument count.
          const [dataSourceForDefaultRoute] = extensionManager.getActiveDataSource(); // Get dataSource again, use different name to avoid shadowing
          
          // @ts-ignore - Linter incorrectly expects 3 arguments, but function needs object.
          await defaultRouteInit({
            servicesManager,
            extensionManager, // Pass extensionManager as well
            studyInstanceUIDs,
            dataSource: dataSourceForDefaultRoute, // Include dataSource
            // filters and appConfig might be needed later if errors occur
          });
          

          // Return the study UIDs - this ensures they propagate to the rest of the app
          return studyInstanceUIDs;
          // */
        },
      },
    ],
    /** List of extensions that are used by the mode */
    extensions: extensionDependencies,
    /** HangingProtocol used by the mode */
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
    /** SopClassHandlers used by the mode */
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
}

const mode = {
  id,
  modeFactory,
  extensionDependencies,
};

export default mode;
export { initToolGroups, toolbarButtons };
