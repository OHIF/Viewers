import { hotkeys } from '@ohif/core';
import initToolGroups from './initToolGroups';
import toolbarButtons from './toolbarButtons';
import { id } from './id';
import XNATStandaloneRouting from '../../../platform/app/src/routes/XNATStandaloneRouting';
import SessionRouter from '@ohif/extension-xnat/src/XNATNavigation/helpers/SessionRouter.js';
import { Types } from '@ohif/core';

const ohif = {
  layout: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
  sopClassHandler: '@ohif/extension-default.sopClassHandlerModule.stack',
  thumbnailList: '@ohif/extension-default.panelModule.seriesList',
  wsiSopClassHandler:
    '@ohif/extension-cornerstone.sopClassHandlerModule.DicomMicroscopySopClassHandler',
};

const cornerstone = {
  measurements: '@ohif/extension-cornerstone.panelModule.panelMeasurement',
  segmentation: '@ohif/extension-cornerstone.panelModule.panelSegmentation',
};

const tracked = {
  measurements: '@ohif/extension-measurement-tracking.panelModule.trackedMeasurements',
  thumbnailList: '@ohif/extension-measurement-tracking.panelModule.seriesList',
  viewport: '@ohif/extension-measurement-tracking.viewportModule.cornerstone-tracked',
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
};

const extensionDependencies = {
  // Can derive the versions at least process.env.from npm_package_version
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-seg': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-pmap': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-rt': '^3.0.0',
  '@ohif/extension-dicom-pdf': '^3.0.1',
  '@ohif/extension-dicom-video': '^3.0.1',
  '@ohif/extension-xnat': '^0.0.1',

};

function modeFactory({ modeConfiguration }) {
  return {
    id,
    routeName: '',
    displayName: 'XNAT Viewer',
    onModeInit: ({ servicesManager, extensionManager, commandsManager, appConfig, query }) => {
      console.log('XNAT Mode Init - Query params:', Object.fromEntries(query.entries()));
      
      // Get query parameters
      const { projectId, parentProjectId, subjectId, experimentId, experimentLabel } = 
        Object.fromEntries(query.entries());
      
      console.log('XNAT Mode Init - Parsed params:', { 
        projectId, parentProjectId, subjectId, experimentId, experimentLabel 
      });
      
      // If we have experiment/session parameters, initialize the session router
      if (experimentId && projectId) {
        try {
          console.log('XNAT Mode Init - Creating session router');
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
            console.log('XNAT Mode Init - Setting up initial layout');
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
      console.log('XNAT Mode Enter - Start');
      const { measurementService, toolbarService, toolGroupService } = servicesManager.services;
      console.log('XNAT Mode Enter - Services:', { measurementService, toolbarService, toolGroupService });
      
      measurementService.clearMeasurements();
      initToolGroups(extensionManager, toolGroupService, commandsManager);

      toolbarService.addButtons(toolbarButtons);
      toolbarService.createButtonSection('primary', [
        'MeasurementTools',
        'Zoom',
        'WindowLevel',
        'Pan',
        'Capture',
        'Layout',
        'Crosshairs',
        'MoreTools',
      ]);
      console.log('XNAT Mode Enter - Complete');
    },
    onModeExit: ({ servicesManager }) => {
      const {
        toolGroupService,
        syncGroupService,
        segmentationService,
        cornerstoneViewportService,
        uiDialogService,
        uiModalService,
      } = servicesManager.services;

      uiDialogService.dismissAll();
      uiModalService.hide();
      toolGroupService.destroy();
      syncGroupService.destroy();
      segmentationService.destroy();
      cornerstoneViewportService.destroy();
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
              rightPanels: [cornerstone.segmentation, tracked.measurements],
              rightPanelClosed: true,
              viewports: [
                {
                  namespace: tracked.viewport,
                  displaySetsToDisplay: [
                    ohif.sopClassHandler,
                    dicomvideo.sopClassHandler,
                    dicomsr.sopClassHandler3D,
                    ohif.wsiSopClassHandler,
                  ],
                },
                {
                  namespace: dicomsr.viewport,
                  displaySetsToDisplay: [dicomsr.sopClassHandler],
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
              ],
            },
          };
        },
        init: async ({ servicesManager, extensionManager, studyInstanceUIDs }) => {
          const layoutService = servicesManager.services.layoutService;
          
          // Get the study UIDs from the session router if available
          if (!studyInstanceUIDs || studyInstanceUIDs.length === 0) {
            console.log('Route init - No study UIDs provided, checking session router');
            const sessionRouter = servicesManager.services.sessionRouter;
            
            if (sessionRouter) {
              try {
                // Make sure to await the result
                const studyUID = await sessionRouter.go();
                
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
          
          // Return the study UIDs - this ensures they propagate to the rest of the app
          return studyInstanceUIDs;
        },
      },
    ],
    /** List of extensions that are used by the mode */
    extensions: extensionDependencies,
    /** HangingProtocol used by the mode */
    hangingProtocol: ['default'],
    /** SopClassHandlers used by the mode */
    sopClassHandlers: [
      dicomvideo.sopClassHandler,
      dicomSeg.sopClassHandler,
      dicomPmap.sopClassHandler,
      ohif.sopClassHandler,
      ohif.wsiSopClassHandler,
      dicompdf.sopClassHandler,
      dicomsr.sopClassHandler3D,
      dicomsr.sopClassHandler,
      dicomRT.sopClassHandler,
    ],    /** hotkeys for mode */
    hotkeys: [...hotkeys.defaults.hotkeyBindings],
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
