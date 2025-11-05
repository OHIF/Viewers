/**
 * Data mapping functions for converting data source formats
 * Extracted from PanelStudyBrowser.tsx
 */

import { utils } from '@ohif/core';
const { sortStudyInstances } = utils;

/**
 * Maps from the DataSource's format to a naturalized object
 *
 * @param {*} studies
 */
export async function _mapDataSourceStudies(studies) {
    const mappedStudies = await Promise.all(studies.map(async study => {
        // Get current date/time as fallback
        const now = new Date();
        const defaultDate = now.toISOString().slice(0, 10).replace(/-/g, '');
        const defaultTime = now.toTimeString().slice(0, 8).replace(/:/g, '');

        // Try to get study date from sessionStorage if not in study object
        const storedDate = sessionStorage.getItem('xnat_studyDate');
        const storedTime = sessionStorage.getItem('xnat_studyTime');

        const studyDate = study.date || study.StudyDate || storedDate || defaultDate;
        const studyTime = study.time || study.StudyTime || storedTime || defaultTime;

        // Ensure we have a valid StudyInstanceUID and store it for future use
        const studyInstanceUID = study.studyInstanceUid || study.StudyInstanceUID;
        if (studyInstanceUID) {
            try {
                sessionStorage.setItem('xnat_studyInstanceUID', studyInstanceUID);
            } catch (e) {
                console.warn('XNAT: Failed to store StudyInstanceUID in sessionStorage:', e);
            }
        }

        // If we have a study date, store it for future reference
        if (studyDate) {
            try {
                sessionStorage.setItem('xnat_studyDate', studyDate);
            } catch (e) {
                console.warn('XNAT: Failed to store study date in sessionStorage:', e);
            }
        }

        // Format the date for display
        let displayStudyDate;
        try {
            displayStudyDate = formatDate(studyDate);
        } catch (error) {
            console.error('XNAT: Error formatting study date:', error);
            displayStudyDate = 'Invalid Date';
        }

        return {
            AccessionNumber: study.accession || study.AccessionNumber || '',
            StudyDate: studyDate,
            StudyDescription: study.description || study.StudyDescription || '',
            NumInstances: study.instances || study.NumInstances || 0,
            ModalitiesInStudy: study.modalities || study.ModalitiesInStudy || [],
            PatientID: study.mrn || study.PatientID || '',
            PatientName: study.patientName || study.PatientName || '',
            StudyInstanceUID: studyInstanceUID,
            StudyTime: studyTime,
            // Add display fields for the UI
            displayStudyDate: displayStudyDate,
            displayPatientName: study.patientName || study.PatientName || '',
            displayStudyDescription: study.description || study.StudyDescription || '',
        };
    }));

    return mappedStudies;
}

/**
 * Maps display sets with metadata and thumbnail information
 * @param {Array} displaySets - Array of display sets from the service
 * @param {Object} thumbnailImageSrcMap - Map of thumbnail image sources
 * @param {Object} xnatSeriesMetadataMap - XNAT series metadata map
 * @returns {Array} - Mapped display sets for the UI
 */
export function _mapDisplaySets(displaySets, thumbnailImageSrcMap, xnatSeriesMetadataMap = {}) {
    const thumbnailDisplaySets = [];
    const thumbnailNoImageDisplaySets = [];

    displaySets
        .filter(ds => !ds.excludeFromThumbnailBrowser)
        .forEach(ds => {
            const imageSrc = thumbnailImageSrcMap[ds.displaySetInstanceUID];
            const componentType = _getComponentType(ds);

            // Debug any missing fields
            if (!ds.StudyInstanceUID) {
                console.warn('XNAT: Display set missing StudyInstanceUID', ds);
            }

            // Try to extract SeriesDescription from multiple possible locations
            let seriesDescription = ds.SeriesDescription;
            let seriesNumber = ds.SeriesNumber || '';
            let modality = ds.Modality || '';
            const displaySetUID = ds.displaySetInstanceUID || 'unknown';
            const seriesInstanceUID = ds.SeriesInstanceUID;

            // Debug output full display set for first one to see structure
            if (displaySets.indexOf(ds) === 0) {
                safeLog(`XNAT: Example display set structure for ${displaySetUID}`, ds);
            }

            // Check if we have metadata from XNAT API
            if (!seriesDescription && seriesInstanceUID && xnatSeriesMetadataMap[seriesInstanceUID]) {
                const xnatMetadata = xnatSeriesMetadataMap[seriesInstanceUID];
                if (typeof xnatMetadata === 'object') {
                    seriesDescription = xnatMetadata.SeriesDescription;
                    if (!seriesNumber) seriesNumber = xnatMetadata.SeriesNumber;
                    if (!modality) modality = xnatMetadata.Modality;
                }
            }

            // Try the direct cornerstone metadata format if available
            if (!seriesDescription) {
                // For SeriesDescription - tag is 0008103E
                seriesDescription = getCornerstoneMetadata(ds, '0008103E');

                // Also get series number and modality if available
                if (!seriesNumber) {
                    seriesNumber = getCornerstoneMetadata(ds, '00200011') || '';
                }

                if (!modality) {
                    modality = getCornerstoneMetadata(ds, '00080060') || '';
                }
            }

            // If not in the main object, try to extract from instances
            if ((!seriesDescription || !seriesNumber || !modality) && ds.instances && ds.instances.length > 0) {
                const firstInstance = ds.instances[0];

                // Log key properties of the first instance in a structured way
                const instanceMetadata = extractDebugMetadata(firstInstance);
                safeLog(`XNAT: First instance metadata for ${displaySetUID}`, instanceMetadata);

                // Use our deep inspection function
                const deepMetadata = inspectMetadataDeep(firstInstance);
                if (deepMetadata.found && deepMetadata.SeriesDescription) {
                    seriesDescription = deepMetadata.SeriesDescription;

                    // Also use the other metadata if available
                    if (!seriesNumber && deepMetadata.SeriesNumber) {
                        seriesNumber = deepMetadata.SeriesNumber;
                    }

                    if (!modality && deepMetadata.Modality) {
                        modality = deepMetadata.Modality;
                    }
                } else {
                    // Try a more aggressive approach - look at all properties recursively
                    if (firstInstance.metadata) {
                        // Stringify and then parse to deal with potential circular references
                        try {
                            const metadataStr = JSON.stringify(firstInstance.metadata);
                            if (metadataStr.includes('SeriesDescription')) {

                                // Try to find it with a regex
                                const match = metadataStr.match(/"SeriesDescription":"([^"]+)"/);
                                if (match && match[1]) {
                                    seriesDescription = match[1];
                                }
                            }
                        } catch (e) {
                            console.warn('XNAT: Error stringifying metadata:', e);
                        }
                    }

                    // If we still don't have it, continue with previous methods
                    if (!seriesDescription) {
                        // First try our cornerstone extractor
                        seriesDescription = extractTagFromCornerstone(firstInstance, 'SeriesDescription');
                    }

                    // If that failed, use our generic helper
                    if (!seriesDescription) {
                        seriesDescription = findDicomTag(firstInstance, 'SeriesDescription', '0008103E');
                    }

                    // Also get SeriesNumber and Modality if missing
                    if (!seriesNumber) {
                        seriesNumber = extractTagFromCornerstone(firstInstance, 'SeriesNumber') ||
                            findDicomTag(firstInstance, 'SeriesNumber', '00200011') || '';
                    }

                    if (!modality) {
                        modality = extractTagFromCornerstone(firstInstance, 'Modality') ||
                            findDicomTag(firstInstance, 'Modality', '00080060') || '';
                    }
                }
            }

            // If still no SeriesDescription, try to look up directly from the DicomMetadataStore
            if (!seriesDescription && seriesInstanceUID) {
                try {
                    const seriesMetadata = DicomMetadataStore.getSeries(ds.StudyInstanceUID, seriesInstanceUID);
                    if (seriesMetadata) {
                        seriesDescription = seriesMetadata.SeriesDescription;
                        if (!seriesNumber) seriesNumber = seriesMetadata.SeriesNumber || '';
                        if (!modality) modality = seriesMetadata.Modality || '';
                    }
                } catch (error) {
                    console.warn('XNAT: Error getting series metadata from DicomMetadataStore:', error);
                }
            }

            // Try to look up directly from the DicomMetadataStore at the instance level
            if (!seriesDescription && seriesInstanceUID && ds.StudyInstanceUID) {
                try {
                    // Get all instances for this series
                    // DicomMetadataStore.getInstances doesn't exist, trying alternative methods
                    const series = DicomMetadataStore.getSeries(ds.StudyInstanceUID, seriesInstanceUID);
                    if (series && series.instances && series.instances.length > 0) {
                        // Check if we have SeriesDescription directly in the series
                        if (series.SeriesDescription) {
                            seriesDescription = series.SeriesDescription;
                        }

                        // Check the first instance
                        const firstInst = series.instances[0];
                        if (firstInst && firstInst.SeriesDescription) {
                            seriesDescription = firstInst.SeriesDescription;
                        }

                        // Also get SeriesNumber and Modality if missing
                        if (!seriesNumber) {
                            seriesNumber = series.SeriesNumber || (firstInst && firstInst.SeriesNumber) || '';
                        }

                        if (!modality) {
                            modality = series.Modality || (firstInst && firstInst.Modality) || '';
                        }
                    }
                } catch (error) {
                    console.warn('XNAT: Error accessing DicomMetadataStore series:', error);
                }
            }

            // If still no SeriesDescription, try to build one from SeriesNumber and Modality
            if (!seriesDescription) {
                if (seriesNumber && modality) {
                    seriesDescription = `${modality} - Series ${seriesNumber}`;
                } else {
                    // Last resort - try to get protocol name or any identifying information
                    if (ds.instances && ds.instances.length > 0) {
                        const instance = ds.instances[0];
                        const protocolName = extractTagFromCornerstone(instance, 'ProtocolName') ||
                            findDicomTag(instance, 'ProtocolName', '00181030');
                        const sequenceName = findDicomTag(instance, 'SequenceName', '00180024');
                        const seriesType = findDicomTag(instance, 'SeriesType', '00400011');

                        if (protocolName) {
                            seriesDescription = protocolName;
                        } else if (sequenceName) {
                            seriesDescription = sequenceName;
                        } else if (seriesType) {
                            seriesDescription = seriesType;
                        } else {
                            // Use the last part of the SeriesInstanceUID as an identifier
                            if (seriesInstanceUID) {
                                const lastSection = seriesInstanceUID.split('.').pop();
                                seriesDescription = `Series ${lastSection}`;
                            } else {
                                seriesDescription = 'Unknown Series';
                            }
                        }
                    } else {
                        seriesDescription = 'Unknown Series';
                    }
                }
            }

            const array =
                componentType === 'thumbnail' ? thumbnailDisplaySets : thumbnailNoImageDisplaySets;

            array.push({
                displaySetInstanceUID: ds.displaySetInstanceUID,
                description: seriesDescription,
                seriesNumber: seriesNumber || '',
                modality: modality || '',
                seriesDate: ds.SeriesDate || '',
                seriesTime: ds.SeriesTime || '',
                numInstances: ds.numImageFrames || 0,
                countIcon: ds.countIcon,
                StudyInstanceUID: ds.StudyInstanceUID,
                messages: ds.messages,
                componentType,
                imageSrc,
                dragData: {
                    type: 'displayset',
                    displaySetInstanceUID: ds.displaySetInstanceUID,
                    // .. Any other data to pass
                },
                isHydratedForDerivedDisplaySet: ds.isHydrated,
            });
        });

    return [...thumbnailDisplaySets, ...thumbnailNoImageDisplaySets];
}

// Import the utilities we need from DICOMUtils
import {
    findDicomTag,
    extractTagFromCornerstone,
    extractDebugMetadata,
    inspectMetadataDeep,
    getCornerstoneMetadata,
    safeLog
} from './DICOMUtils';

// Import DicomMetadataStore
import { DicomMetadataStore } from '@ohif/core';

// Import formatDate utility
const { formatDate } = utils;

// Define thumbnailNoImageModalities as a constant
export const thumbnailNoImageModalities = ['SR', 'SEG', 'SM', 'RTSTRUCT', 'RTPLAN', 'RTDOSE'];

/**
 * Determines the component type for a display set
 * @param {Object} ds - Display set
 * @returns {string} - Component type ('thumbnail' or 'thumbnailNoImage')
 */
function _getComponentType(ds) {
    if (thumbnailNoImageModalities.includes(ds.Modality) || ds?.unsupported) {
        // TODO probably others.
        return 'thumbnailNoImage';
    }

    return 'thumbnail';
}
