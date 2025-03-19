import { DicomMetadataStore, classes } from '@ohif/core';
import { calculateSUVScalingFactors } from '@cornerstonejs/calculate-suv';

import getPTImageIdInstanceMetadata from './getPTImageIdInstanceMetadata';
import { registerHangingProtocolAttributes } from './hangingprotocols';
import { initXNATDicomLoader } from './XNATDicomLoader';

const metadataProvider = classes.MetadataProvider;

// Extend ServicesManager type to include subscribe
interface ExtendedServicesManager {
  services: Record<string, any>;
  subscribe?: (serviceName: string, callback: () => void) => void;
}

/**
 *
 * @param {Object} servicesManager
 * @param {Object} configuration
 */
export default function init({
  servicesManager,
  configuration = {},
  commandsManager,
}: withAppTypes): void {
  const { toolbarService, cineService, viewportGridService, cornerstoneViewportService } = servicesManager.services;
  console.log('XNAT Extension init', { servicesManager, configuration, commandsManager });
  
  // Initialize XNAT DICOM loader with the configuration, returning a standard promise
  const initializeXNATLoader = () => {
    console.log('XNAT Extension: Initializing XNAT DICOM loader');
    try {
      // Pass the configuration to the XNAT DICOM loader
      // Make sure we properly handle the promise returned by initXNATDicomLoader
      const loaderPromise = initXNATDicomLoader(configuration);
      
      // Don't try to call start() on the promise, just use standard then/catch
      loaderPromise
        .then(() => {
          console.log('XNAT Extension: XNAT DICOM loader initialized successfully');
        })
        .catch(error => {
          console.error('XNAT Extension: Failed to initialize XNAT DICOM loader:', error);
        });
      
      return loaderPromise;
    } catch (e) {
      console.warn('XNAT Extension: Error during XNAT DICOM loader initialization:', e);
      // Return a resolved promise to prevent further errors
      return Promise.resolve();
    }
  };
  
  // Call the initialization function right away
  if (cornerstoneViewportService) {
    console.log('XNAT Extension: Cornerstone service available during initialization');
    initializeXNATLoader();
  } else {
    console.log('XNAT Extension: Cornerstone service not yet available during initialization');
    
    // Cast servicesManager to our extended type to allow TypeScript to recognize the subscribe method
    const extendedServicesManager = servicesManager as ExtendedServicesManager;
    
    // Setup listener for when cornerstone service becomes available
    if (extendedServicesManager.subscribe) {
      extendedServicesManager.subscribe('cornerstoneViewportService', () => {
        console.log('XNAT Extension: Cornerstone service now available from subscription');
        initializeXNATLoader();
      });
    }
  }
  
  toolbarService.registerEventForToolbarUpdate(cineService, [
    cineService.EVENTS.CINE_STATE_CHANGED,
  ]);
  // Add
  DicomMetadataStore.subscribe(DicomMetadataStore.EVENTS.INSTANCES_ADDED, handlePETImageMetadata);

  // If the metadata for PET has changed by the user (e.g. manually changing the PatientWeight)
  // we need to recalculate the SUV Scaling Factors
  DicomMetadataStore.subscribe(DicomMetadataStore.EVENTS.SERIES_UPDATED, handlePETImageMetadata);

  // Adds extra custom attributes for use by hanging protocols
  registerHangingProtocolAttributes({ servicesManager });

  // Function to process and subscribe to events for a given set of commands and listeners
  const subscribeToEvents = (listeners: Record<string, any>) => {
    Object.entries(listeners).forEach(([event, commands]) => {
      const supportedEvents = [
        viewportGridService.EVENTS.ACTIVE_VIEWPORT_ID_CHANGED,
        viewportGridService.EVENTS.VIEWPORTS_READY,
      ];

      if (supportedEvents.includes(event)) {
        viewportGridService.subscribe(event, (eventData: { viewportId?: string } | undefined) => {
          const viewportId = eventData?.viewportId ?? viewportGridService.getActiveViewportId();

          // Type assertion for commandsManager.run
          commandsManager.run(commands as any, { viewportId });
        });
      }
    });
  };

  toolbarService.subscribe(toolbarService.EVENTS.TOOL_BAR_MODIFIED, (state: { buttons: Record<string, any> }) => {
    const { buttons } = state;
    for (const [id, button] of Object.entries(buttons)) {
      // Type assertion for button
      const typedButton = button as { props?: { groupId?: string; items?: any[]; listeners?: Record<string, any> } };
      const { groupId, items, listeners } = typedButton.props || {};

      // Handle group items' listeners
      if (groupId && items) {
        items.forEach(item => {
          if (item.listeners) {
            subscribeToEvents(item.listeners);
          }
        });
      }

      // Handle button listeners
      if (listeners) {
        subscribeToEvents(listeners);
      }
    }
  });
}

const handlePETImageMetadata = ({ SeriesInstanceUID, StudyInstanceUID }) => {
  const { instances } = DicomMetadataStore.getSeries(StudyInstanceUID, SeriesInstanceUID);

  if (!instances?.length) {
    return;
  }

  const modality = instances[0].Modality;

  if (!modality || modality !== 'PT') {
    return;
  }

  const imageIds = instances.map(instance => instance.imageId);
  const instanceMetadataArray = [];
  // try except block to prevent errors when the metadata is not correct
  try {
    imageIds.forEach(imageId => {
      const instanceMetadata = getPTImageIdInstanceMetadata(imageId);
      if (instanceMetadata) {
        instanceMetadataArray.push(instanceMetadata);
      }
    });

    if (!instanceMetadataArray.length) {
      return;
    }

    const suvScalingFactors = calculateSUVScalingFactors(instanceMetadataArray);
    instanceMetadataArray.forEach((instanceMetadata, index) => {
      metadataProvider.addCustomMetadata(
        imageIds[index],
        'scalingModule',
        suvScalingFactors[index]
      );
    });
  } catch (error) {
    console.log(error);
  }
};
