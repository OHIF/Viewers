import sessionMap from '../../sessionMap';
import fetchJSON from '../fetchJSON';

/**
 * Queries XNAT for available ROI collections (segmentations)
 * @returns {Promise<Array>} Array of ROI collection objects
 */
export const XnatSessionRoiCollections = async() => {
    try {
        // Try multiple approaches to get session information
        let projectId = sessionMap.getProject();
        let subjectId = sessionMap.getSubject();
        let experimentId = sessionMap.getExperimentID();

        // If we don't have the basic session info, try alternative approaches
        if (!projectId || !experimentId) {
            console.log('Primary session info not available, trying alternative approaches...');

            // Try to get from sessionStorage
            if (window.sessionStorage) {
                projectId = projectId || window.sessionStorage.getItem('xnat_projectId');
                subjectId = subjectId || window.sessionStorage.getItem('xnat_subjectId');
                experimentId = experimentId || window.sessionStorage.getItem('xnat_experimentId');
            }

            // Try to get from URL parameters if available
            if (!projectId || !experimentId) {
                const urlParams = new URLSearchParams(window.location.search);
                projectId = projectId || urlParams.get('projectId');
                subjectId = subjectId || urlParams.get('subjectId');
                experimentId = experimentId || urlParams.get('experimentId');
            }
        }

        console.log('Session info for ROI query:', { projectId, subjectId, experimentId });

        if (!projectId || !experimentId) {
            throw new Error('No XNAT session information available. Please ensure you are viewing data from XNAT and that the session is properly initialized.');
        }

        // Fetch assessors from XNAT using the existing fetchJSON utility
        // Remove leading slash to avoid double slash in URL construction
        const assessorsRoute = `data/archive/projects/${projectId}/subjects/${subjectId}/experiments/${experimentId}/assessors?format=json`;
        console.log('Fetching assessors from route:', assessorsRoute);

        const assessorsPromise = fetchJSON(assessorsRoute);
        const assessorsData = await assessorsPromise.promise;
        const collections = [];

        // Check if assessorsData is null (indicating server error) or has no results
        if (!assessorsData) {
            console.warn('No assessors data returned from XNAT. This could be due to:');
            console.warn('- Server error (500)');
            console.warn('- No ROI collections exist for this experiment');
            console.warn('- Insufficient permissions to access ROI collections');
            console.warn('- XNAT ROI plugin not installed or configured');
            return collections; // Return empty array instead of throwing error
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

export default XnatSessionRoiCollections;