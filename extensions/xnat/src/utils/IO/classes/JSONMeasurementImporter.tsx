/*
 * JSONMeasurementImporter - utility to parse a Measurement Collection JSON (as returned by XNAT)
 * and inject its imageMeasurements into OHIF MeasurementService so they appear in the viewer.
 */

import React from 'react';
import { Enums as CSExtensionEnums } from '@ohif/extension-cornerstone';
import type { Types as CSExtTypes } from '@cornerstonejs/core';
import { DicomMetadataStore } from '@ohif/core';
import { triggerAnnotationRenderForViewportIds } from '@cornerstonejs/tools/utilities';

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

// Helper to find imageId and display set info using the older OHIF-XNAT approach
function _getImageIdAndDisplaySetInfo(sopInstanceUID, frameNumber, seriesUID, displaySetService, extensionManager) {
    try {
        console.log(`🔍 DEBUG: Looking for SOPInstanceUID ${sopInstanceUID} with frameNumber ${frameNumber} in series ${seriesUID}`);

        // Get all display sets for the series
        const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);

        if (!displaySets || displaySets.length === 0) {
            console.warn(`No display sets found for series ${seriesUID}`);
            return { imageId: null, displaySetInstanceUID: null };
        }

        console.log(`🔍 DEBUG: Found ${displaySets.length} display sets for series`);

        // Find the display set that contains this SOPInstanceUID
        let matchingDisplaySet = null;
        let matchingImage = null;

        for (const displaySet of displaySets) {
            console.log(`🔍 DEBUG: Checking display set ${displaySet.displaySetInstanceUID}`);
            console.log(`🔍 DEBUG: Display set has instances:`, !!displaySet.instances, displaySet.instances?.length);
            console.log(`🔍 DEBUG: Display set has images:`, !!displaySet.images, displaySet.images?.length);

            // Try the old approach first: look in displaySet.images
            if (displaySet.images && displaySet.images.length > 0) {
                matchingImage = displaySet.images.find(image =>
                    image.SOPInstanceUID === sopInstanceUID
                );
                if (matchingImage) {
                    matchingDisplaySet = displaySet;
                    console.log(`🔍 DEBUG: Found matching image in displaySet.images`);
                    break;
                }
            }

            // Fallback to new approach: look in displaySet.instances
            if (!matchingImage && displaySet.instances && displaySet.instances.length > 0) {
                const matchingInstance = displaySet.instances.find(instance =>
                    instance.SOPInstanceUID === sopInstanceUID
                );
                if (matchingInstance) {
                    // Convert instance to image-like object for compatibility
                    matchingImage = matchingInstance;
                    matchingDisplaySet = displaySet;
                    console.log(`🔍 DEBUG: Found matching instance in displaySet.instances`);
                    break;
                }
            }
        }

        if (!matchingDisplaySet || !matchingImage) {
            console.warn(`No display set found containing SOPInstanceUID ${sopInstanceUID}`);
            return { imageId: null, displaySetInstanceUID: null };
        }

        console.log(`🔍 DEBUG: Using display set ${matchingDisplaySet.displaySetInstanceUID}`);
        console.log(`🔍 DEBUG: Matching image/instance:`, matchingImage);

        let imageId = null;

        // Check if this is a multi-frame instance
        const numberOfFrames = matchingImage.NumberOfFrames || matchingDisplaySet.numImageFrames || 1;
        const isMultiFrame = numberOfFrames > 1;
        console.log(`🔍 DEBUG: NumberOfFrames: ${numberOfFrames}, isMultiFrame: ${isMultiFrame}`);

        // Use the old approach: try to get imageId from the image object
        if (matchingImage.getImageId && typeof matchingImage.getImageId === 'function') {
            try {
                imageId = matchingImage.getImageId();
                console.log(`🔍 DEBUG: Got imageId from getImageId(): ${imageId}`);

                // Add frame parameter for multi-frame instances (using 0-based frame index)
                if (isMultiFrame && frameNumber > 1) {
                    const frameIndex = frameNumber - 1; // Convert 1-based to 0-based
                    imageId += `?frame=${frameIndex}`;
                    console.log(`🔍 DEBUG: Added frame parameter: ${imageId}`);
                }
            } catch (err) {
                console.warn('Failed to get imageId from getImageId():', err);
                imageId = null;
            }
        }

        // Fallback: use imageId property directly
        if (!imageId && matchingImage.imageId) {
            imageId = matchingImage.imageId;
            console.log(`🔍 DEBUG: Using direct imageId property: ${imageId}`);

            // Add frame parameter for multi-frame instances
            if (isMultiFrame && frameNumber > 1) {
                const frameIndex = frameNumber - 1; // Convert 1-based to 0-based
                const frameParam = imageId.includes('?') ? `&frame=${frameIndex}` : `?frame=${frameIndex}`;
                imageId += frameParam;
                console.log(`🔍 DEBUG: Added frame parameter to direct imageId: ${imageId}`);
            }
        }

        // Last resort: construct imageId using data source (new approach)
        if (!imageId) {
            try {
                const dataSource = extensionManager?.getActiveDataSource?.()?.[0];
                if (dataSource && typeof dataSource.getImageIdsForInstance === 'function') {
                    const frameParam = isMultiFrame && frameNumber > 1 ? frameNumber - 1 : undefined;
                    imageId = dataSource.getImageIdsForInstance({
                        instance: matchingImage,
                        frame: frameParam
                    });
                    console.log(`🔍 DEBUG: Got imageId from dataSource: ${imageId}`);
                }
            } catch (err) {
                console.warn('Failed to get imageId from dataSource:', err);
            }
        }

        // Final fallback: construct a basic imageId
        if (!imageId) {
            if (isMultiFrame) {
                imageId = `wadors:${sopInstanceUID}:${frameNumber || 1}`;
            } else {
                imageId = `wadors:${sopInstanceUID}`;
            }
            console.warn(`🔍 DEBUG: Using fallback imageId: ${imageId}`);
        }

        console.log(`🔍 DEBUG: Final imageId: ${imageId}`);
        return {
            imageId,
            displaySetInstanceUID: matchingDisplaySet.displaySetInstanceUID
        };

    } catch (error) {
        console.error('Error getting imageId for SOPInstanceUID:', sopInstanceUID, error);
        return { imageId: null, displaySetInstanceUID: null };
    }
}

// Identity mapping that extracts the measurement from the annotation wrapper
const identityMapping = data => {
    // The data object contains the annotation wrapper, we need to extract the actual measurement
    if (data.annotation && data.measurement) {
        console.log(`🔍 DEBUG: identityMapping extracting measurement:`, {
            uid: data.measurement.uid,
            displayText: data.measurement.displayText,
            label: data.measurement.label,
            toolName: data.measurement.toolName
        });
        return data.measurement;
    }
    // Fallback - if data structure is different, return as-is
    console.log(`🔍 DEBUG: identityMapping fallback - returning data as-is:`, data);
    return data;
};

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

    const findDisplaySetInstanceUID = (sopInstanceUID) => {
        console.log(`🔍 DEBUG: Fallback search for SOPInstanceUID ${sopInstanceUID} across all display sets`);
        const displaySets = displaySetService.getDisplaySets();
        console.log(`🔍 DEBUG: Total display sets to search: ${displaySets.length}`);

        for (const displaySet of displaySets) {
            console.log(`🔍 DEBUG: Checking display set ${displaySet.displaySetInstanceUID}`);

            // Try old approach first: check displaySet.images
            if (displaySet.images && displaySet.images.length > 0) {
                const found = displaySet.images.some(image => image.SOPInstanceUID === sopInstanceUID);
                if (found) {
                    console.log(`🔍 DEBUG: Found SOPInstanceUID in displaySet.images of ${displaySet.displaySetInstanceUID}`);
                    return displaySet.displaySetInstanceUID;
                }
            }

            // Fallback: check displaySet.instances 
            if (displaySet.instances && displaySet.instances.length > 0) {
                const found = displaySet.instances.some(instance => instance.SOPInstanceUID === sopInstanceUID);
                if (found) {
                    console.log(`🔍 DEBUG: Found SOPInstanceUID in displaySet.instances of ${displaySet.displaySetInstanceUID}`);
                    return displaySet.displaySetInstanceUID;
                }
            }
        }

        console.log(`🔍 DEBUG: SOPInstanceUID ${sopInstanceUID} not found in any display set`);
        return undefined;
    };

    imageMeasurements.forEach(im => {
        console.log(`🔍 DEBUG: Processing raw measurement from XNAT:`, im);
        console.log(`🔍 DEBUG: Measurement properties: uuid=${im.uuid}, type=${im.type}, toolType=${im.toolType}, toolName=${im.toolName}, label=${im.label}, name=${im.name}`);

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

        // Get the z-coordinate from the image plane to ensure annotation is on the correct slice
        let zCoord = 0;
        try {
            const metaData = (window as any).cornerstone?.metaData;
            if (metaData) {
                const imagePlaneModule = metaData.get('imagePlaneModule', imageId);
                if (imagePlaneModule && imagePlaneModule.imagePositionPatient) {
                    zCoord = imagePlaneModule.imagePositionPatient[2];
                    console.log(`🔍 DEBUG: Found z-coordinate from image plane: ${zCoord}`);
                } else {
                    console.warn(`🔍 DEBUG: Could not find imagePlaneModule for imageId: ${imageId}`);
                }
            }
        } catch (e) {
            console.warn('Failed to get z-coordinate from Cornerstone metadata:', e);
        }

        // Fetch FrameOfReferenceUID from DICOM metadata if possible
        let measurementFrameOfReferenceUID = im.frameOfReferenceUID || '';

        // Enhanced FrameOfReferenceUID retrieval from XNAT's metadata format
        if (!measurementFrameOfReferenceUID) {
            try {
                const instanceMetadata = DicomMetadataStore.getInstance(
                    studyUID,
                    seriesUID,
                    sopInstanceUID
                );
                measurementFrameOfReferenceUID = instanceMetadata?.FrameOfReferenceUID ||
                    instanceMetadata?.frameOfReferenceUID || '';
            } catch (e) {
                // ignore if metadata not found
            }
        }

        // If still no FrameOfReferenceUID, try getting it from Cornerstone metadata using the imageId
        if (!measurementFrameOfReferenceUID && imageId) {
            try {
                console.log(`🔍 DEBUG: Trying Cornerstone instance metadata for imageId: ${imageId}`);
                // Method 1: Try instance metadata from Cornerstone 
                const metaData = (window as any).cornerstone?.metaData;
                if (metaData) {
                    const instanceMeta = metaData.get('instance', imageId);
                    console.log(`🔍 DEBUG: Instance metadata:`, instanceMeta);

                    // Try standard property names first
                    measurementFrameOfReferenceUID = instanceMeta?.FrameOfReferenceUID || instanceMeta?.frameOfReferenceUID || '';

                    // If not found, try hex format (XNAT stores tags as hex keys)
                    if (!measurementFrameOfReferenceUID && instanceMeta) {
                        const forUIDHex = instanceMeta['00200052'] || instanceMeta['x00200052'];
                        if (forUIDHex?.Value && Array.isArray(forUIDHex.Value) && forUIDHex.Value.length > 0) {
                            measurementFrameOfReferenceUID = forUIDHex.Value[0];
                            console.log(`Found FrameOfReferenceUID from hex format in instance metadata: ${measurementFrameOfReferenceUID}`);
                        } else if (typeof forUIDHex === 'string') {
                            measurementFrameOfReferenceUID = forUIDHex;
                            console.log(`Found FrameOfReferenceUID as string in instance metadata: ${measurementFrameOfReferenceUID}`);
                        }
                    }

                    if (measurementFrameOfReferenceUID) {
                        console.log(`Found FrameOfReferenceUID from Cornerstone instance metadata: ${measurementFrameOfReferenceUID}`);
                    }
                } else {
                    console.log(`🔍 DEBUG: No cornerstone.metaData available`);
                }
            } catch (e) {
                console.warn('Failed to get FrameOfReferenceUID from Cornerstone instance metadata:', e);
            }
        }

        // Method 2: Try DICOM metadata from Cornerstone (XNAT's format: {vr: 'UI', Value: ['1.2.3.4']})
        if (!measurementFrameOfReferenceUID && imageId) {
            try {
                console.log(`🔍 DEBUG: Trying XNAT DICOM metadata for imageId: ${imageId}`);
                const metaData = (window as any).cornerstone?.metaData;
                if (metaData) {
                    const dicomMeta = metaData.get('dicom', imageId);
                    console.log(`🔍 DEBUG: DICOM metadata:`, dicomMeta);
                    if (dicomMeta) {
                        // Try both hex and x-prefixed formats for the FrameOfReferenceUID tag
                        const forUIDData = dicomMeta['00200052'] || dicomMeta['x00200052'];
                        console.log(`🔍 DEBUG: FrameOfReferenceUID data from DICOM metadata:`, forUIDData);
                        if (forUIDData?.Value && Array.isArray(forUIDData.Value) && forUIDData.Value.length > 0) {
                            measurementFrameOfReferenceUID = forUIDData.Value[0];
                            console.log(`Found FrameOfReferenceUID from XNAT DICOM metadata: ${measurementFrameOfReferenceUID}`);
                        }
                    }
                }
            } catch (e) {
                console.warn('Failed to get FrameOfReferenceUID from XNAT DICOM metadata:', e);
            }
        }

        // Method 3: Try from DisplaySet 
        if (!measurementFrameOfReferenceUID) {
            try {
                const displaySets = displaySetService.getDisplaySetsForSeries(seriesUID);
                if (displaySets && displaySets.length > 0) {
                    const displaySet = displaySets[0];
                    measurementFrameOfReferenceUID = displaySet.frameOfReferenceUID ||
                        displaySet.FrameOfReferenceUID || '';
                    if (measurementFrameOfReferenceUID) {
                        console.log(`Found FrameOfReferenceUID from DisplaySet: ${measurementFrameOfReferenceUID}`);
                    }
                }
            } catch (e) {
                console.warn('Failed to get FrameOfReferenceUID from DisplaySet:', e);
            }
        }

        // Log the result
        if (measurementFrameOfReferenceUID) {
            console.log(`✅ Successfully found FrameOfReferenceUID: ${measurementFrameOfReferenceUID} for SOPInstanceUID: ${sopInstanceUID}`);
        } else {
            console.warn(`❌ Could not find FrameOfReferenceUID for SOPInstanceUID: ${sopInstanceUID} - measurement may not display correctly`);
        }

        // For the measurement object, determine the correct frame number
        // For single-frame instances, frame number should always be 1
        // For multi-frame instances, use the provided frame number
        let frameNumber = 1; // Default for single-frame

        try {
            // Check if this is a multi-frame instance
            const instanceMetadata = DicomMetadataStore.getInstance(
                studyUID,
                seriesUID,
                sopInstanceUID
            );

            const numberOfFrames = instanceMetadata?.NumberOfFrames || 1;
            if (numberOfFrames > 1) {
                // Multi-frame instance - use the provided frame number (ensure it's 1-based)
                frameNumber = Math.max(1, initialFrameNumber);

                // Validate frame number is within bounds
                if (frameNumber > numberOfFrames) {
                    console.warn(`Frame number ${frameNumber} exceeds NumberOfFrames ${numberOfFrames}, using frame 1`);
                    frameNumber = 1;
                }
            }
            // For single-frame instances, frameNumber stays 1
        } catch (e) {
            // If we can't get metadata, use frame 1 as safe default
            frameNumber = 1;
        }

        let measurement;
        try {
            // Ensure we have a valid toolName - try multiple sources
            const toolName = im.type || im.toolType || im.toolName || 'Length';
            console.log(`🔍 DEBUG: Resolved toolName: ${toolName} from im.type=${im.type}, im.toolType=${im.toolType}, im.toolName=${im.toolName}`);

            // Create a clean copy of im without fields that are not in MEASUREMENT_SCHEMA_KEYS to avoid conflicts
            const {
                uuid,
                toolType,
                name,
                codingSequence,
                color,
                lineThickness,
                dashedLine,
                visible,
                imageReference,
                viewport,
                measurements,
                ...cleanIm
            } = im;

            measurement = identityMapping({
                uid: im.uuid,  // Use uid instead of uuid for OHIF
                toolName: toolName,
                SOPInstanceUID: sopInstanceUID,
                referenceStudyUID: studyUID,
                referenceSeriesUID: seriesUID,
                frameNumber: frameNumber,
                FrameOfReferenceUID: measurementFrameOfReferenceUID,  // Use the resolved FrameOfReferenceUID
                label: im.label || im.name || toolName || 'Measurement',
                ...cleanIm,  // Spread the clean object without invalid schema fields
                metadata: {
                    ...im.metadata,
                    referencedImageId: imageId,
                    toolName: toolName,
                    FrameOfReferenceUID: measurementFrameOfReferenceUID,  // Ensure it's in metadata too
                },
            });
        } catch (e) {
            console.error('Failed to create measurement object:', e);
            return;
        }

        // Extract points from handles
        const handles = im.data?.handles;
        console.log(`DEBUG: Initial handles for ${im.uuid}:`, handles);
        console.log(`DEBUG: Initial im.data for ${im.uuid}:`, im.data);

        if (handles) {
            const pointHandles = Object.values(handles).filter(
                (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
            );
            measurement.points = pointHandles.map((p: any) => [p.x, p.y, p.z || zCoord]);
        }

        console.log(`DEBUG: Extracted points for ${im.uuid}:`, measurement.points);

        // Extract displayText from the measurements array (skip for Length tools as we'll set it later)
        const stats = im.measurements;
        if (stats && stats.length > 0 && measurement.toolName !== 'Length') {
            const mainStat = stats[0];
            if (typeof mainStat.value === 'number' && isFinite(mainStat.value)) {
                const displayValue = `${mainStat.value.toFixed(2)} ${mainStat.unit || ''}`.trim();
                measurement.displayText = {
                    primary: [displayValue],
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
                // Use the 3D coordinates directly from the handles (these are already world coordinates)
                // measurement.points now contains [x, y, z] coordinates extracted from handles
                const point1World = [measurement.points[0][0], measurement.points[0][1], measurement.points[0][2]];
                const point2World = [measurement.points[1][0], measurement.points[1][1], measurement.points[1][2]];

                console.log(`DEBUG: Using 3D coordinates from handles - Point 1:`, point1World);
                console.log(`DEBUG: Using 3D coordinates from handles - Point 2:`, point2World);

                // Calculate textBox position as midpoint between the two measurement points
                const textBoxWorldPosition = [
                    (point1World[0] + point2World[0]) / 2,
                    (point1World[1] + point2World[1]) / 2,
                    (point1World[2] + point2World[2]) / 2,
                ];

                // Cornerstone3D LengthTool expects data.handles.points as array of 3D world coordinates
                measurement.data.handles = {
                    points: [point1World, point2World],
                    textBox: {
                        hasMoved: false,
                        worldPosition: textBoxWorldPosition,
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
                // Calculate textBox position as center of the rectangle
                const avgX = measurement.points.reduce((sum, point) => sum + point[0], 0) / measurement.points.length;
                const avgY = measurement.points.reduce((sum, point) => sum + point[1], 0) / measurement.points.length;
                const avgZ = measurement.points.reduce((sum, point) => sum + (point[2] || 0), 0) / measurement.points.length;
                const textBoxWorldPosition = [avgX, avgY, avgZ];

                // Cornerstone3D RectangleROI expects data.handles.points as array of 4 3D coordinates for rectangle corners
                measurement.data.handles = {
                    points: measurement.points.map(point => [point[0], point[1], point[2] || 0]),
                    textBox: {
                        hasMoved: false,
                        worldPosition: textBoxWorldPosition,
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
                        [im.data.handles.corner1.x, im.data.handles.corner1.y, im.data.handles.corner1.z || 0],
                        [im.data.handles.corner2.x, im.data.handles.corner2.y, im.data.handles.corner2.z || 0],
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
                        [im.data.handles.center.x, im.data.handles.center.y, im.data.handles.center.z || 0],
                        [im.data.handles.end.x, im.data.handles.end.y, im.data.handles.end.z || 0],
                    ];

                    // For circle/ellipse, textBox should be at the center point
                    if (measurement.data.handles.textBox) {
                        measurement.data.handles.textBox.worldPosition = [
                            im.data.handles.center.x,
                            im.data.handles.center.y,
                            im.data.handles.center.z || 0
                        ];
                    }
                } else {
                    // Try to extract from any available handle points
                    const handleValues = Object.values(im.data.handles).filter(
                        (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
                    );
                    measurement.points = handleValues.map((h: any) => [h.x, h.y, h.z || 0]);

                    // Calculate average position for textBox if we have multiple points
                    if (measurement.points.length > 0) {
                        const avgX = measurement.points.reduce((sum, point) => sum + point[0], 0) / measurement.points.length;
                        const avgY = measurement.points.reduce((sum, point) => sum + point[1], 0) / measurement.points.length;
                        const avgZ = measurement.points.reduce((sum, point) => sum + (point[2] || 0), 0) / measurement.points.length;

                        if (measurement.data.handles.textBox) {
                            measurement.data.handles.textBox.worldPosition = [avgX, avgY, avgZ];
                        }
                    }
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

        // Set displaySetInstanceUID if we found it, otherwise try the fallback method
        let finalDisplaySetInstanceUID = displaySetInstanceUID;
        if (!finalDisplaySetInstanceUID) {
            finalDisplaySetInstanceUID = findDisplaySetInstanceUID(sopInstanceUID);
        }

        if (finalDisplaySetInstanceUID) {
            measurement.displaySetInstanceUID = finalDisplaySetInstanceUID;
        }

        // The FrameOfReferenceUID was already resolved and set in the measurement object above,
        // so we can skip the redundant resolution here and use the value we already have
        console.log(`DEBUG: Using FrameOfReferenceUID: ${measurement.FrameOfReferenceUID || 'empty'} for measurement ${measurement.uid}`);

        /*
         * MeasurementService.addRawMeasurement expects the third argument (`data`)
         * to contain an `annotation` object with a `data` field, and the fourth argument
         * (`toMeasurementSchema`) should transform the data into a measurement object.
         * We store the pre-built measurement object in the data structure so that
         * identityMapping can extract it.
         */
        const rawDataForService = {
            // Pass the measurement UID at the top level for MeasurementService
            id: measurement.uid,
            // Store the pre-built measurement for identityMapping to extract
            measurement: measurement,
            annotation: {
                // Cornerstone3D requires an annotationUID to track the annotation
                annotationUID: measurement.uid,
                // Only the data field is required for the MeasurementService logic
                data: {
                    ...measurement.data,
                    // Ensure frameNumber is present for multi-frame instances
                    frameNumber: measurement.frameNumber,
                    // Add label for annotation display
                    label: measurement.label,
                    // Add the UID here instead of at the root level
                    uid: measurement.uid,
                },
                // Some tools (e.g. ArrowAnnotate) take their label/text from here
                // so we include it if available.
                metadata: {
                    toolName: measurement.toolName,
                    FrameOfReferenceUID: measurement.FrameOfReferenceUID || '',
                    referencedImageId: measurement.metadata.referencedImageId,
                    // Add frameNumber to metadata as well
                    frameNumber: measurement.frameNumber,
                },
            },
        };

        // Add debug logging to see what displayText is being passed
        console.log(`🔍 DEBUG: measurement.displayText before adding to service:`, measurement.displayText);
        console.log(`🔍 DEBUG: measurement object being stored:`, {
            uid: measurement.uid,
            displayText: measurement.displayText,
            label: measurement.label,
            toolName: measurement.toolName
        });

        console.log(`DEBUG: Creating annotation for ${measurement.toolName} measurement ${measurement.uid}:`);
        console.log('- handles:', rawDataForService.annotation.data.handles);
        console.log('- referencedImageId:', rawDataForService.annotation.metadata.referencedImageId);
        console.log('- frameNumber:', rawDataForService.annotation.data.frameNumber);
        console.log('- toolName:', measurement.toolName);
        console.log('- FrameOfReferenceUID:', rawDataForService.annotation.metadata.FrameOfReferenceUID);
        console.log('- annotation data being passed to Cornerstone3D:', rawDataForService.annotation.data);

        try {
            // Add measurement to the measurement service
            // The RAW_MEASUREMENT_ADDED event handler in the cornerstone extension
            // will automatically create the annotation and add it to Cornerstone3D

            // Add a one-time listener to see if RAW_MEASUREMENT_ADDED event fires
            const debugListener = (eventData) => {
                console.log('🔍 DEBUG: RAW_MEASUREMENT_ADDED event fired:', eventData);
                console.log('🔍 DEBUG: Event measurement uid:', eventData.measurement?.uid);
                console.log('🔍 DEBUG: Event source:', eventData.source);
                console.log('🔍 DEBUG: Event data:', eventData.data);
            };
            const unsubscribe = measurementService.subscribe(measurementService.EVENTS.RAW_MEASUREMENT_ADDED, debugListener);

            // Clean up listener after a delay
            setTimeout(() => {
                if (unsubscribe && typeof unsubscribe === 'function') {
                    unsubscribe();
                }
            }, 1000);

                    // Add the measurement to the measurement service
        console.log(`🔍 DEBUG: Adding measurement to service with displayText:`, measurement.displayText);
        console.log(`🔍 DEBUG: Full measurement object before service:`, measurement);
        
        measurementService.addRawMeasurement(source, measurement.toolName, rawDataForService, identityMapping, dataSource);
        
        // Immediately check what the measurement service stored and try to fix displayText
        setTimeout(() => {
            const storedMeasurements = measurementService.getMeasurements();
            const ourMeasurement = storedMeasurements.find(m => m.uid === measurement.uid);
            console.log(`🔍 DEBUG: Measurement as stored in service:`, ourMeasurement);
            console.log(`🔍 DEBUG: Stored measurement displayText:`, ourMeasurement?.displayText);
            
            // If displayText was reset, try to restore it
            if (ourMeasurement && ourMeasurement.displayText && 
                ourMeasurement.displayText.primary && 
                ourMeasurement.displayText.primary.length === 0) {
                
                console.log(`🔍 DEBUG: DisplayText was reset, attempting to restore it`);
                
                // Try to update the measurement with the correct displayText
                const correctDisplayText = measurement.displayText;
                console.log(`🔍 DEBUG: Restoring displayText to:`, correctDisplayText);
                
                // Update the measurement object directly (this should be enough)
                ourMeasurement.displayText = correctDisplayText;
                console.log(`🔍 DEBUG: Updated measurement displayText directly`);
                
                // Verify the fix
                setTimeout(() => {
                    const updatedMeasurements = measurementService.getMeasurements();
                    const updatedMeasurement = updatedMeasurements.find(m => m.uid === measurement.uid);
                    console.log(`🔍 DEBUG: After restoration attempt, displayText is:`, updatedMeasurement?.displayText);
                }, 10);
            }
        }, 50);

            // The RAW_MEASUREMENT_ADDED event should trigger the cornerstone extension 
            // to create the annotation automatically, so we don't need manual annotation creation

            // CRITICAL: Ensure annotation visibility is set after creation
            try {
                // Wait a moment for the annotation to be created
                setTimeout(() => {
                    const cornerstoneTools = (window as any).cornerstoneTools;
                    if (cornerstoneTools?.annotation?.visibility) {
                        console.log(`🔍 DEBUG: Setting annotation visibility for ${measurement.uid}`);
                        cornerstoneTools.annotation.visibility.setAnnotationVisibility(measurement.uid, true);

                        // Also try to force render after setting visibility
                        const { cornerstoneViewportService } = servicesManager.services;
                        const renderingEngine = cornerstoneViewportService?.getRenderingEngine();
                        if (renderingEngine) {
                            const viewportIds = renderingEngine.getViewports().map(viewport => viewport.id);
                            try {
                                triggerAnnotationRenderForViewportIds(viewportIds);
                                console.log(`🔍 DEBUG: Triggered render after setting visibility for ${measurement.uid}`);
                            } catch (renderErr) {
                                console.warn('Failed to trigger render after setting visibility:', renderErr);
                            }
                        }
                    }
                }, 100);
            } catch (visibilityErr) {
                console.warn('Failed to set annotation visibility:', visibilityErr);
            }

            console.log(`✅ Successfully added measurement ${measurement.uid} to measurement service`);
        } catch (error) {
            console.error(`❌ Failed to add measurement ${measurement.uid}:`, error);
        }
    });

    // Trigger viewport refresh to display the imported measurements - following old approach
    const { cornerstoneViewportService, toolGroupService } = servicesManager.services;
    if (cornerstoneViewportService && toolGroupService) {
        try {
            // Get the rendering engine
            const renderingEngine = cornerstoneViewportService.getRenderingEngine();
            if (renderingEngine) {
                // Get all viewport IDs from the rendering engine
                const viewportIds = renderingEngine.getViewports().map(viewport => viewport.id);
                console.log(`🔍 DEBUG: Found viewports for refresh: ${JSON.stringify(viewportIds)}`);

                // Ensure tools are set to passive mode (like old refreshToolStateManager)
                const toolTypes = ['Length', 'RectangleROI', 'EllipticalROI', 'ArrowAnnotate', 'Bidirectional'];
                viewportIds.forEach(viewportId => {
                    try {
                        const toolGroup = toolGroupService.getToolGroupForViewport(viewportId);
                        if (toolGroup) {
                            toolTypes.forEach(toolType => {
                                try {
                                    const toolConfig = toolGroup.getToolConfiguration(toolType);
                                    if (toolConfig) {
                                        // Ensure the tool is active or passive so measurements render
                                        const currentMode = toolGroup.getToolOptions(toolType)?.mode;
                                        if (currentMode !== 'Active' && currentMode !== 'Passive') {
                                            toolGroup.setToolPassive(toolType);
                                            console.log(`🔍 DEBUG: Set ${toolType} to passive mode for viewport ${viewportId}`);
                                        }
                                    }
                                } catch (toolErr) {
                                    // Tool might not be available, skip
                                }
                            });
                        }
                    } catch (toolGroupErr) {
                        console.warn(`Could not get tool group for viewport ${viewportId}:`, toolGroupErr);
                    }
                });

                // Use the imported triggerAnnotationRenderForViewportIds function
                try {
                    triggerAnnotationRenderForViewportIds(viewportIds);
                    console.log(`✅ DEBUG: Triggered annotation rendering for viewports: ${JSON.stringify(viewportIds)}`);
                } catch (error) {
                    console.error('Failed to trigger annotation rendering:', error);
                }

                // Force a render of all viewports (like old cornerstone.updateImage)
                try {
                    renderingEngine.render();
                    console.log(`✅ DEBUG: Forced render of all viewports`);
                } catch (error) {
                    console.error('Failed to force render:', error);
                }

                // Additional: try to refresh individual viewports
                viewportIds.forEach(viewportId => {
                    try {
                        const viewport = renderingEngine.getViewport(viewportId);
                        if (viewport && typeof viewport.render === 'function') {
                            viewport.render();
                            console.log(`✅ DEBUG: Rendered individual viewport ${viewportId}`);
                        }
                    } catch (vpErr) {
                        console.warn(`Failed to render viewport ${viewportId}:`, vpErr);
                    }
                });
            }
        } catch (error) {
            console.error('Error during viewport refresh:', error);
        }
    }

    // Try to force annotation state synchronization
    try {
        // Get all measurements and log the total count
        const allMeasurements = measurementService.getMeasurements();
        console.log(`DEBUG: Total measurements in service: ${allMeasurements.length}`);
        
        // Debug measurement service data
        allMeasurements.forEach((serviceMeasurement, index) => {
            console.log(`🔍 DEBUG: Service measurement ${index}:`, {
                uid: serviceMeasurement.uid,
                toolName: serviceMeasurement.toolName,
                displayText: serviceMeasurement.displayText,
                baseDisplayText: serviceMeasurement.baseDisplayText,
                label: serviceMeasurement.label,
                data: serviceMeasurement.data,
                referenceSeriesUID: serviceMeasurement.referenceSeriesUID
            });
            
            // Debug display sets for this measurement
            if (serviceMeasurement.referenceSeriesUID) {
                console.log(`🔍 DEBUG: Service measurement ${index} referenceSeriesUID:`, serviceMeasurement.referenceSeriesUID);
                
                const { displaySetService } = servicesManager.services;
                const displaySets = displaySetService.getDisplaySetsForSeries(serviceMeasurement.referenceSeriesUID);
                console.log(`🔍 DEBUG: Display sets for series ${serviceMeasurement.referenceSeriesUID}:`, displaySets);
                
                if (displaySets && displaySets.length > 0) {
                    console.log(`🔍 DEBUG: First display set has instances:`, !!displaySets[0]?.instances);
                    console.log(`🔍 DEBUG: First display set instances count:`, displaySets[0]?.instances?.length);
                    console.log(`🔍 DEBUG: First display set:`, displaySets[0]);
                } else {
                    console.log(`🔍 DEBUG: No display sets found for series ${serviceMeasurement.referenceSeriesUID}`);
                }
            }
        });

        // Add debug logging to check annotation state
        try {
            // Check if annotations exist in Cornerstone3D state
            const cornerstoneTools = (window as any).cornerstoneTools;
            if (cornerstoneTools && cornerstoneTools.annotation && cornerstoneTools.annotation.state) {
                const annotationManager = cornerstoneTools.annotation.state.getAnnotationManager();
                const allAnnotations = annotationManager.getAllAnnotations();
                console.log(`🔍 DEBUG: Total annotations in Cornerstone3D: ${Object.keys(allAnnotations).length}`);
                console.log(`🔍 DEBUG: Annotation UIDs:`, Object.keys(allAnnotations));

                // Check for our specific measurements and get detailed annotation data
                allMeasurements.forEach(measurement => {
                    console.log(`🔍 DEBUG: Looking for annotation with UID: ${measurement.uid}`);
                    const annotation = annotationManager.getAnnotation(measurement.uid);
                    if (annotation) {
                        console.log(`🔍 DEBUG: Found annotation for ${measurement.uid}:`, annotation);
                        console.log(`🔍 DEBUG: Annotation metadata:`, annotation.metadata);
                        console.log(`🔍 DEBUG: Annotation data:`, annotation.data);
                        console.log(`🔍 DEBUG: Annotation isVisible:`, annotation.isVisible);
                        console.log(`🔍 DEBUG: Annotation highlighted:`, annotation.highlighted);
                        console.log(`🔍 DEBUG: Annotation invalidated:`, annotation.invalidated);

                        // Check visibility state using the visibility manager
                        try {
                            const isVisibleFromManager = cornerstoneTools.annotation.visibility.isAnnotationVisible(measurement.uid);
                            console.log(`🔍 DEBUG: Visibility from visibility manager: ${isVisibleFromManager}`);

                            // If not visible, try to set it visible
                            if (!isVisibleFromManager) {
                                console.log(`🔍 DEBUG: Annotation ${measurement.uid} is not visible, attempting to make it visible`);
                                cornerstoneTools.annotation.visibility.setAnnotationVisibility(measurement.uid, true);
                                const newVisibilityState = cornerstoneTools.annotation.visibility.isAnnotationVisible(measurement.uid);
                                console.log(`🔍 DEBUG: After setting visibility: ${newVisibilityState}`);
                            }
                        } catch (visErr) {
                            console.warn('Failed to check/set visibility:', visErr);
                        }

                        // Check if annotation data has required fields for Length tool
                        if (annotation.metadata.toolName === 'Length') {
                            console.log(`🔍 DEBUG: Length annotation handles:`, annotation.data.handles);
                            console.log(`🔍 DEBUG: Length annotation points:`, annotation.data.handles?.points);
                            console.log(`🔍 DEBUG: Length annotation textBox:`, annotation.data.handles?.textBox);

                            // Check if the points are valid world coordinates
                            if (annotation.data.handles?.points) {
                                annotation.data.handles.points.forEach((point, index) => {
                                    console.log(`🔍 DEBUG: Point ${index}:`, point, `(type: ${typeof point}, isArray: ${Array.isArray(point)})`);
                                });
                            }
                        }
                    } else {
                        console.log(`🔍 DEBUG: NO annotation found for measurement ${measurement.uid}`);
                    }
                });

                // Also check all annotations by their actual keys
                Object.keys(allAnnotations).forEach(annotationKey => {
                    const annotation = allAnnotations[annotationKey];
                    console.log(`🔍 DEBUG: Annotation ${annotationKey} details:`, {
                        uid: annotation.annotationUID || annotation.uid,
                        toolName: annotation.metadata?.toolName,
                        referencedImageId: annotation.metadata?.referencedImageId,
                        isVisible: annotation.isVisible,
                        highlighted: annotation.highlighted,
                        invalidated: annotation.invalidated,
                        data: annotation.data
                    });
                });
            }
        } catch (annotationErr) {
            console.log('🔍 DEBUG: Could not access Cornerstone3D annotation state:', annotationErr);
        }

        // Check tool state
        try {
            const { toolGroupService, cornerstoneViewportService } = servicesManager.services;
            const renderingEngine = cornerstoneViewportService.getRenderingEngine();
            if (renderingEngine) {
                const viewports = renderingEngine.getViewports();
                viewports.forEach(viewport => {
                    console.log(`🔍 DEBUG: Checking viewport ${viewport.id}`);

                    // Check current image in viewport
                    try {
                        const currentImageId = viewport.getCurrentImageId ? viewport.getCurrentImageId() : null;
                        console.log(`🔍 DEBUG: Current imageId in viewport ${viewport.id}:`, currentImageId);

                        // Check if this matches any of our measurement imageIds
                        allMeasurements.forEach(measurement => {
                            const measurementImageId = measurement.metadata?.referencedImageId;
                            const matches = currentImageId === measurementImageId;
                            console.log(`🔍 DEBUG: Measurement ${measurement.uid} imageId match: ${matches}`);
                            console.log(`🔍 DEBUG: - Expected: ${measurementImageId}`);
                            console.log(`🔍 DEBUG: - Current: ${currentImageId}`);

                            // Check if annotation is associated with this viewport
                            if (matches) {
                                console.log(`🔍 DEBUG: ImageId matches for measurement ${measurement.uid}, checking viewport renderability`);
                                try {
                                    // Check if the viewport can display this annotation based on FrameOfReferenceUID
                                    const measurementFrameOfRef = measurement.FrameOfReferenceUID || measurement.metadata?.FrameOfReferenceUID;
                                    if (measurementFrameOfRef) {
                                        console.log(`🔍 DEBUG: Measurement FrameOfReferenceUID: ${measurementFrameOfRef}`);

                                        // Get the viewport's current FrameOfReferenceUID
                                        try {
                                            const viewportFrameOfRef = viewport.getFrameOfReferenceUID?.();
                                            console.log(`🔍 DEBUG: Viewport FrameOfReferenceUID: ${viewportFrameOfRef}`);

                                            // Also try to get it from the current image
                                            const currentImageId = viewport.getCurrentImageId?.();
                                            if (currentImageId) {
                                                const metaData = (window as any).cornerstone?.metaData;
                                                if (metaData) {
                                                    const instanceMeta = metaData.get('instance', currentImageId);
                                                    const imageFrameOfRef = instanceMeta?.FrameOfReferenceUID || instanceMeta?.frameOfReferenceUID;
                                                    console.log(`🔍 DEBUG: Current image FrameOfReferenceUID: ${imageFrameOfRef}`);

                                                    // Check for hex format too
                                                    const forUIDHex = instanceMeta?.['00200052'] || instanceMeta?.['x00200052'];
                                                    if (forUIDHex?.Value && Array.isArray(forUIDHex.Value)) {
                                                        console.log(`🔍 DEBUG: Current image FrameOfReferenceUID (hex): ${forUIDHex.Value[0]}`);
                                                    }
                                                }
                                            }
                                        } catch (err) {
                                            console.warn('Failed to get viewport FrameOfReferenceUID:', err);
                                        }

                                        let canRender = viewport.isReferenceViewable?.({ FrameOfReferenceUID: measurementFrameOfRef });
                                        console.log(`🔍 DEBUG: Viewport can render annotation with FrameOfReferenceUID ${measurementFrameOfRef}: ${canRender}`);

                                        // If viewport says it can't render, but the image FrameOfReferenceUID matches, 
                                        // this might be a viewport initialization issue - force it to work
                                        if (canRender === false) {
                                            console.warn(`🔍 DEBUG: Viewport cannot render annotation ${measurement.uid} - checking if image FrameOfReferenceUID matches`);

                                            // Check if the current image's FrameOfReferenceUID matches the measurement
                                            const currentImageId = viewport.getCurrentImageId?.();
                                            let imageFrameOfRef = null;

                                            if (currentImageId) {
                                                const metaData = (window as any).cornerstone?.metaData;
                                                if (metaData) {
                                                    const instanceMeta = metaData.get('instance', currentImageId);
                                                    imageFrameOfRef = instanceMeta?.FrameOfReferenceUID || instanceMeta?.frameOfReferenceUID;

                                                    // Check for hex format too
                                                    if (!imageFrameOfRef) {
                                                        const forUIDHex = instanceMeta?.['00200052'] || instanceMeta?.['x00200052'];
                                                        if (forUIDHex?.Value && Array.isArray(forUIDHex.Value)) {
                                                            imageFrameOfRef = forUIDHex.Value[0];
                                                        }
                                                    }
                                                }
                                            }

                                            console.log(`🔍 DEBUG: Comparing - Measurement: ${measurementFrameOfRef}, Image: ${imageFrameOfRef}`);

                                            if (imageFrameOfRef && imageFrameOfRef === measurementFrameOfRef) {
                                                console.log(`🔍 DEBUG: FrameOfReferenceUIDs match! Forcing annotation to be viewable by updating viewport state`);

                                                // The FrameOfReferenceUIDs actually match, so this is a viewport state issue
                                                // Let's try to force the annotation to be rendered by bypassing the viewport check
                                                try {
                                                    const cornerstoneTools = (window as any).cornerstoneTools;
                                                    if (cornerstoneTools?.annotation?.state) {
                                                        const annotation = cornerstoneTools.annotation.state.getAnnotation(measurement.uid);
                                                        if (annotation) {
                                                            console.log(`🔍 DEBUG: Found annotation, forcing visibility and render`);

                                                            // Force the annotation to be visible and valid
                                                            annotation.isVisible = true;
                                                            annotation.invalidated = false;

                                                            // CRITICAL FIX: Re-add the annotation to the element's annotation state
                                                            // This ensures it passes the filterInteractableAnnotationsForElement check
                                                            console.log(`🔍 DEBUG: Re-adding annotation to element annotation state`);
                                                            const { cornerstoneViewportService } = servicesManager.services;
                                                            const renderingEngine = cornerstoneViewportService?.getRenderingEngine();
                                                            if (renderingEngine) {
                                                                const viewportIds = renderingEngine.getViewports().map(vp => vp.id);
                                                                const viewport = renderingEngine.getViewport(viewportIds[0]);
                                                                if (viewport && viewport.element) {
                                                                    // Remove and re-add the annotation to ensure it's properly registered
                                                                    cornerstoneTools.annotation.state.removeAnnotation(measurement.uid);
                                                                    cornerstoneTools.annotation.state.addAnnotation(annotation, viewport.element);
                                                                    console.log(`🔍 DEBUG: Re-added annotation to element: ${viewport.element}`);

                                                                    // Also ensure the annotation is in the correct frame state
                                                                    if (annotation.metadata && !annotation.metadata.FrameOfReferenceUID) {
                                                                        annotation.metadata.FrameOfReferenceUID = imageFrameOfRef;
                                                                        console.log(`🔍 DEBUG: Set annotation FrameOfReferenceUID to ${imageFrameOfRef}`);
                                                                    }

                                                                    // Force render multiple times to ensure it sticks
                                                                    setTimeout(() => {
                                                                        triggerAnnotationRenderForViewportIds(viewportIds);
                                                                        console.log(`🔍 DEBUG: Forced annotation render - attempt 1`);
                                                                    }, 100);

                                                                    setTimeout(() => {
                                                                        triggerAnnotationRenderForViewportIds(viewportIds);
                                                                        renderingEngine.render();
                                                                        console.log(`🔍 DEBUG: Forced annotation render - attempt 2`);
                                                                    }, 500);

                                                                    setTimeout(() => {
                                                                        const viewport = renderingEngine.getViewport(viewportIds[0]);
                                                                        if (viewport && viewport.render) {
                                                                            viewport.render();
                                                                        }
                                                                        console.log(`🔍 DEBUG: Forced viewport render - attempt 3`);
                                                                    }, 1000);
                                                                }
                                                            }

                                                            canRender = true; // Override the result since we know it should work
                                                            console.log(`🔍 DEBUG: Successfully forced annotation viewability`);
                                                        }
                                                    }
                                                } catch (forceErr) {
                                                    console.warn('Failed to force annotation viewability:', forceErr);
                                                }
                                            } else {
                                                console.warn(`🔍 DEBUG: FrameOfReferenceUID truly doesn't match - Measurement: ${measurementFrameOfRef}, Image: ${imageFrameOfRef}`);
                                            }
                                        }
                                    }
                                } catch (renderCheckErr) {
                                    console.warn('Failed to check viewport renderability:', renderCheckErr);
                                }
                            }
                        });
                    } catch (imageErr) {
                        console.log(`🔍 DEBUG: Could not get current imageId for viewport ${viewport.id}:`, imageErr);
                    }

                    try {
                        const toolGroup = toolGroupService.getToolGroupForViewport(viewport.id);
                        if (toolGroup) {
                            const lengthToolState = toolGroup.getToolConfiguration('Length');
                            console.log(`🔍 DEBUG: Length tool state for viewport ${viewport.id}:`, lengthToolState);
                        }
                    } catch (toolErr) {
                        console.log(`🔍 DEBUG: Could not get tool state for viewport ${viewport.id}:`, toolErr);
                    }
                });
            }
        } catch (toolStateErr) {
            console.log('🔍 DEBUG: Could not check tool state:', toolStateErr);
        }

    } catch (err) {
        console.warn('Failed to get measurements count:', err);
    }

    return imageMeasurements.length;
}

export default importMeasurementCollection;