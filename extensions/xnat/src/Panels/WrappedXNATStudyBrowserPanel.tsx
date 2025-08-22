import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import XNATStudyBrowser from '../xnat-components/XNATStudyBrowser/XNATStudyBrowser';
import { useViewportGrid } from '@ohif/ui-next';
import { DicomMetadataStore } from '@ohif/core';
import sessionMap from '../utils/sessionMap';
import getImageSrcFromImageId from '../../../../extensions/default/src/Panels/getImageSrcFromImageId';

// Declare the AppContext global variable for TypeScript
declare global {
  interface Window {
    AppContext?: {
      xnatSeriesMetadata?: Record<string, any>;
      [key: string]: any;
    };
  }
}

// Define study interface to match the structure we're creating
interface StudyData {
  StudyInstanceUID: string;
  StudyDescription: string;
  session?: {
    experimentId: string;
    projectId: string;
    subjectId: string;
  };
  thumbnails: Array<{
    displaySetInstanceUID: string;
    SeriesDescription: string;
    SeriesNumber: string | number;
    modality: string;
    numImageFrames: number;
    imageId?: string;
  }>;
}


/**
 * Wraps the XNATStudyBrowser and provides services
 * 
 * @param {object} params
 * @param {object} extensionManager
 * @param {object} servicesManager
 * @param {object} commandsManager
 */
function WrappedXNATStudyBrowserPanel({ extensionManager, servicesManager, commandsManager }) {
  
  // Get the data source
  const [dataSource] = extensionManager.getActiveDataSource();
  
  // Get needed services
  const { 
    displaySetService, 
    hangingProtocolService 
  } = servicesManager.services as { 
    displaySetService: any; 
    hangingProtocolService: any; 
  };
  
  const [{ activeViewportId, isHangingProtocolLayout }, viewportGridService] = useViewportGrid();
  
  // Get Cornerstone utilities and create getImageSrc function
  const getCornerstoneLibraries = useCallback(() => {
    const utilities = extensionManager.getModuleEntry(
      '@ohif/extension-cornerstone.utilityModule.common'
    );
    if (!utilities) {
      console.error('Cornerstone utility module not found. Thumbnails may not work.');
      return null;
    }
    try {
      return utilities.exports.getCornerstoneLibraries();
    } catch (ex) {
      console.error('Failed to get Cornerstone libraries:', ex);
      return null;
    }
  }, [extensionManager]);

  const _getImageSrcFromImageId = useCallback(() => {
    const cornerstoneLibraries = getCornerstoneLibraries();
    if (!cornerstoneLibraries || !cornerstoneLibraries.cornerstone) {
       return async () => null; // Return a no-op async function if cornerstone is not available
    }
    return getImageSrcFromImageId.bind(null, cornerstoneLibraries.cornerstone);
  }, [getCornerstoneLibraries]);
  
  // State for our study data - This will now hold the final data with resolved imageSrc
  const [studyBrowserData, setStudyBrowserData] = useState<StudyData[]>([]); 
  const [isLoading, setIsLoading] = useState(true);
  // Ref for debounce timeout
  const debounceTimeoutRef = useRef(null);
  const isMountedRef = useRef(true); // Ref to track mount status
  
  // --- Define processDataHandler outside useEffect ---
  const processDataHandler = useCallback(async () => {
    // Check ref instead of variable
    if (!isMountedRef.current) {
      return;
    }

    const currentDisplaySets = displaySetService.activeDisplaySets;

    const currentStudyInstanceUIDs = Array.from(
      new Set(currentDisplaySets.map(ds => ds.StudyInstanceUID))
    );

    if (!currentDisplaySets || currentDisplaySets.length === 0) {
      // Check ref
      if (studyBrowserData.length > 0 && isMountedRef.current) {
        setStudyBrowserData([]);
      }
      // Check ref
      if (isMountedRef.current) setIsLoading(true);
      return;
    }

    // Check ref
    if (isMountedRef.current) setIsLoading(true);

    try {
      const studyDisplaySetsMap: Record<string, StudyData> = {};
       const dicomStudies = currentStudyInstanceUIDs.map(uid => {
              const study = DicomMetadataStore.getStudy(uid);
              // Ensure wadoRoot is included if available in the stored study metadata
              return study ? { ...study, StudyInstanceUID: uid, wadoRoot: study.wadoRoot } : null;
            }).filter(Boolean);

          
          currentDisplaySets.forEach(displaySet => {
        const {
          StudyInstanceUID,
          displaySetInstanceUID,
          SeriesDescription,
          SeriesNumber,
          Modality,
          numImageFrames, // Added numImageFrames here
        } = displaySet;

        if (!studyDisplaySetsMap[StudyInstanceUID]) {
              const dicomStudy = dicomStudies.find(study => study?.StudyInstanceUID === StudyInstanceUID);
          studyDisplaySetsMap[StudyInstanceUID] = {
                StudyInstanceUID,
            StudyDescription: dicomStudy?.StudyDescription || 'No description',
            // Potentially add wadoRoot here if needed, though usually handled by image loader
            thumbnails: [],
          };
        }

        studyDisplaySetsMap[StudyInstanceUID].thumbnails.push({
          displaySetInstanceUID,
          SeriesDescription: SeriesDescription || 'No description',
          SeriesNumber: SeriesNumber || '',
          modality: Modality || '',
          numImageFrames: numImageFrames || 0, // Use destructured numImageFrames
        });
      });

      const studiesArray = Object.values(studyDisplaySetsMap);
      const getImageSrcFunction = _getImageSrcFromImageId();

      const studiesWithImageSrcPromises = studiesArray.map(async study => {
          const updatedThumbnails = await Promise.all(
             study.thumbnails.map(async (thumb) => {
                  const currentDisplaySet = displaySetService.getDisplaySetByUID(thumb.displaySetInstanceUID);

                 const instances = currentDisplaySet?.instances;
                  // Recalculate middle index based on potentially updated instances
                  const middleIndex = instances && instances.length > 0 ? Math.floor(instances.length / 2) : 0;
                  const representativeImageId = instances && instances.length > 0
                    ? instances[middleIndex]?.imageId // Use optional chaining for safety
                    : undefined;


                if (representativeImageId) {
                  try {
                    const imageSrc = await getImageSrcFunction(representativeImageId);
                    return { ...thumb, imageId: representativeImageId, imageSrc: imageSrc };
                  } catch (error) {
                    console.error(`XNAT: Failed to get thumbnail src for ${representativeImageId}`, error);
                    return { ...thumb, imageId: representativeImageId, imageSrc: null };
                  }
                } else {
                  return { ...thumb, imageId: undefined, imageSrc: null };
                }
             })
          );
          return { ...study, thumbnails: updatedThumbnails };
      });

      const resolvedStudies = await Promise.all(studiesWithImageSrcPromises);

      // Check ref
      if (isMountedRef.current) {
        setStudyBrowserData(resolvedStudies);
                }
              } catch (error) {
      console.error('XNAT: Error processing study data:', error);
      // Check ref
      if (isMountedRef.current) setStudyBrowserData([]);
    } finally {
      // Check ref
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [ // Dependencies for processDataHandler
    displaySetService,
    _getImageSrcFromImageId,
    setStudyBrowserData,
    setIsLoading,
    isMountedRef, // Add ref here
  ]);

  // --- Debounced Handler ---
  const debouncedProcessDataHandler = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    debounceTimeoutRef.current = setTimeout(() => {
      processDataHandler(); // Call the memoized handler
    }, 100);
  }, [processDataHandler]); // Dependency on the memoized handler

  // --- Effect for subscriptions and initial call ---
  useEffect(() => {
    // Set mounted status on mount
    isMountedRef.current = true;

    debouncedProcessDataHandler(); // Use the debounced handler

    let addedSubscription = { unsubscribe: () => {} };
    let updatedSubscription = { unsubscribe: () => {} };


    if (displaySetService?.EVENTS?.DISPLAY_SETS_ADDED && displaySetService?.EVENTS?.DISPLAY_SETS_CHANGED) {
      addedSubscription = displaySetService.subscribe(
        displaySetService.EVENTS.DISPLAY_SETS_ADDED,
        debouncedProcessDataHandler // Use debounced handler
      );
      updatedSubscription = displaySetService.subscribe(
        displaySetService.EVENTS.DISPLAY_SETS_CHANGED,
        debouncedProcessDataHandler // Use debounced handler
      );
        } else {
      console.warn('XNAT: DisplaySetService EVENTS (ADDED/CHANGED) not ready yet, skipping subscription.');
    }

    // Cleanup function
    return () => {
      isMountedRef.current = false; // Set unmounted status
      addedSubscription.unsubscribe();
      updatedSubscription.unsubscribe();
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
     // Dependencies for the effect itself
  }, [displaySetService, _getImageSrcFromImageId, debouncedProcessDataHandler]);
  
  // Handle thumbnail click
  const onThumbnailClick = (displaySetInstanceUID, event) => {
    // No action for single click currently
  };
  
  // Handle double-click (load into viewport)
  const onThumbnailDoubleClick = (displaySetInstanceUID) => {
    
    try {
      const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
        activeViewportId,
        displaySetInstanceUID,
        isHangingProtocolLayout
      );
      viewportGridService.setDisplaySetsForViewports(updatedViewports);
    } catch (error) {
      console.error('XNAT: Error setting viewport display sets:', error);
    }
  };

  if (isLoading) {
     return (
       <div className="h-full overflow-y-auto overflow-x-hidden p-4">
         <div className="text-sm text-muted-foreground">Loading studies...</div>
       </div>
     );
  }

  // Render the XNATStudyBrowser with data containing resolved imageSrc
  return (
    <div className="h-full">
      {/* Render conditionally based on data length AFTER loading is false */}
      {!isLoading && studyBrowserData.length === 0 ? (
         <div className="h-full overflow-y-auto overflow-x-hidden p-4">
            <div className="text-sm text-muted-foreground">No studies available</div>
        </div>
      ) : (
        <XNATStudyBrowser
          studies={studyBrowserData} // Pass data with resolved imageSrc
          onThumbnailClick={onThumbnailClick}
          onThumbnailDoubleClick={onThumbnailDoubleClick}
        />
      )}
    </div>
  );
}

WrappedXNATStudyBrowserPanel.propTypes = {
  extensionManager: PropTypes.object.isRequired,
  servicesManager: PropTypes.object.isRequired,
  commandsManager: PropTypes.object.isRequired,
};

export default WrappedXNATStudyBrowserPanel; 