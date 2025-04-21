import React, { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import PropTypes from 'prop-types';
import XNATStudyBrowser from '../xnat-components/XNATStudyBrowser/XNATStudyBrowser';
import { useImageViewer } from '@ohif/ui';
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

// Add styles for the panel
const panelStyles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    height: '100%',
    width: '100%',
    overflow: 'auto',  // Allow scrolling
    padding: '0',
    margin: '0',
  }
};
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
    console.log('XNAT: processDataHandler CALLED.');
    // Check ref instead of variable
    if (!isMountedRef.current) {
      console.log('XNAT: processDataHandler skipped (unmounted).');
      return;
    }

    const currentDisplaySets = displaySetService.activeDisplaySets;
    console.log(
      `XNAT: processDataHandler - Found ${currentDisplaySets.length} activeDisplaySets:`,
      currentDisplaySets.map(ds => ds.displaySetInstanceUID)
    );

    const currentStudyInstanceUIDs = Array.from(
      new Set(currentDisplaySets.map(ds => ds.StudyInstanceUID))
    );

    if (!currentDisplaySets || currentDisplaySets.length === 0) {
      console.log('XNAT: No active DisplaySets found in processDataHandler.');
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
    console.log('XNAT: Processing study data for DisplaySets:', currentDisplaySets.length);

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
         console.log(`XNAT: Processing thumbnails for Study ${study.StudyInstanceUID}`);
          const updatedThumbnails = await Promise.all(
             study.thumbnails.map(async (thumb) => {
                console.log(`XNAT: Checking thumbnail for Series ${thumb.SeriesDescription} (DS UID: ${thumb.displaySetInstanceUID})`);
                 console.log('XNAT: Value of thumb:', thumb);
                  const currentDisplaySet = displaySetService.getDisplaySetByUID(thumb.displaySetInstanceUID);
                 console.log(`XNAT: Re-fetched displaySet for ${thumb.displaySetInstanceUID}:`, currentDisplaySet ? 'found' : 'not found');
                 console.log('XNAT: Value of currentDisplaySet:', currentDisplaySet);

                 const instances = currentDisplaySet?.instances;
                 console.log('XNAT: Value of instances:', instances);
                  // Recalculate middle index based on potentially updated instances
                  const middleIndex = instances && instances.length > 0 ? Math.floor(instances.length / 2) : 0;
                  const representativeImageId = instances && instances.length > 0
                    ? instances[middleIndex]?.imageId // Use optional chaining for safety
                    : undefined;

                 console.log(`XNAT: Representative imageId for ${thumb.displaySetInstanceUID} in second loop:`, representativeImageId);

                if (representativeImageId) {
                  console.log(`XNAT: Attempting to get imageSrc for imageId: ${representativeImageId}`);
                  try {
                    const imageSrc = await getImageSrcFunction(representativeImageId);
                     console.log(`XNAT: Successfully got imageSrc for ${representativeImageId}:`, imageSrc ? 'obtained' : 'null/undefined');
                    return { ...thumb, imageId: representativeImageId, imageSrc: imageSrc };
                  } catch (error) {
                    console.error(`XNAT: Failed to get thumbnail src for ${representativeImageId}`, error);
                    return { ...thumb, imageId: representativeImageId, imageSrc: null };
                  }
                } else {
                   console.log(`XNAT: No representative imageId found for thumbnail Series ${thumb.SeriesDescription} in second loop.`);
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
        console.log('XNAT: Setting loading state to false after processing.');
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
      console.log('XNAT: Subscriptions potentially successful.');
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
    console.log('XNAT: Thumbnail clicked:', displaySetInstanceUID);
    // No action for single click currently
  };
  
  // Handle double-click (load into viewport)
  const onThumbnailDoubleClick = (displaySetInstanceUID) => {
    console.log('XNAT: Thumbnail double-clicked:', displaySetInstanceUID);
    
    try {
      const updatedViewports = hangingProtocolService.getViewportsRequireUpdate(
        activeViewportId,
        displaySetInstanceUID,
        isHangingProtocolLayout
      );
      
      console.log('XNAT: Updating viewports with:', updatedViewports);
      viewportGridService.setDisplaySetsForViewports(updatedViewports);
    } catch (error) {
      console.error('XNAT: Error setting viewport display sets:', error);
    }
  };

  if (isLoading) {
     return <div>Loading...</div>;
  }

  // Render the XNATStudyBrowser with data containing resolved imageSrc
  return (
    <div style={panelStyles.container}>
      {/* Render conditionally based on data length AFTER loading is false */}
      {!isLoading && studyBrowserData.length === 0 ? (
         <div className="xnat-study-browser empty-studies">
            <div className="no-studies-message">No studies available</div>
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