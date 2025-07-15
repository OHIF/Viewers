import fetchJSON from './fetchJSON';
import { importMeasurementCollection } from './classes/JSONMeasurementImporter';

interface CollectionInfo {
  name: string;
  collectionType: string;
  referencedSeriesInstanceUid: string;
  label: string;
  getFilesUri: string;
}

interface MeasurementCollectionItem {
  id: string;
  label: string;
  name?: string;
  description?: string;
  relativeUri: string;
  seriesInstanceUID: string;
  type: string;
  date?: string;
  time?: string;
  isForCurrentSeries?: boolean;
}

interface Callbacks {
  updateImportingText?: (text: string[]) => void;
  updateProgress?: (progress: string) => void;
  onImportComplete?: () => void;
}

/**
 * Retrieves the list of available measurement collections from XNAT
 * This replaces the old XnatSessionRoiCollections function with modern OHIF v3 patterns
 */
export const retrieveMeasurementCollections = async (
  servicesManager: any
): Promise<MeasurementCollectionItem[]> => {
  try {
    // Get session information from servicesManager or fallback to sessionMap
    let projectId, subjectId, experimentId;
    
    try {
      // Try to get from servicesManager first (modern approach)
      const { sessionService } = servicesManager.services;
      if (sessionService) {
        const session = sessionService.getSession();
        projectId = session?.projectId;
        subjectId = session?.subjectId;
        experimentId = session?.experimentId;
      }
    } catch (err) {
      console.warn('Could not get session from servicesManager, trying fallback methods');
    }

    // Fallback to sessionStorage if not available from servicesManager
    if (!projectId || !experimentId) {
      if (window.sessionStorage) {
        projectId = projectId || window.sessionStorage.getItem('xnat_projectId');
        subjectId = subjectId || window.sessionStorage.getItem('xnat_subjectId');
        experimentId = experimentId || window.sessionStorage.getItem('xnat_experimentId');
      }
    }

    // Fallback to URL parameters if still not available
    if (!projectId || !experimentId) {
      const urlParams = new URLSearchParams(window.location.search);
      projectId = projectId || urlParams.get('projectId');
      subjectId = subjectId || urlParams.get('subjectId');
      experimentId = experimentId || urlParams.get('experimentId');
    }

    if (!projectId || !experimentId) {
      throw new Error('No XNAT session information available. Please ensure you are viewing data from XNAT and that the session is properly initialized.');
    }

    // Fetch assessors from XNAT
    const assessorsRoute = `data/archive/projects/${projectId}/subjects/${subjectId}/experiments/${experimentId}/assessors?format=json`;
    const assessorsPromise = fetchJSON(assessorsRoute);
    const assessorsData = await assessorsPromise.promise;
    const collections: MeasurementCollectionItem[] = [];

    // Check if assessorsData is null or has no results
    if (!assessorsData) {
      console.warn('No assessors data returned from XNAT. This could be due to:');
      console.warn('- Server error (500)');
      console.warn('- No ROI collections exist for this experiment');
      console.warn('- Insufficient permissions to access ROI collections');
      console.warn('- XNAT ROI plugin not installed or configured');
      return collections;
    }

    if (assessorsData.ResultSet && assessorsData.ResultSet.Result) {
      // Filter for ROI collection assessors
      const roiCollectionAssessors = assessorsData.ResultSet.Result.filter(
        assessor => assessor.xsiType === 'icr:roiCollectionData'
      );

      // Process each ROI collection assessor
      for (const assessor of roiCollectionAssessors) {
        try {
          const assessorRoute = `data/archive/projects/${projectId}/subjects/${subjectId}/experiments/${experimentId}/assessors/${assessor.ID}?format=json`;
          const assessorPromise = fetchJSON(assessorRoute);
          const assessorData = await assessorPromise.promise;

          if (!assessorData) {
            console.warn(`Failed to fetch assessor ${assessor.ID}`);
            continue;
          }

          const item = assessorData.items[0];
          const dataFields = item.data_fields;

          // Extract the referenced series UID
          let seriesInstanceUID;
          if (item.children) {
            const seriesRef = item.children.find(c => c.field === 'references/seriesUID');
            if (seriesRef && seriesRef.items && seriesRef.items.length > 0 && seriesRef.items[0].data_fields) {
              seriesInstanceUID = seriesRef.items[0].data_fields.seriesUID;
            }
          }

          if (!seriesInstanceUID) {
            console.warn(`Could not find referenced series UID for assessor ${assessor.ID}`);
            continue;
          }

          // Only process SEG or MEAS collections
          if (dataFields.collectionType === 'SEG' || dataFields.collectionType === 'MEAS') {
            // Get files for this collection
            const filesRoute = `data/archive/experiments/${dataFields.imageSession_ID}/assessors/${dataFields.ID}/files?format=json`;
            const filesPromise = fetchJSON(filesRoute);
            const filesData = await filesPromise.promise;

            if (filesData && filesData.ResultSet && filesData.ResultSet.Result) {
              let targetFile = null;

              if (dataFields.collectionType === 'SEG') {
                targetFile = filesData.ResultSet.Result.find(
                  (file) => file.collection === 'SEG' || (file.Name && file.Name.endsWith('.dcm'))
                );
              } else if (dataFields.collectionType === 'MEAS') {
                targetFile = filesData.ResultSet.Result.find(
                  (file) => file.collection === 'MEAS' && file.Name.endsWith('.json')
                );
              }

              if (targetFile) {
                collections.push({
                  id: dataFields.ID,
                  label: dataFields.label || dataFields.name,
                  name: dataFields.name,
                  type: dataFields.collectionType,
                  date: dataFields.date,
                  time: dataFields.time,
                  seriesInstanceUID,
                  relativeUri: targetFile.URI, // URI to the actual file
                  description: `${dataFields.collectionType} collection created on ${dataFields.date}`,
                });
              }
            }
          }
        } catch (err) {
          console.error(`Error processing assessor ${assessor.ID}:`, err);
        }
      }
    }

    return collections;
  } catch (error) {
    console.error('Error querying XNAT ROI collections:', error);
    throw error;
  }
};

const retrieveMeasurementCollection = async (
  collectionInfo: CollectionInfo,
  servicesManager: any,
  callbacks: Callbacks = {}
): Promise<void> => {
  try {
    const collectionList = await fetchJSON(collectionInfo.getFilesUri).promise;
    const result = collectionList.ResultSet.Result;

    // No associated file is found (nothing to import, badly deleted roiCollection).
    if (result.length === 0) {
      throw new Error(
        `No associated files were found for collection ${collectionInfo.name}.`
      );
    }

    const collection = result[0];
    const fileType = collection.collection;
    
    if (fileType === collectionInfo.collectionType) {
      // The URIs fetched have an additional /, so remove it.
      const uri = collection.URI.slice(1);
      const collectionObject = await fetchJSON(uri).promise;
      
      if (!collectionObject) {
        throw new Error('Error importing the measurement file.');
      }

      // Use the modern importMeasurementCollection function
      await importMeasurementCollection({
        collectionJSON: collectionObject,
        servicesManager,
      });

      console.log(`✅ Successfully imported collection: ${collectionInfo.name}`);
    } else {
      throw new Error(
        `Collection ${collectionInfo.name} has unsupported filetype: ${collectionInfo.collectionType}.`
      );
    }
  } catch (error) {
    console.error(`Error importing collection '${collectionInfo.name}':`, error);
    throw error;
  }
};

const importMeasurementCollections = async (
  collectionsToParse: CollectionInfo[],
  servicesManager: any,
  callbacks: Callbacks = {}
): Promise<void> => {
  let numCollectionsParsed = 0;
  const numCollectionsToParse = collectionsToParse.length;

  for (let i = 0; i < numCollectionsToParse; i++) {
    const collectionInfo = collectionsToParse[i];
    
    if (callbacks.updateImportingText) {
      const importingText = [
        `Collection: ${numCollectionsParsed + 1}/${numCollectionsToParse}`,
        `${collectionInfo.name}`,
      ];
      callbacks.updateImportingText(importingText);
    }
    
    if (callbacks.updateProgress) {
      callbacks.updateProgress('');
    }
    
    try {
      await retrieveMeasurementCollection(collectionInfo, servicesManager, callbacks);
      numCollectionsParsed++;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Use servicesManager for notifications if available
      if (servicesManager?.services?.uiNotificationService) {
        servicesManager.services.uiNotificationService.show({
          title: `Importing Collection '${collectionInfo.name}'`,
          message: errorMessage,
          type: 'error',
        });
      }
      
      console.error(
        `Error importing collection '${collectionInfo.name}': ${errorMessage}`
      );
      
      // Continue with next collection instead of stopping
      numCollectionsParsed++;
    }
  }

  if (callbacks.onImportComplete) {
    callbacks.onImportComplete();
  }
};

export default importMeasurementCollections; 