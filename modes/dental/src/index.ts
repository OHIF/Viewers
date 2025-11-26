import { id } from './id';
import initDentalToolGroups from './initToolGroups';
import dentalToolbarButtons from './toolbarButtons';
import { toolbarButtons as basicToolbarButtons } from '@ohif/mode-basic';
import { ToolbarService } from '@ohif/core';
import {
  initializeDentalAnnotationFiltering,
  resetDentalAnnotationFiltering,
} from './tools/DentalViewportAnnotationTool';
import { removeAllAnnotationsForViewport } from './utils/dentalAnnotationFilter';
import dentalCustomizations from './customizations';

const { TOOLBAR_SECTIONS } = ToolbarService;

// Track the currently requested auto-label for next measurement
let currentDentalLabel: string | null = null;

// Extend Window interface to allow setViewerTheme
declare global {
  interface Window {
    setViewerTheme?: (theme: string) => void;
  }
}

export const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-dental-theme-toggle': '^3.0.0',
  '@ohif/extension-measurement-tracking': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-seg': '^3.0.0',
  '@ohif/extension-cornerstone-dicom-sr': '^3.0.0',
};

// Define SR viewport and SOP class handlers for dental mode
const dicomsr = {
  sopClassHandler: '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr',
  sopClassHandler3D: '@ohif/extension-cornerstone-dicom-sr.sopClassHandlerModule.dicom-sr-3d',
  viewport: '@ohif/extension-cornerstone-dicom-sr.viewportModule.dicom-sr',
};

/**
 * Indicate this is a valid mode for dental imaging studies
 */
export function isValidMode({ modalities, series, study }) {
  console.log('Dental Mode isValidMode called with:', { modalities, series, study });

  // Handle modalities as string (OHIF format: "CT\\MR\\PX")
  if (modalities) {
    const modalityList = modalities.split('\\');
    console.log('Processed modalities:', modalityList);

    // Check for dental-specific modalities
    const dentalModalities = ['DX', 'PX', 'IO', 'PAN', 'CEPH'];
    const foundDentalModality = dentalModalities.find(
      mod => modalityList.includes(mod) || modalityList.includes(mod.toLowerCase())
    );

    if (foundDentalModality) {
      console.log('Dental modality found! Activating dental mode');
      return {
        valid: true,
        description: `Dental mode activated for ${foundDentalModality} modality`,
      };
    }
  }

  // Check for dental keywords in series descriptions
  if (series && Array.isArray(series)) {
    const dentalKeywords = [
      'dental',
      'intraoral',
      'panoramic',
      'cephalometric',
      'bitewing',
      'periapical',
    ];
    const foundKeyword = dentalKeywords.find(keyword => {
      return series.some(s => {
        const desc = s.SeriesDescription?.toLowerCase();
        return desc && desc.includes(keyword);
      });
    });

    if (foundKeyword) {
      console.log('Dental series description found! Activating dental mode');
      return {
        valid: true,
        description: `Dental mode activated for ${foundKeyword} series`,
      };
    }
  }

  console.log('No dental indicators found');
  return {
    valid: false,
    description:
      'Dental mode requires PX, DX, IO, PAN, or CEPH modalities, or dental-related series descriptions',
  };
}

// Define toolbar sections for dental mode following basic mode pattern
const dentalToolbarSections = {
  [TOOLBAR_SECTIONS.primary]: [
    'DentalMeasurementTools',
    'ClearViewport',
    'Zoom',
    'Pan',
    'WindowLevel',
    'Capture',
    'Layout',
  ],

  [TOOLBAR_SECTIONS.viewportActionMenu.topLeft]: ['orientationMenu', 'dataOverlayMenu'],

  [TOOLBAR_SECTIONS.viewportActionMenu.bottomMiddle]: ['AdvancedRenderingControls'],

  AdvancedRenderingControls: [
    'windowLevelMenuEmbedded',
    'voiManualControlMenu',
    'Colorbar',
    'opacityMenu',
    'thresholdMenu',
  ],

  [TOOLBAR_SECTIONS.viewportActionMenu.topRight]: [
    'modalityLoadBadge',
    'trackingStatus',
    'navigationComponent',
  ],

  [TOOLBAR_SECTIONS.viewportActionMenu.bottomLeft]: ['windowLevelMenu'],

  DentalMeasurementTools: ['PALength', 'CanalAngle', 'CrownWidth', 'RootLength'],
};

function onModeEnter({ servicesManager, extensionManager, commandsManager }) {
  const {
    toolbarService,
    toolGroupService,
    measurementService,
    panelService,
    customizationService,
  } = servicesManager.services;

  // Initialize dental-specific annotation filtering
  // This ensures annotations created in one viewport only appear in that viewport
  initializeDentalAnnotationFiltering(servicesManager);

  // Clear measurements on mode enter like basic mode
  measurementService.clearMeasurements();

  // Register dental customizations using setCustomizations
  customizationService.setCustomizations(dentalCustomizations);

  // Always set dental theme as default on dental mode routing
  const rootElement = document.documentElement;
  rootElement.classList.add('dental-theme');
  rootElement.classList.remove('ohif-theme');
  localStorage.setItem('viewerTheme', 'dental');
  if (window.setViewerTheme) {
    window.setViewerTheme('dental');
  }

  // Initialize dental tool groups so measurement tools can be used
  initDentalToolGroups(extensionManager, toolGroupService, commandsManager);

  // Create a dental commands context if not already present
  commandsManager.createContext('DENTAL_MODE');

  // Register dental measurement activation command
  commandsManager.registerCommand('DENTAL_MODE', 'activateDentalMeasurement', {
    commandFn: ({ toolName, label }) => {
      // Activate underlying cornerstone tool via existing global command
      // Apply to all dental tool groups for consistent behavior across viewports
      commandsManager.runCommand('setToolActiveToolbar', {
        toolGroupIds: [
          'dental-current',
          'dental-prior',
          'dental-bitewing-left',
          'dental-bitewing-right',
        ],
        toolName,
      });
      currentDentalLabel = label;
    },
  });

  // Register duplicate image command
  commandsManager.registerCommand('DENTAL_MODE', 'duplicateImageToNextViewport', {
    commandFn: ({ displaySetInstanceUID }) => {
      const { viewportGridService, hangingProtocolService } = servicesManager.services;

      if (!displaySetInstanceUID) {
        console.warn('No display set instance UID provided for duplication');
        return;
      }

      // Get all viewports
      const { viewports } = viewportGridService.getState();
      const viewportIds = Array.from(viewports.keys());

      if (viewportIds.length < 2) {
        console.warn('Not enough viewports to duplicate image');
        return;
      }

      // Get active viewport
      const activeViewportId = viewportGridService.getActiveViewportId();
      const currentIndex = viewportIds.indexOf(activeViewportId);

      // Find next viewport (wrap around if needed)
      const nextIndex = (currentIndex + 1) % viewportIds.length;
      const nextViewportId = viewportIds[nextIndex];

      // Set the display set in the next viewport
      try {
        const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
          nextViewportId,
          displaySetInstanceUID,
          true // isHangingProtocolLayout
        );

        if (updatedViewports && updatedViewports.length > 0) {
          commandsManager.runCommand('setDisplaySetsForViewports', {
            viewportsToUpdate: updatedViewports,
          });
        } else {
          // Fallback: directly set the display set
          viewportGridService.setDisplaySetsForViewport({
            viewportId: nextViewportId,
            displaySetInstanceUIDs: [displaySetInstanceUID],
          });
        }
      } catch (error) {
        console.error('Error duplicating image:', error);
        // Fallback to simple assignment
        viewportGridService.setDisplaySetsForViewport({
          viewportId: nextViewportId,
          displaySetInstanceUIDs: [displaySetInstanceUID],
        });
      }
    },
  });

  // Register clear viewport command
  commandsManager.registerCommand('DENTAL_MODE', 'clearActiveViewport', {
    commandFn: () => {
      const { viewportGridService, cornerstoneViewportService } = servicesManager.services;
      const activeViewportId = viewportGridService.getActiveViewportId();

      if (activeViewportId) {
        // Remove all annotations for this viewport
        removeAllAnnotationsForViewport(activeViewportId);

        // Clear the display sets for this viewport
        viewportGridService.setDisplaySetsForViewport({
          viewportId: activeViewportId,
          displaySetInstanceUIDs: [],
        });

        // Force a re-render to update the viewport
        const renderingEngine = cornerstoneViewportService.getRenderingEngine();
        if (renderingEngine) {
          renderingEngine.render();
        }
      }
    },
  });

  // Auto-label measurement after it's fully added
  const addedSubscription = measurementService.subscribe(
    measurementService.EVENTS.MEASUREMENT_ADDED,
    ({ measurement }) => {
      if (currentDentalLabel && !measurement.label) {
        measurementService.update(
          measurement.uid,
          {
            ...measurement,
            label: currentDentalLabel,
          },
          true
        );
        // reset so subsequent measurements require explicit tool click
        currentDentalLabel = null;
      }
    }
  );

  // Register buttons & sections via this context (pattern matches basic mode)
  toolbarService.register(this.toolbarButtons);
  for (const [key, section] of Object.entries(this.toolbarSections)) {
    toolbarService.updateSection(key, section);
  }

  // Add activation panel triggers for measurements like basic mode
  this._activatePanelTriggersSubscriptions = [
    ...panelService.addActivatePanelTriggers(
      '@ohif/extension-cornerstone.panelModule.dentalMeasurement',
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
  ];

  // Store subscription for cleanup
  (modeInstance as any)._dentalSubscriptions = [addedSubscription];

  return {
    studies: [],
  };
}

function onModeExit() {
  // Cleanup panel triggers like basic mode
  this._activatePanelTriggersSubscriptions.forEach(sub => sub.unsubscribe());
  this._activatePanelTriggersSubscriptions.length = 0;

  // Reset dental annotation filtering
  resetDentalAnnotationFiltering();

  // Revert to OHIF theme when exiting dental mode
  const rootElement = document.documentElement;
  rootElement.classList.remove('dental-theme');
  rootElement.classList.add('ohif-theme');
  localStorage.setItem('viewerTheme', 'ohif');
  // Cleanup subscriptions
  const subs = (modeInstance as any)._dentalSubscriptions || [];
  subs.forEach(sub => sub.unsubscribe && sub.unsubscribe());
  (modeInstance as any)._dentalSubscriptions = [];
}

// Filter basic toolbar buttons to exclude segmentation-specific ones
const allowedBasicButtons = [
  'Reset',
  'rotate-right',
  'flipHorizontal',
  'invert',
  'Cine',
  'WindowLevel',
  'Pan',
  'Zoom',
  'TrackballRotate',
  'Capture',
  'Layout',
  'modalityLoadBadge',
  'trackingStatus',
  'navigationComponent',
  'dataOverlayMenu',
  'orientationMenu',
  'windowLevelMenu',
  'windowLevelMenuEmbedded',
  'voiManualControlMenu',
  'Colorbar',
  'opacityMenu',
  'thresholdMenu',
];
const filteredBasicButtons = basicToolbarButtons.filter(button =>
  allowedBasicButtons.includes(button.id)
);

const modeInstance = {
  id,
  displayName: 'Dental Mode',
  routeName: 'dental',
  toolbarButtons: [...filteredBasicButtons, ...dentalToolbarButtons],
  toolbarSections: dentalToolbarSections,
  _activatePanelTriggersSubscriptions: [],
  onModeEnter,
  onModeExit,
  validationTags: {
    study: [],
    series: [],
  },
  isValidMode,
  routes: [
    {
      path: 'dental',
      layoutTemplate: ({ location, servicesManager }) => {
        return {
          id: '@ohif/extension-default.layoutTemplateModule.viewerLayout',
          props: {
            leftPanels: ['@ohif/extension-default.panelModule.seriesList'],
            rightPanels: [
              '@ohif/extension-dental-theme-toggle.panelModule.dentalThemeToggle',
              '@ohif/extension-cornerstone.panelModule.dentalMeasurement',
            ],
            viewports: [
              {
                namespace: '@ohif/extension-cornerstone.viewportModule.cornerstone',
                displaySetsToDisplay: ['@ohif/extension-default.sopClassHandlerModule.stack'],
              },
              {
                namespace: dicomsr.viewport,
                displaySetsToDisplay: [dicomsr.sopClassHandler, dicomsr.sopClassHandler3D],
              },
            ],
          },
        };
      },
    },
  ],
  extensions: extensionDependencies,
  hangingProtocol: '@ohif/dental-2x2',
  sopClassHandlers: [
    '@ohif/extension-default.sopClassHandlerModule.stack',
    dicomsr.sopClassHandler,
    dicomsr.sopClassHandler3D,
  ],
};

const mode = {
  id,
  modeFactory: ({ modeConfiguration }) => {
    return modeInstance;
  },
  extensionDependencies,
};

export default mode;
