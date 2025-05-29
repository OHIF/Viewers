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
};


const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-seg': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-pmap': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-rt': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
  '@ohif/extension-xnat': '^0.0.1',

};

function modeFactory({ modeConfiguration }) {
  let _activatePanelTriggersSubscriptions = [];
  let _displaySetAddedSubscription = null;
  return {
    id,
    routeName: '',
    displayName: 'XNAT Viewer',
    onModeInit: ({ servicesManager, extensionManager, commandsManager, appConfig, query }) => {
      
      // Get query parameters
      const { projectId, parentProjectId, subjectId, experimentId, experimentLabel } = 
        Object.fromEntries(query.entries());
      
      
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
            parentProjectId || projectId,
            subjectId,
            experimentId,
            experimentLabel
          );
          
          // Store the router instance in the services manager
          servicesManager.services.sessionRouter = sessionRouter;
          console.log('XNAT Mode Init - Session router created successfully');
          
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
    onModeEnter: ({ servicesManager, extensionManager, commandsManager }: withAppTypes) => {
      const { measurementService, toolbarService, toolGroupService, customizationService } =
        servicesManager.services;

      measurementService.clearMeasurements();

      // Init Default and SR ToolGroups
      initToolGroups(extensionManager, toolGroupService, commandsManager);

      toolbarService.register(toolbarButtons);
      toolbarService.updateSection(toolbarService.sections.primary, [
        'MeasurementTools',
        'Zoom',
        'Pan',
        'TrackballRotate',
        'WindowLevel',
        'Capture',
        'Layout',
        'Crosshairs',
        'MoreTools',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.topLeft, [
        'orientationMenu',
        'dataOverlayMenu',
      ]);

      toolbarService.updateSection(toolbarService.sections.viewportActionMenu.bottomMiddle, [
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
        console.log('XNAT Mode - Exiting - Unsubscribed from DISPLAY_SETS_ADDED event.');
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
      console.log('XNAT isValidMode check:', { modalities });
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
        layoutTemplate: () => {
          return {
            id: ohif.layout,
            props: {
              leftPanels: [ xnat.studyBrowser, xnat.xnatNavList],
              leftPanelResizable: true,
              rightPanels: [xnat.segmentation, cornerstone.measurements],
              // rightPanels: [cornerstone.measurements],
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
          console.log('XNAT Mode - Route Init - START', { studyInstanceUIDs, servicesManager, extensionManager });
          // Re-enable init logic
          // console.log('XNAT Route Init - Temporarily Disabled');
          // return []; // Return empty array to prevent further processing
          // /*
          const layoutService = servicesManager.services.layoutService;
          
          // Get the study UIDs from the session router if available
          if (!studyInstanceUIDs || studyInstanceUIDs.length === 0) {
            console.log('Route init - No study UIDs provided, checking session router');
            const sessionRouter = servicesManager.services.sessionRouter;
            
            if (sessionRouter) {
              try {
                // Make sure to await the result
                const studyUID = await sessionRouter.go();
                console.log('XNAT Mode - Route Init - After sessionRouter.go()', { studyUID, studyInstanceUIDs });
                
                if (studyUID) {
                  console.log('Route init - Got study UID from session router:', studyUID);
                  studyInstanceUIDs = [studyUID];
                  
                  // Explicitly update the data source
                  const dataSource = extensionManager.getActiveDataSource();
                  if (dataSource) {
                    console.log('Route init - Setting up data source with study:', studyUID);
                    
                    // Make sure viewports are ready for the study
                    if (layoutService) {
                      layoutService.setViewportsForStudies(studyInstanceUIDs);
                    }
                    
                    // Tell OHIF to show the default hanging protocol for this study
                    const hangingProtocolService = servicesManager.services.hangingProtocolService;
                    if (hangingProtocolService) {
                      console.log('Route init - Applying hanging protocol for study');
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
              console.log('XNAT Mode - Route Init - Before dataSource.initialize()', { dataSource });
              console.log('XNAT Mode Route Init: Calling dataSource.initialize()');
              // Pass the query parameters needed for initialization
              const query = new URLSearchParams(window.location.search); 
              await dataSource.initialize({ params: {}, query }); // Assuming params might not be needed here, pass query
              console.log('XNAT Mode - Route Init - After dataSource.initialize()');
              console.log('XNAT Mode Route Init: dataSource.initialize() completed.');
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
                console.log('XNAT Mode - EVENT: DISPLAY_SETS_ADDED FIRING! Raw event data:', eventData);
                const displaySetsAdded = eventData?.displaySetsAdded;
                const options = eventData?.options;
                console.log('XNAT Mode - EVENT: DISPLAY_SETS_ADDED triggered.', { numDisplaySetsAdded: displaySetsAdded ? displaySetsAdded.length : 0, options });
                if (displaySetsAdded && displaySetsAdded.length > 0) {
                  console.log('XNAT Mode - EVENT: Display sets were added:', displaySetsAdded);
                  for (const ds of displaySetsAdded) {
                    console.log(`XNAT Mode - EVENT: Added DisplaySet UID: ${ds.displaySetInstanceUID}`);
                    console.log(`  - Modality: ${ds.Modality}`);
                    console.log(`  - SeriesInstanceUID: ${ds.SeriesInstanceUID}`);
                    console.log(`  - SeriesDescription: ${ds.SeriesDescription}`);
                    console.log(`  - SOPClassUIDs:`, ds.SOPClassUIDs);
                    console.log(`  - Instance count: ${ds.instances ? ds.instances.length : 'N/A'}`);
                    console.log(`  - isLoaded: ${ds.isLoaded}, isDerived: ${ds.isDerived}, isReconstructable: ${ds.isReconstructable}`);
                    console.log(`  - Made in client: ${ds.madeInClient}`);
                    console.log(`  - Complete Added DisplaySet object UID ${ds.displaySetInstanceUID}:`, ds);
                  }
                } else {
                  console.log('XNAT Mode - EVENT: DISPLAY_SETS_ADDED fired, but displaySetsAdded array is empty or missing in eventData.');
                }
              }
            );
            console.log('XNAT Mode - Route Init - Subscribed to DISPLAY_SETS_ADDED event.');
          } else {
            console.warn('XNAT Mode - Route Init - DisplaySetService or its event system not available for subscription.');
          }

          // Now call defaultRouteInit - Reverting back to single object argument
          // based on runtime error and function definition.
          // Ignore the incorrect linter error about argument count.
          const [dataSourceForDefaultRoute] = extensionManager.getActiveDataSource(); // Get dataSource again, use different name to avoid shadowing
          console.log('XNAT Mode - Route Init - Before defaultRouteInit()', { studyInstanceUIDs, dataSourceForDefaultRoute });
          // @ts-ignore - Linter incorrectly expects 3 arguments, but function needs object.
          await defaultRouteInit({
            servicesManager,
            extensionManager, // Pass extensionManager as well
            studyInstanceUIDs,
            dataSource: dataSourceForDefaultRoute, // Include dataSource
            // filters and appConfig might be needed later if errors occur
          });
          console.log('XNAT Mode - Route Init - After defaultRouteInit()');

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
