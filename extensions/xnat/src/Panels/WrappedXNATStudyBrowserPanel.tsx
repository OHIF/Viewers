import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import XNATStudyBrowser from '../xnat-components/XNATStudyBrowser/XNATStudyBrowser';
import { useImageViewer } from '@ohif/ui';
import { useViewportGrid } from '@ohif/ui-next';
import { DicomMetadataStore } from '@ohif/core';
import sessionMap from '../utils/sessionMap';

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
  console.log('XNAT: WrappedXNATStudyBrowserPanel rendering');
  
  // Get the data source
  const [dataSource] = extensionManager.getActiveDataSource();
  
  // Get needed services
  const { displaySetService, hangingProtocolService } = servicesManager.services;
  
  // Get viewport info from OHIF hooks
  const { StudyInstanceUIDs } = useImageViewer();
  const [{ activeViewportId, isHangingProtocolLayout }, viewportGridService] = useViewportGrid();
  
  // State for our study data
  const [studies, setStudies] = useState<StudyData[]>([]);
  
  // Fetch the study data on mount or when display sets change
  useEffect(() => {
    console.log('XNAT: Fetching study data for study browser');
    
    // Check if we have direct access to XNAT metadata (through AppContext)
    const hasXnatAppContext = typeof window !== 'undefined' && 
                             window.AppContext && 
                             window.AppContext.xnatSeriesMetadata;
    
    if (hasXnatAppContext) {
      console.log('XNAT: Found AppContext with XNAT series metadata');
      // This might contain the original JSON metadata with the descriptions
    }
    
    // Map the display sets to our study browser format
    const currentDisplaySets = displaySetService.activeDisplaySets;
    console.log('XNAT: Current display sets:', currentDisplaySets);
    
    // Group display sets by StudyInstanceUID
    const studyDisplaySets: Record<string, StudyData> = {};
    
    // Try to get study details from DicomMetadataStore using the StudyInstanceUIDs
    let dicomStudies: Array<any> = [];
    try {
      dicomStudies = StudyInstanceUIDs.map(uid => {
        const study = DicomMetadataStore.getStudy(uid);
        return study ? { ...study, StudyInstanceUID: uid } : null;
      }).filter(Boolean);
      console.log('XNAT: Found DICOM studies in store:', dicomStudies);
    } catch (error) {
      console.warn('XNAT: Error accessing DicomMetadataStore:', error);
    }
    
    // Helper function to get metadata from XNAT context if available
    const getMetadataFromXnatContext = (studyUid: string, seriesUid?: string) => {
      if (!hasXnatAppContext) return null;
      
      try {
        const xnatStudyMetadata = window.AppContext.xnatSeriesMetadata[studyUid];
        if (!xnatStudyMetadata) return null;
        
        // If we just want study metadata
        if (!seriesUid) {
          return xnatStudyMetadata;
        }
        
        // If we want specific series metadata
        if (xnatStudyMetadata.series && Array.isArray(xnatStudyMetadata.series)) {
          return xnatStudyMetadata.series.find(
            s => s.SeriesInstanceUID === seriesUid
          );
        }
        
        return null;
      } catch (error) {
        console.warn('XNAT: Error getting metadata from XNAT context:', error);
        return null;
      }
    };
    
    currentDisplaySets.forEach(displaySet => {
      const { StudyInstanceUID, displaySetInstanceUID } = displaySet;
      
      if (!studyDisplaySets[StudyInstanceUID]) {
        // Get study info from DicomMetadataStore first, if available
        const dicomStudy = dicomStudies.find(study => study?.StudyInstanceUID === StudyInstanceUID);
        
        // Also try to get from XNAT metadata context
        const xnatStudyMetadata = getMetadataFromXnatContext(StudyInstanceUID);
        if (xnatStudyMetadata) {
          console.log('XNAT: Found study metadata in XNAT context:', xnatStudyMetadata);
        }
        
        // Default values
        let StudyDescription = 'No description';
        let studySession = null;
        
        // Extract study info from DICOM study if available
        if (dicomStudy) {
          console.log('XNAT: Found DICOM study metadata:', dicomStudy);
          StudyDescription = dicomStudy.StudyDescription || 'No description';
          
          // Try to get the session info
          if (dicomStudy.wadoRoot && dicomStudy.wadoRoot.includes('/XNAT_')) {
            // Extract XNAT session ID from wado URL
            const regex = /\/XNAT_([^/]+)/;
            const match = dicomStudy.wadoRoot.match(regex);
            if (match && match[1]) {
              const sessionId = match[1];
              console.log('XNAT: Extracted session ID from WADO URL:', sessionId);
              
              // Create session info
              studySession = {
                experimentId: sessionId,
                projectId: dicomStudy.projectId || 'unknown',
                subjectId: dicomStudy.patientName || dicomStudy.PatientID || 'unknown'
              };
            }
          }
        } else if (xnatStudyMetadata) {
          // Use XNAT context metadata if available
          StudyDescription = xnatStudyMetadata.StudyDescription || 'No description';
          console.log('XNAT: Using StudyDescription from XNAT metadata:', StudyDescription);
        } else {
          // Fall back to display set metadata - check all available properties
          try {
            // Log the display set to see available properties
            console.log('XNAT: Extracting StudyDescription from display set:', displaySet);
            
            // Try all possible paths where StudyDescription might be
            if (displaySet.StudyDescription) {
              StudyDescription = displaySet.StudyDescription;
              console.log('XNAT: Found StudyDescription directly on display set:', StudyDescription);
            } else if (displaySet.metadata?.StudyDescription) {
              StudyDescription = displaySet.metadata.StudyDescription;
              console.log('XNAT: Found StudyDescription in display set metadata:', StudyDescription);
            } else if (displaySet.metadata?.study?.StudyDescription) {
              StudyDescription = displaySet.metadata.study.StudyDescription;
              console.log('XNAT: Found StudyDescription in study metadata:', StudyDescription);
            } else if (displaySet.instance?.metadata?.StudyDescription) {
              StudyDescription = displaySet.instance.metadata.StudyDescription;
              console.log('XNAT: Found StudyDescription in instance metadata:', StudyDescription);
            } else if (displaySet.instances?.[0]?.metadata?.StudyDescription) {
              StudyDescription = displaySet.instances[0].metadata.StudyDescription;
              console.log('XNAT: Found StudyDescription in first instance metadata:', StudyDescription);
            } else if (displaySet._instance?.StudyDescription) {
              StudyDescription = displaySet._instance.StudyDescription;
              console.log('XNAT: Found StudyDescription in _instance:', StudyDescription);
            } else {
              // Try to pull from display set's first image metadata if available
              if (displaySet.images && displaySet.images.length > 0 && displaySet.images[0].data) {
                const firstImageData = displaySet.images[0].data;
                if (firstImageData.StudyDescription) {
                  StudyDescription = firstImageData.StudyDescription;
                  console.log('XNAT: Found StudyDescription in first image data:', StudyDescription);
                }
              }
            }
          } catch (error) {
            console.warn('XNAT: Error getting study description:', error);
          }
        }
          
        studyDisplaySets[StudyInstanceUID] = {
          StudyInstanceUID,
          StudyDescription,
          session: studySession,
          thumbnails: []
        };
      }
      
      // Get series description and number from DICOM tags if available
      let SeriesDescription = 'No description';
      let SeriesNumber = '';
      let Modality = '';
      
      // Try to get from XNAT metadata context first
      const xnatSeriesMetadata = getMetadataFromXnatContext(StudyInstanceUID, displaySet.SeriesInstanceUID);
      if (xnatSeriesMetadata) {
        console.log('XNAT: Found series metadata in XNAT context:', xnatSeriesMetadata);
        SeriesDescription = xnatSeriesMetadata.SeriesDescription || 'No description';
        SeriesNumber = xnatSeriesMetadata.SeriesNumber || '';
        Modality = xnatSeriesMetadata.Modality || '';
        console.log('XNAT: Using metadata from XNAT context:', {
          SeriesDescription,
          SeriesNumber,
          Modality
        });
      } else {
        try {
          // Log the display set to see available properties for series
          console.log('XNAT: Extracting series metadata from display set:', { 
            displaySetInstanceUID, 
            SeriesInstanceUID: displaySet.SeriesInstanceUID
          });

          // Try to get from DicomMetadataStore first
          const series = DicomMetadataStore.getSeries(StudyInstanceUID, displaySet.SeriesInstanceUID);
          if (series && series.instances && series.instances.length > 0) {
            const instance = series.instances[0];
            SeriesDescription = instance.SeriesDescription || displaySet.SeriesDescription || 'No description';
            SeriesNumber = instance.SeriesNumber || displaySet.SeriesNumber || '';
            Modality = instance.Modality || displaySet.Modality || '';
            console.log('XNAT: Found series metadata from DICOM store:', {
              SeriesDescription,
              SeriesNumber,
              Modality
            });
          } else {
            // Fall back to checking all possible paths for series metadata
            console.log('XNAT: Trying alternative paths for series metadata');
            
            // Series Description
            if (displaySet.SeriesDescription) {
              SeriesDescription = displaySet.SeriesDescription;
              console.log('XNAT: Found SeriesDescription directly on display set:', SeriesDescription);
            } else if (displaySet.metadata?.SeriesDescription) {
              SeriesDescription = displaySet.metadata.SeriesDescription;
              console.log('XNAT: Found SeriesDescription in metadata:', SeriesDescription);
            } else if (displaySet.instance?.metadata?.SeriesDescription) {
              SeriesDescription = displaySet.instance.metadata.SeriesDescription;
              console.log('XNAT: Found SeriesDescription in instance metadata:', SeriesDescription);
            } else if (displaySet.instances?.[0]?.metadata?.SeriesDescription) {
              SeriesDescription = displaySet.instances[0].metadata.SeriesDescription;
              console.log('XNAT: Found SeriesDescription in first instance metadata:', SeriesDescription);
            } else if (displaySet._instance?.SeriesDescription) {
              SeriesDescription = displaySet._instance.SeriesDescription;
              console.log('XNAT: Found SeriesDescription in _instance:', SeriesDescription);
            } else if (displaySet.images && displaySet.images.length > 0 && displaySet.images[0].data) {
              const firstImageData = displaySet.images[0].data;
              if (firstImageData.SeriesDescription) {
                SeriesDescription = firstImageData.SeriesDescription;
                console.log('XNAT: Found SeriesDescription in first image data:', SeriesDescription);
              }
            }
            
            // Series Number
            if (displaySet.SeriesNumber) {
              SeriesNumber = displaySet.SeriesNumber;
              console.log('XNAT: Found SeriesNumber directly on display set:', SeriesNumber);
            } else if (displaySet.metadata?.SeriesNumber) {
              SeriesNumber = displaySet.metadata.SeriesNumber;
              console.log('XNAT: Found SeriesNumber in metadata:', SeriesNumber);
            } else if (displaySet.instance?.metadata?.SeriesNumber) {
              SeriesNumber = displaySet.instance.metadata.SeriesNumber;
              console.log('XNAT: Found SeriesNumber in instance metadata:', SeriesNumber);
            } else if (displaySet.instances?.[0]?.metadata?.SeriesNumber) {
              SeriesNumber = displaySet.instances[0].metadata.SeriesNumber;
              console.log('XNAT: Found SeriesNumber in first instance metadata:', SeriesNumber);
            } else if (displaySet._instance?.SeriesNumber) {
              SeriesNumber = displaySet._instance.SeriesNumber;
              console.log('XNAT: Found SeriesNumber in _instance:', SeriesNumber);
            } else if (displaySet.images && displaySet.images.length > 0 && displaySet.images[0].data) {
              const firstImageData = displaySet.images[0].data;
              if (firstImageData.SeriesNumber) {
                SeriesNumber = firstImageData.SeriesNumber;
                console.log('XNAT: Found SeriesNumber in first image data:', SeriesNumber);
              }
            }
            
            // Modality
            Modality = displaySet.Modality || displaySet.metadata?.Modality || 
                      displaySet.instance?.metadata?.Modality || 
                      displaySet.instances?.[0]?.metadata?.Modality || 
                      displaySet._instance?.Modality || '';
            if (Modality) {
              console.log('XNAT: Found Modality:', Modality);
            }
          }
        } catch (error) {
          console.warn('XNAT: Error getting series metadata:', error);
        }
      }
      
      // Find the first image ID if available using multiple possible sources
      let imageId;
      try {
        // Try different ways to get the image ID
        if (displaySet.imageIds && displaySet.imageIds.length > 0) {
          // Direct imageIds array on the display set
          imageId = displaySet.imageIds[0];
          console.log('XNAT: Found image ID from displaySet.imageIds:', imageId);
        } else if (displaySet.images && displaySet.images.length > 0) {
          if (typeof displaySet.images[0].getImageId === 'function') {
            // Function to get image ID
            imageId = displaySet.images[0].getImageId();
            console.log('XNAT: Found image ID from getImageId():', imageId);
          } else if (displaySet.images[0].imageId) {
            // Direct imageId property
            imageId = displaySet.images[0].imageId;
            console.log('XNAT: Found image ID from images[0].imageId:', imageId);
          }
        } else if (displaySet.instance && displaySet.instance.imageId) {
          // From instance
          imageId = displaySet.instance.imageId;
          console.log('XNAT: Found image ID from instance.imageId:', imageId);
        } else if (displaySet.instances && displaySet.instances.length > 0 && displaySet.instances[0].imageId) {
          // From instances array
          imageId = displaySet.instances[0].imageId;
          console.log('XNAT: Found image ID from instances[0].imageId:', imageId);
        }
        
        // Extract scan number from image URL for XNAT
        if (imageId && imageId.startsWith('dicomweb:') && imageId.includes('/scans/')) {
          const scanMatch = /\/scans\/([^/]+)\//.exec(imageId);
          if (scanMatch && scanMatch[1]) {
            // Use scan number as series number if we don't have one
            if (!SeriesNumber) {
              SeriesNumber = scanMatch[1];
              console.log('XNAT: Using scan number as series number:', SeriesNumber);
            }
          }
        }
      } catch (error) {
        console.warn('XNAT: Error getting image ID for display set:', error);
      }
      
      // Add this display set as a thumbnail
      studyDisplaySets[StudyInstanceUID].thumbnails.push({
        displaySetInstanceUID,
        SeriesDescription,
        SeriesNumber,
        modality: Modality,
        numImageFrames: displaySet.numImageFrames || 0,
        imageId
      });
    });
    
    // Convert to array and log
    const studiesArray = Object.values(studyDisplaySets);
    console.log('XNAT: Processed studies for XNATStudyBrowser:', studiesArray);
    
    // Update sessionMap with any extracted session info
    studiesArray.forEach(study => {
      if (study.session) {
        console.log('XNAT: Adding session to sessionMap:', {
          StudyInstanceUID: study.StudyInstanceUID,
          session: study.session
        });
        sessionMap.add(study.StudyInstanceUID, study.session);
      }
    });
    
    setStudies(studiesArray);
  }, [displaySetService.activeDisplaySets, StudyInstanceUIDs]);
  
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

  return (
    <div style={panelStyles.container}>
      <XNATStudyBrowser
        studies={studies}
        onThumbnailClick={onThumbnailClick}
        onThumbnailDoubleClick={onThumbnailDoubleClick}
        supportsDrag={false}
      />
    </div>
  );
}

WrappedXNATStudyBrowserPanel.propTypes = {
  extensionManager: PropTypes.object.isRequired,
  servicesManager: PropTypes.object.isRequired,
  commandsManager: PropTypes.object.isRequired,
};

export default WrappedXNATStudyBrowserPanel; 