/*
 * JSONMeasurementImporter - utility to parse a Measurement Collection JSON (as returned by XNAT)
 * and inject its imageMeasurements into OHIF MeasurementService so they appear in the viewer.
 */

import { Enums as CSExtensionEnums } from '@ohif/extension-cornerstone';
import type { Types as CSExtTypes } from '@cornerstonejs/core';
import { DicomMetadataStore } from '@ohif/core';

// Helper to safely get source that has mappings already registered (Cornerstone3DTools).
function _getMeasurementSource(measurementService) {
    const {
        CORNERSTONE_3D_TOOLS_SOURCE_NAME,
        CORNERSTONE_3D_TOOLS_SOURCE_VERSION,
    } = CSExtensionEnums;

    const source = measurementService.getSource(
        CORNERSTONE_3D_TOOLS_SOURCE_NAME,
        CORNERSTONE_3D_TOOLS_SOURCE_VERSION
    );

    if (!source) {
        throw new Error('Measurement source for Cornerstone3DTools not found – import aborted');
    }
    return source;
}

// Helper to find imageId and display set info for a given SOPInstanceUID and frame
function _getImageIdAndDisplaySetInfo(sopInstanceUID, frameNumber, seriesUID, displaySetService, extensionManager) {
    try {
        // First try to find the display set for this series
        const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);
        
        if (!displaySets || displaySets.length === 0) {
            console.warn(`No display sets found for series ${seriesUID}`);
            return { imageId: null, displaySetInstanceUID: null };
        }

        // Find the display set that contains this SOPInstanceUID
        const matchingDisplaySet = displaySets.find(ds => {
            return ds.instances && ds.instances.some(instance => 
                instance.SOPInstanceUID === sopInstanceUID
            );
        });

        if (!matchingDisplaySet) {
            console.warn(`No display set found containing SOPInstanceUID ${sopInstanceUID}`);
            return { imageId: null, displaySetInstanceUID: null };
        }

        // Find the specific instance
        const instance = matchingDisplaySet.instances.find(inst => 
            inst.SOPInstanceUID === sopInstanceUID
        );

        if (!instance) {
            console.warn(`Instance not found for SOPInstanceUID ${sopInstanceUID}`);
            return { imageId: null, displaySetInstanceUID: null };
        }

        let imageId = null;

        // Check if this is a multi-frame instance
        const isMultiFrame = instance.NumberOfFrames && instance.NumberOfFrames > 1;
        
        // Try to get the imageId using the data source
        try {
            const dataSource = extensionManager?.getActiveDataSource?.()?.[0];
            if (dataSource && typeof dataSource.getImageIdsForInstance === 'function') {
                // For multi-frame instances, pass the frame number (convert to 0-based)
                // For single-frame instances, don't pass frame parameter
                const frameParam = isMultiFrame && frameNumber > 1 ? frameNumber - 1 : undefined;
                imageId = dataSource.getImageIdsForInstance({ 
                    instance, 
                    frame: frameParam
                });
            }
        } catch (err) {
            console.warn('Failed to get imageId from dataSource:', err);
        }

        // Fallback: construct imageId from instance properties
        if (!imageId && instance.imageId) {
            imageId = instance.imageId;
            // Only add frame parameter for multi-frame instances
            if (isMultiFrame && frameNumber && frameNumber > 1) {
                const frameParam = imageId.includes('?') ? `&frame=${frameNumber - 1}` : `?frame=${frameNumber - 1}`;
                imageId += frameParam;
            }
        }

        // Last resort: construct a basic imageId
        if (!imageId) {
            // For single-frame instances, don't include frame number in fallback
            if (isMultiFrame) {
                imageId = `wadors:${sopInstanceUID}:${frameNumber || 1}`;
            } else {
                imageId = `wadors:${sopInstanceUID}`;
            }
            console.warn(`Using fallback imageId: ${imageId}`);
        }

        return {
            imageId,
            displaySetInstanceUID: matchingDisplaySet.displaySetInstanceUID
        };

    } catch (error) {
        console.error('Error getting imageId for SOPInstanceUID:', sopInstanceUID, error);
        return { imageId: null, displaySetInstanceUID: null };
    }
}

// Simple identity mapping – data we feed to addRawMeasurement is already in measurement schema.
const identityMapping = data => data;

export async function importMeasurementCollection({
    collectionJSON,
    servicesManager,
}) {
    if (!collectionJSON || !servicesManager) {
        throw new Error('importMeasurementCollection: missing parameters');
    }

    const { measurementService, displaySetService } = servicesManager.services;
    const source = _getMeasurementSource(measurementService);

    // Try to get extensionManager for data source access
    let extensionManager;
    try {
        extensionManager = (servicesManager as any)._extensionManager;
    } catch (e) {
        console.warn('Could not access extensionManager:', e);
    }

    const imageRef = collectionJSON.imageReference || {};
    const studyUID = imageRef.StudyInstanceUID || imageRef.studyInstanceUID;
    const seriesUID = imageRef.SeriesInstanceUID || imageRef.seriesInstanceUID;

    // Build a lookup for SOP -> frameIndex
    const sopToFrame = {};
    (imageRef.imageCollection || []).forEach(img => {
        sopToFrame[img.SOPInstanceUID] = (img.frameIndex ?? img.frameNumber ?? 0);
    });

    const imageMeasurements = collectionJSON.imageMeasurements || [];

    // Try to obtain an active dataSource (needed for downstream callbacks)
    let dataSource: any = undefined;
    try {
        // `ServicesManager` keeps a private reference to the ExtensionManager.
        const extMgr = (servicesManager as any)._extensionManager;
        if (extMgr && typeof extMgr.getActiveDataSource === 'function') {
            const activeDS = extMgr.getActiveDataSource();
            if (Array.isArray(activeDS) && activeDS.length) {
                dataSource = activeDS[0];
            }
        }
    } catch (e) {
        // Ignore – we will fall back to undefined which is acceptable for most tools
    }

    imageMeasurements.forEach(im => {
        const sopInstanceUID = im.imageReference?.SOPInstanceUID;
        
        // Get the imageId and display set info for this measurement first
        // We'll determine the correct frame number based on the actual instance
        const initialFrameNumber = (im.imageReference?.frameIndex ?? 0) + 1;
        const { imageId, displaySetInstanceUID } = _getImageIdAndDisplaySetInfo(
            sopInstanceUID, 
            initialFrameNumber, 
            seriesUID, 
            displaySetService, 
            extensionManager
        );

        if (!imageId) {
            console.warn(`Failed to get imageId for measurement ${im.uuid}, skipping`);
            return;
        }

        // Fetch FrameOfReferenceUID from DICOM metadata if possible
        let frameOfReferenceUID = im.frameOfReferenceUID || '';
        try {
          const instanceMetadata = DicomMetadataStore.getInstance(
            studyUID,
            seriesUID,
            sopInstanceUID
          );
          if (instanceMetadata?.FrameOfReferenceUID) {
            frameOfReferenceUID = instanceMetadata.FrameOfReferenceUID;
          }
        } catch (e) {
          // ignore if metadata not found
        }

        // For the measurement object, determine the correct frame number
        // For single-frame instances, frame number should always be 1
        // For multi-frame instances, use the provided frame number
        let frameNumber = 1; // Default for single-frame
        
        // Try to find the instance to check if it's multi-frame
        const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);
        const matchingDisplaySet = displaySets?.find(ds => 
            ds.instances?.some(inst => inst.SOPInstanceUID === sopInstanceUID)
        );
        
        if (matchingDisplaySet) {
            const instance = matchingDisplaySet.instances.find(inst => 
                inst.SOPInstanceUID === sopInstanceUID
            );
            
            if (instance && instance.NumberOfFrames && instance.NumberOfFrames > 1) {
                // This is a multi-frame instance, use the provided frame number
                frameNumber = initialFrameNumber;
            }
            // For single-frame instances, frameNumber stays 1
        }

        const measurement: any = {
            uid: im.uuid,
            SOPInstanceUID: sopInstanceUID,
            FrameOfReferenceUID: frameOfReferenceUID,
            referenceSeriesUID: seriesUID,
            referenceStudyUID: studyUID,
            frameNumber: frameNumber,
            toolName: im.toolType || im.toolName,
            label: im.name,
            description: im.description,
            color: im.color,
            points: [],
            data: im.data || {},
            displayText: { primary: [], secondary: [] },
            referencedImageId: imageId,
            metadata: {
                toolName: im.toolType || im.toolName,
                FrameOfReferenceUID: frameOfReferenceUID,
                StudyInstanceUID: studyUID,
                SeriesInstanceUID: seriesUID,
                SOPInstanceUID: sopInstanceUID,
                referencedImageId: imageId,
            },
        };

        // Extract points from handles
        const handles = im.data?.handles;
        console.log(`DEBUG: Initial handles for ${im.uuid}:`, handles);
        console.log(`DEBUG: Initial im.data for ${im.uuid}:`, im.data);
        
        if (handles) {
            const pointHandles = Object.values(handles).filter(
                (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
            );
            measurement.points = pointHandles.map((p: any) => [p.x, p.y, p.z || 0]);
        }
        
        console.log(`DEBUG: Extracted points for ${im.uuid}:`, measurement.points);
        
        // Extract displayText from the measurements array (skip for Length tools as we'll set it later)
        const stats = im.measurements;
        if (stats && stats.length > 0 && measurement.toolName !== 'Length') {
            const mainStat = stats[0];
            if (typeof mainStat.value === 'number' && isFinite(mainStat.value)) {
                measurement.displayText = {
                  primary: [`${mainStat.value.toFixed(2)} ${mainStat.unit || ''}`.trim()],
                  secondary: [],
                };
            } else if (mainStat.comment) {
                measurement.displayText = {
                  primary: [mainStat.comment],
                  secondary: [],
                };
            } else {
                measurement.displayText = {
                  primary: [],
                  secondary: [],
                };
            }
        } else if (measurement.toolName !== 'Length') {
            // Initialize empty displayText for non-Length tools
            measurement.displayText = {
                primary: [],
                secondary: [],
            };
        }

        // Pass through cachedStats for ROI tools
        if (im.data?.cachedStats) {
            measurement.data = {
                cachedStats: im.data.cachedStats,
            };
        }
        
        if (im.toolType === 'ArrowAnnotate' && im.data?.text) {
          (measurement.data as any).text = im.data.text;
        }

        // Ensure handles are present for supported tools
        if (measurement.toolName === 'Length') {
            if (measurement.points.length >= 2) {
                // Convert from image coordinates to world coordinates using Cornerstone3D utilities
                const { utilities } = window.cornerstone || {};
                let point1World, point2World;
                
                if (utilities && utilities.imageToWorldCoords) {
                    try {
                        // Convert 2D image coordinates to 3D world coordinates
                        point1World = utilities.imageToWorldCoords(measurement.referencedImageId, [
                            measurement.points[0][0], 
                            measurement.points[0][1]
                        ]);
                        point2World = utilities.imageToWorldCoords(measurement.referencedImageId, [
                            measurement.points[1][0], 
                            measurement.points[1][1]
                        ]);
                        
                        console.log(`DEBUG: Converted image coords [${measurement.points[0][0]}, ${measurement.points[0][1]}] to world:`, point1World);
                        console.log(`DEBUG: Converted image coords [${measurement.points[1][0]}, ${measurement.points[1][1]}] to world:`, point2World);
                    } catch (error) {
                        console.warn('Failed to convert image coordinates to world coordinates:', error);
                        // Fallback to using original coordinates as world coordinates
                        point1World = [measurement.points[0][0], measurement.points[0][1], measurement.points[0][2] || 0];
                        point2World = [measurement.points[1][0], measurement.points[1][1], measurement.points[1][2] || 0];
                    }
                } else {
                    console.warn('Cornerstone utilities not available, using original coordinates');
                    // Fallback if utilities are not available
                    point1World = [measurement.points[0][0], measurement.points[0][1], measurement.points[0][2] || 0];
                    point2World = [measurement.points[1][0], measurement.points[1][1], measurement.points[1][2] || 0];
                }
                
                // Cornerstone3D LengthTool expects data.handles.points as array of 3D world coordinates
                measurement.data.handles = {
                    points: [point1World, point2World],
                    textBox: {
                        hasMoved: false,
                        worldPosition: [0, 0, 0],
                        worldBoundingBox: {
                            topLeft: [0, 0, 0],
                            topRight: [0, 0, 0],
                            bottomLeft: [0, 0, 0],
                            bottomRight: [0, 0, 0],
                        },
                    },
                };
            }
            
            console.log(`DEBUG: Length measurement ${measurement.uid} points:`, measurement.points);
            console.log(`DEBUG: Length measurement ${measurement.uid} handles:`, measurement.data.handles);
            
            // Ensure length value is available for measurement panel display
            let lengthValue = null;
            
            // Try to get from im.measurements first
            const stat = Array.isArray(im.measurements) && im.measurements.find((m: any) => m.name === 'length');
            if (stat && typeof stat.value === 'number' && stat.value > 0) {
                lengthValue = stat.value;
                measurement.data.length = stat.value;
            }
            
            // If no length from measurements, calculate from world coordinates
            if (!lengthValue && measurement.data.handles?.points?.length >= 2) {
                const p1 = measurement.data.handles.points[0];
                const p2 = measurement.data.handles.points[1];
                const dx = p2[0] - p1[0];
                const dy = p2[1] - p1[1];
                const dz = p2[2] - p1[2];
                lengthValue = Math.sqrt(dx * dx + dy * dy + dz * dz);
                measurement.data.length = lengthValue;
                console.log(`DEBUG: Calculated length from world coordinates: ${lengthValue} mm`);
            }
            
            console.log(`DEBUG: Final length value for display: ${lengthValue}`);
            
            // Set displayText for the measurement panel - AFTER calculating length
            if (lengthValue && lengthValue > 0) {
                measurement.displayText = {
                    primary: [`${lengthValue.toFixed(2)} mm`],
                    secondary: [],
                };
                console.log(`DEBUG: Set displayText to: ${lengthValue.toFixed(2)} mm`);
            } else {
                measurement.displayText = {
                    primary: [measurement.label || 'Length'],
                    secondary: [],
                };
                console.log(`DEBUG: Set displayText to label: ${measurement.label || 'Length'}`);
            }
            
            console.log(`DEBUG: Final displayText for ${measurement.uid}:`, measurement.displayText);
        } else if (measurement.toolName === 'RectangleROI') {
            if (measurement.points.length >= 4) {
                // Cornerstone3D RectangleROI expects data.handles.points as array of 4 3D coordinates for rectangle corners
                measurement.data.handles = {
                    points: measurement.points.map(point => [point[0], point[1], point[2] || 0]),
                    textBox: {
                        hasMoved: false,
                        worldPosition: [0, 0, 0],
                        worldBoundingBox: {
                            topLeft: [0, 0, 0],
                            topRight: [0, 0, 0],
                            bottomLeft: [0, 0, 0],
                            bottomRight: [0, 0, 0],
                        },
                    },
                };
            } else if (im.data?.handles) {
                measurement.data.handles = im.data.handles;
                
                // Extract points from handles for RectangleROI
                if (im.data.handles.corner1 && im.data.handles.corner2) {
                    // RectangleROI typically has corner1 and corner2
                    measurement.points = [
                        [im.data.handles.corner1.x, im.data.handles.corner1.y, 0],
                        [im.data.handles.corner2.x, im.data.handles.corner2.y, 0],
                    ];
                } else {
                    // Try to extract from any available handle points
                    const handleValues = Object.values(im.data.handles).filter(
                        (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
                    );
                    measurement.points = handleValues.map((h: any) => [h.x, h.y, h.z || 0]);
                }
            }
            
            console.log(`DEBUG: RectangleROI measurement ${measurement.uid} points:`, measurement.points);
            console.log(`DEBUG: RectangleROI measurement ${measurement.uid} handles:`, measurement.data.handles);
            
            // Ensure displayText for RectangleROI measurement panel display
            if (im.measurements && im.measurements.length > 0) {
                const stats = im.measurements;
                const displayValues = [];
                
                stats.forEach(stat => {
                    if (stat.value !== undefined && stat.value !== null && typeof stat.value === 'number') {
                        displayValues.push(`${stat.name}: ${stat.value.toFixed(2)} ${stat.unit || ''}`);
                    }
                });
                
                measurement.displayText = {
                    primary: displayValues.length > 0 ? displayValues : [measurement.label || 'RectangleROI'],
                    secondary: [],
                };
            } else {
                measurement.displayText = {
                    primary: [measurement.label || 'RectangleROI'],
                    secondary: [],
                };
            }
        } else if (measurement.toolName === 'EllipticalROI' || measurement.toolName === 'CircleROI') {
            // Handle other ROI tools
            if (im.data?.handles) {
                measurement.data.handles = im.data.handles;
                
                // Extract points from handles for other ROI tools
                if (im.data.handles.center && im.data.handles.end) {
                    // CircleROI/EllipticalROI typically have center and end
                    measurement.points = [
                        [im.data.handles.center.x, im.data.handles.center.y, 0],
                        [im.data.handles.end.x, im.data.handles.end.y, 0],
                    ];
                } else {
                    // Try to extract from any available handle points
                    const handleValues = Object.values(im.data.handles).filter(
                        (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
                    );
                    measurement.points = handleValues.map((h: any) => [h.x, h.y, h.z || 0]);
                }
            }
            
            // Set displayText for other ROI tools
            if (im.measurements && im.measurements.length > 0) {
                const stats = im.measurements;
                const displayValues = [];
                
                stats.forEach(stat => {
                    if (stat.value !== undefined && stat.value !== null && typeof stat.value === 'number') {
                        displayValues.push(`${stat.name}: ${stat.value.toFixed(2)} ${stat.unit || ''}`);
                    }
                });
                
                measurement.displayText = {
                    primary: displayValues.length > 0 ? displayValues : [measurement.label || measurement.toolName],
                    secondary: [],
                };
            } else {
                measurement.displayText = {
                    primary: [measurement.label || measurement.toolName],
                    secondary: [],
                };
            }
            
            // Ensure cachedStats for ROI tools
            if (im.data?.cachedStats) {
                measurement.data.cachedStats = im.data.cachedStats;
            }
        } else if (measurement.toolName === 'Bidirectional') {
            if (!measurement.data.handles || !measurement.data.handles.start || !measurement.data.handles.end || !measurement.data.handles.perpendicularStart || !measurement.data.handles.perpendicularEnd) {
                if (measurement.points.length >= 4) {
                    measurement.data.handles = {
                        start: { x: measurement.points[0][0], y: measurement.points[0][1] },
                        end: { x: measurement.points[1][0], y: measurement.points[1][1] },
                        perpendicularStart: { x: measurement.points[2][0], y: measurement.points[2][1] },
                        perpendicularEnd: { x: measurement.points[3][0], y: measurement.points[3][1] },
                    };
                }
            }
        } // Add more tool types as needed

        // Defensive: ensure data and handles always exist
        if (!measurement.data) {
          measurement.data = {};
        }
        if (!measurement.data.handles) {
          measurement.data.handles = {};
        }

        // For ArrowAnnotate, try to reconstruct a start handle if possible
        if (measurement.toolName === 'ArrowAnnotate') {
          if (!measurement.data.handles.start && measurement.points.length > 0) {
            measurement.data.handles.start = { x: measurement.points[0][0], y: measurement.points[0][1] };
          }
          if (!measurement.data.handles.end && measurement.points.length > 1) {
            measurement.data.handles.end = { x: measurement.points[1][0], y: measurement.points[1][1] };
          }
        }

        // Set displaySetInstanceUID if we found it
        if (displaySetInstanceUID) {
            measurement.displaySetInstanceUID = displaySetInstanceUID;
        }

        /*
         * MeasurementService.addRawMeasurement expects the third argument (`data`)
         * to contain an `annotation` object with a `data` field.  If we pass the
         * measurement object directly, it will try to access `data.annotation`
         * and throw.  Therefore we wrap our measurement inside the minimal
         * structure it expects.  We also pass the measurement UID via `id` so it
         * is preserved.
         */
        const rawDataForService = {
          id: measurement.uid,
          annotation: {
            // Only the data field is required for the MeasurementService logic
            data: {
              ...measurement.data,
              // Ensure frameNumber is present for multi-frame instances
              frameNumber: measurement.frameNumber,
              // Add label for annotation display
              label: measurement.label,
            },
            // Some tools (e.g. ArrowAnnotate) take their label/text from here
            // so we include it if available.
            metadata: {
              toolName: measurement.toolName,
              FrameOfReferenceUID: measurement.FrameOfReferenceUID,
              referencedImageId: measurement.metadata.referencedImageId,
            },
          },
        };

        console.log(`DEBUG: Creating annotation for ${measurement.toolName} measurement ${measurement.uid}:`);
        console.log('- handles:', rawDataForService.annotation.data.handles);
        console.log('- referencedImageId:', rawDataForService.annotation.metadata.referencedImageId);
        console.log('- frameNumber:', rawDataForService.annotation.data.frameNumber);
        console.log('- toolName:', measurement.toolName);
        console.log('- annotation data being passed to Cornerstone3D:', rawDataForService.annotation.data);

        try {
          measurementService.addRawMeasurement(
            source,
            measurement.toolName,
            rawDataForService,
            () => measurement,
            dataSource || {}
          );
        } catch (err) {
          console.warn(`Failed to add measurement ${im.uuid}:`, err);
          console.warn('Measurement object:', measurement);
        }
    });

    return imageMeasurements.length;
}

export default importMeasurementCollection;