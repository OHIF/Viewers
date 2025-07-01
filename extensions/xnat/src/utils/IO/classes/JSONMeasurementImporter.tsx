/*
 * JSONMeasurementImporter - utility to parse a Measurement Collection JSON (as returned by XNAT)
 * and inject its imageMeasurements into OHIF MeasurementService so they appear in the viewer.
 */

import { Enums as CSExtensionEnums } from '@ohif/extension-cornerstone';

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

// Simple identity mapping – data we feed to addRawMeasurement is already in measurement schema.
const identityMapping = data => data;

export async function importMeasurementCollection({
    collectionJSON,
    servicesManager,
}) {
    if (!collectionJSON || !servicesManager) {
        throw new Error('importMeasurementCollection: missing parameters');
    }

    const { measurementService } = servicesManager.services;
    const source = _getMeasurementSource(measurementService);

    const imageRef = collectionJSON.imageReference || {};
    const studyUID = imageRef.StudyInstanceUID || imageRef.studyInstanceUID;
    const seriesUID = imageRef.SeriesInstanceUID || imageRef.seriesInstanceUID;

    // Build a lookup for SOP -> frameIndex
    const sopToFrame = {};
    (imageRef.imageCollection || []).forEach(img => {
        sopToFrame[img.SOPInstanceUID] = (img.frameIndex ?? img.frameNumber ?? 0);
    });

    const imageMeasurements = collectionJSON.imageMeasurements || [];

    imageMeasurements.forEach(im => {
        const measurement = {
            uid: im.uuid,
            SOPInstanceUID: im.imageReference?.SOPInstanceUID,
            FrameOfReferenceUID: im.frameOfReferenceUID || '',
            referenceSeriesUID: seriesUID,
            referenceStudyUID: studyUID,
            frameNumber: (im.imageReference?.frameIndex ?? 0) + 1,
            toolName: im.toolType,
            label: im.name,
            description: im.description,
            color: im.color,
            points: [],
            data: im.data || {},
            displayText: '',
        };

        // Extract points from handles
        const handles = im.data?.handles;
        if (handles) {
            const pointHandles = Object.values(handles).filter(
                (h: any) => h && typeof h.x === 'number' && typeof h.y === 'number'
            );
            measurement.points = pointHandles.map((p: any) => [p.x, p.y, p.z || 0]);
        }
        
        // Extract displayText from the measurements array
        const stats = im.measurements;
        if (stats && stats.length > 0) {
            const mainStat = stats[0];
            if (typeof mainStat.value === 'number' && isFinite(mainStat.value)) {
                measurement.displayText = `${mainStat.value.toFixed(2)} ${mainStat.unit || ''}`.trim();
            } else if (mainStat.comment) {
                measurement.displayText = mainStat.comment;
            } else {
                measurement.displayText = '';
            }
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
            if (!measurement.data.handles || !measurement.data.handles.start || !measurement.data.handles.end) {
                if (measurement.points.length >= 2) {
                    measurement.data.handles = {
                        start: { x: measurement.points[0][0], y: measurement.points[0][1] },
                        end: { x: measurement.points[1][0], y: measurement.points[1][1] },
                    };
                }
            }
            // Ensure length is present and correct
            if (typeof measurement.data.length !== 'number' || measurement.data.length === 0) {
                // Try to get from im.measurements
                const stat = Array.isArray(im.measurements) && im.measurements.find((m: any) => m.name === 'length');
                if (stat && typeof stat.value === 'number') {
                    measurement.data.length = stat.value;
                } else if (measurement.data.handles.start && measurement.data.handles.end) {
                    const dx = measurement.data.handles.end.x - measurement.data.handles.start.x;
                    const dy = measurement.data.handles.end.y - measurement.data.handles.start.y;
                    measurement.data.length = Math.sqrt(dx * dx + dy * dy);
                }
            }
            console.log('Final Length measurement.data:', measurement.data);
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

        // Add detailed logging
        console.log('Incoming measurement JSON:', im);
        console.log('Constructed measurement object:', measurement);
        console.log('measurement.data:', measurement.data);
        console.log('measurement.data.handles:', measurement.data.handles);

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

        try {
            measurementService.addRawMeasurement(
                source,
                measurement.toolName,
                measurement,
                identityMapping, {}
            );
        } catch (err) {
            console.warn(`Failed to add measurement ${im.uuid}:`, err);
            console.warn('Measurement object:', measurement);
        }
    });

    return imageMeasurements.length;
}

export default importMeasurementCollection;