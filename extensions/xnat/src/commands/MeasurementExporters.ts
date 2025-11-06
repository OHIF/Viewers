/**
 * Measurement export utilities
 * Extracted from measurementCommands.ts
 */

import dcmjs from 'dcmjs';
import JSONMeasurementExporter from '../utils/IO/classes/JSONMeasurementExporter';
import sessionMap from '../utils/sessionMap';

const { DicomMetaDictionary } = dcmjs.data;

export interface MeasurementExporterParams {
    measurementService: any;
    uiNotificationService: any;
    viewportGridService: any;
    displaySetService: any;
    servicesManager: any;
}

/**
 * Stores the current measurement set to XNAT as a MeasurementCollection JSON.
 */
export async function XNATStoreMeasurements({
    measurementService,
    uiNotificationService,
    viewportGridService,
    displaySetService,
    servicesManager,
}: MeasurementExporterParams) {
    const measurements: any[] = measurementService.getMeasurements();
    if (!measurements || !measurements.length) {
        uiNotificationService.show({
            title: 'Export Measurements',
            message: 'No measurements found to export.',
            type: 'warning',
        });
        return;
    }

    const { activeViewportId } = viewportGridService.getState();
    const viewport = viewportGridService.getState().viewports.get(activeViewportId);
    const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
    const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

    const seriesInstanceUID = displaySet.SeriesInstanceUID;
    const studyInstanceUID = displaySet.StudyInstanceUID;

    // Use a more robust way to get the experiment ID, with fallbacks
    let experimentId = null;
    const { sessionRouter } = servicesManager.services;
    if (sessionRouter && sessionRouter.experimentId) {
        experimentId = sessionRouter.experimentId;
    } else if (window.sessionStorage) {
        experimentId = window.sessionStorage.getItem('xnat_experimentId');
    }

    if (!experimentId) {
        experimentId = sessionMap.getExperimentID(seriesInstanceUID);
    }
    if (!experimentId) {
        experimentId = sessionMap.getExperimentID();
    }
    if (!experimentId) {
        const sessionData = sessionMap.get(displaySet.StudyInstanceUID);
        if (sessionData && sessionData.experimentId) {
            experimentId = sessionData.experimentId;
        }
    }

    if (!experimentId) {
        uiNotificationService.show({
            title: 'Export Measurements',
            message: 'Unable to determine XNAT experiment ID. Please ensure you are viewing data from XNAT.',
            type: 'error',
        });
        return;
    }

    // Prompt user for collection name
    const defaultLabel = `Measurements_${new Date().toISOString().replace(/[.:-]/g, '')}`;
    const sanitizeLabel = (label: string) => {
        // Remove any special characters and ensure it starts with a letter
        const sanitized = label.replace(/[^a-zA-Z0-9_-]/g, '_');
        // Ensure it doesn't start with a number or underscore
        return sanitized.replace(/^[0-9_]/, 'M_');
    };

    const userLabel = await new Promise<string | null>(resolve => {
        const promptMessage = `Enter a name for the measurement collection.\n(Allowed characters: A-Z, a-z, 0-9, _, -)`;
        const userInput = window.prompt(promptMessage, sanitizeLabel(defaultLabel));
        if (userInput === null) {
            resolve(null);
        } else {
            resolve(sanitizeLabel(userInput.trim() || defaultLabel));
        }
    });

    if (!userLabel) {
        return; // user cancelled
    }

    // Helper to format date as YYYYMMDDHHmmss.SSS
    const formatDateTime = (date: Date) => {
        const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
        return (
            date.getFullYear().toString() +
            pad(date.getMonth() + 1) +
            pad(date.getDate()) +
            pad(date.getHours()) +
            pad(date.getMinutes()) +
            pad(date.getSeconds()) +
            '.' + String(date.getMilliseconds()).padStart(3, '0')
        );
    };

    // Build a map of SOPInstanceUID -> frame index (0-based); default 0 if missing
    const sopToFrame: Record<string, number> = {};
    measurements.forEach(m => {
        sopToFrame[m.SOPInstanceUID] = m.frameNumber ?? 0;
    });

    const uniqueSops = Array.from(new Set(measurements.map(m => m.SOPInstanceUID)));

    const imageCollection = uniqueSops.map(uid => ({
        SOPInstanceUID: uid,
        frameIndex: Number(sopToFrame[uid] ?? 0),
    }));

    // Build individual image measurement objects in the required shape
    const buildMeasurementObject = (m): any => {
        const points = m.points || [];
        const createHandle = (pt: number[]) => ({ x: Number(pt[0]), y: Number(pt[1]), z: Number(pt[2] || 0) });

        // Basic skeleton with all required keys
        const base: any = {
            uuid: m.uid || DicomMetaDictionary.uid(),
            toolType: m.toolName || 'Unknown',
            name: m.label || m.toolName || '',
            description: '',
            codingSequence: [],
            color: m.color || '#FF0000',
            lineThickness: 1,
            dashedLine: false,
            visible: true,
            frameOfReferenceUID: m.FrameOfReferenceUID || m.metadata?.FrameOfReferenceUID || undefined,
            imageReference: {
                SOPInstanceUID: m.SOPInstanceUID,
                frameIndex: Number(sopToFrame[m.SOPInstanceUID] ?? 0),
            },
            viewport: {},
            data: {},
            measurements: [],
        };

        console.log(`🔍 DEBUG: Exporting measurement ${m.uid}:`);
        console.log(`🔍 DEBUG: - FrameOfReferenceUID from measurement: ${m.FrameOfReferenceUID || 'undefined'}`);
        console.log(`🔍 DEBUG: - FrameOfReferenceUID from metadata: ${m.metadata?.FrameOfReferenceUID || 'undefined'}`);
        console.log(`🔍 DEBUG: - Final frameOfReferenceUID: ${base.frameOfReferenceUID || 'undefined (optional)'}`);
        console.log(`🔍 DEBUG: - Tool type: ${m.toolName}`);
        console.log(`🔍 DEBUG: - Measurement type: ${m.type}`);
        console.log(`🔍 DEBUG: - Cached stats:`, m.data?.cachedStats);
        console.log(`🔍 DEBUG: - Display text:`, m.displayText);

        // Populate tool-specific "data" minimally
        console.log(`🔍 DEBUG: Switch statement using base.toolType: ${base.toolType}`);
        switch (base.toolType) {
            case 'Length':
                if (points.length >= 2) {
                    // Extract length from OHIF measurement structure
                    let lengthVal = 0;
                    if (m.data?.cachedStats) {
                        // Get length from cachedStats (the standard OHIF structure)
                        const stats = Object.values(m.data.cachedStats)[0] as any;
                        lengthVal = stats?.length || 0;
                    } else if (m.displayText?.primary?.length > 0) {
                        // Fallback: parse from displayText
                        const primaryText = m.displayText.primary[0];
                        const match = primaryText.match(/([0-9.]+)\s*mm/);
                        if (match) {
                            lengthVal = parseFloat(match[1]);
                        }
                    }

                    console.log('Export: extracted length value:', lengthVal, 'from measurement:', m);

                    base.data = {
                        length: Number(lengthVal),
                        handles: { start: createHandle(points[0]), end: createHandle(points[1]) },
                    };
                    base.measurements.push({ name: 'length', value: Number(lengthVal), unit: 'mm' });
                }
                break;
            case 'Bidirectional':
                if (points.length >= 4) {
                    const sd = m.shortestDiameter || 0;
                    const ld = m.longestDiameter || 0;
                    base.data = {
                        shortestDiameter: Number(sd),
                        longestDiameter: Number(ld),
                        handles: {
                            start: createHandle(points[0]),
                            end: createHandle(points[1]),
                            start2: createHandle(points[2]),
                            end2: createHandle(points[3]),
                        },
                    };
                    base.measurements.push(
                        { name: 'longestDiameter', value: Number(ld), unit: 'mm' },
                        { name: 'shortestDiameter', value: Number(sd), unit: 'mm' }
                    );
                }
                break;
            case 'ArrowAnnotate':
                if (points.length >= 2) {
                    base.data = {
                        text: m.text || '',
                        handles: {
                            start: createHandle(points[0]),
                            end: createHandle(points[1]),
                        },
                    };
                }
                break;
            case 'EllipticalRoi':
                if (points.length >= 4) {
                    // Elliptical ROI: points are [corner1, corner2] defining the bounding box
                    const corner1 = points[0];
                    const corner2 = points[1];
                    const centerX = (corner1[0] + corner2[0]) / 2;
                    const centerY = (corner1[1] + corner2[1]) / 2;
                    const width = Math.abs(corner2[0] - corner1[0]);
                    const height = Math.abs(corner2[1] - corner1[1]);

                    base.data = {
                        handles: {
                            start: { x: centerX, y: centerY, z: corner1[2] || 0 },
                            end: { x: centerX + width / 2, y: centerY + height / 2, z: corner1[2] || 0 },
                        },
                    };

                    // Extract area if available
                    let areaVal = 0;
                    if (m.data?.cachedStats) {
                        const stats = Object.values(m.data.cachedStats)[0] as any;
                        areaVal = stats?.area || 0;
                    }
                    if (areaVal > 0) {
                        base.measurements.push({ name: 'area', value: Number(areaVal), unit: 'mm²' });
                    }
                }
                break;
            case 'CircleRoi':
                if (points.length >= 2) {
                    const center = points[0];
                    const perimeter = points[1];
                    const radius = Math.sqrt(
                        Math.pow(perimeter[0] - center[0], 2) + Math.pow(perimeter[1] - center[1], 2)
                    );

                    base.data = {
                        handles: {
                            start: createHandle(center),
                            end: createHandle(perimeter),
                        },
                    };

                    // Extract area if available
                    let areaVal = 0;
                    if (m.data?.cachedStats) {
                        const stats = Object.values(m.data.cachedStats)[0] as any;
                        areaVal = stats?.area || 0;
                    }
                    if (areaVal > 0) {
                        base.measurements.push({ name: 'area', value: Number(areaVal), unit: 'mm²' });
                    }
                }
                break;
            case 'RectangleRoi':
                if (points.length >= 4) {
                    // Rectangle ROI: points are the four corners
                    base.data = {
                        handles: {
                            start: createHandle(points[0]),
                            end: createHandle(points[2]), // opposite corner
                        },
                    };

                    // Extract area if available
                    let areaVal = 0;
                    if (m.data?.cachedStats) {
                        const stats = Object.values(m.data.cachedStats)[0] as any;
                        areaVal = stats?.area || 0;
                    }
                    if (areaVal > 0) {
                        base.measurements.push({ name: 'area', value: Number(areaVal), unit: 'mm²' });
                    }
                }
                break;
            case 'Angle':
                if (points.length >= 3) {
                    // Extract angle value
                    let angleVal = 0;
                    if (m.data?.cachedStats) {
                        const stats = Object.values(m.data.cachedStats)[0] as any;
                        angleVal = stats?.angle || 0;
                    } else if (m.displayText?.primary?.length > 0) {
                        const primaryText = m.displayText.primary[0];
                        const match = primaryText.match(/([0-9.]+)°/);
                        if (match) {
                            angleVal = parseFloat(match[1]);
                        }
                    }

                    base.data = {
                        handles: {
                            start: createHandle(points[0]),
                            middle: createHandle(points[1]),
                            end: createHandle(points[2]),
                        },
                    };
                    base.measurements.push({ name: 'angle', value: Number(angleVal), unit: 'deg' });
                }
                break;
            case 'CobbAngle':
                if (points.length >= 4) {
                    // Extract angle value
                    let angleVal = 0;
                    if (m.data?.cachedStats) {
                        const stats = Object.values(m.data.cachedStats)[0] as any;
                        angleVal = stats?.angle || 0;
                    }

                    base.data = {
                        handles: {
                            start: createHandle(points[0]),
                            end: createHandle(points[1]),
                            start2: createHandle(points[2]),
                            end2: createHandle(points[3]),
                        },
                    };
                    base.measurements.push({ name: 'cobbAngle', value: Number(angleVal), unit: 'deg' });
                }
                break;
            case 'Probe':
                if (points.length >= 1) {
                    base.data = {
                        handles: {
                            start: createHandle(points[0]),
                        },
                    };
                }
                break;
            default:
                console.log(`🔍 DEBUG: Unhandled tool type: ${base.toolType}, using generic data structure`);
                // Generic fallback for unsupported tools
                if (points.length > 0) {
                    const handles: any = {};
                    points.forEach((pt, idx) => {
                        handles[`point${idx + 1}`] = createHandle(pt);
                    });
                    base.data = { handles };
                }
                break;
        }

        return base;
    };

    // Build the measurement collection
    const measurementObjects = measurements.map(buildMeasurementObject);
    const now = new Date();
    const nowFormatted = formatDateTime(now);

    const measurementCollection = {
        version: '1.0',
        description: 'OHIF Measurement Collection',
        created: nowFormatted,
        modified: nowFormatted,
        collectionType: 'measurement',
        collectionId: DicomMetaDictionary.uid(),
        studyInstanceUID,
        seriesInstanceUID,
        experimentId,
        imageCollection,
        measurementGroups: [
            {
                groupId: DicomMetaDictionary.uid(),
                groupDescription: 'Default Measurement Group',
                measurements: measurementObjects,
            },
        ],
    };

    console.log('🔍 DEBUG: Final measurement collection:', measurementCollection);

    // Convert to JSON blob for export
    const jsonBlob = new Blob([JSON.stringify(measurementCollection)], {
        type: 'application/octet-stream',
    });

    // Use the JSONMeasurementExporter to save to XNAT
    const exporter = new JSONMeasurementExporter(
        jsonBlob,
        seriesInstanceUID,
        userLabel,
        experimentId
    );

    try {
        await exporter.exportToXNAT();
        uiNotificationService.show({
            title: 'Export Successful',
            message: `Successfully exported ${measurements.length} measurement(s) to XNAT`,
            type: 'success',
            duration: 3000,
        });
    } catch (error: any) {
        console.error('Error exporting measurements:', error);
        uiNotificationService.show({
            title: 'Export Failed',
            message: `Failed to export measurements: ${error.message}`,
            type: 'error',
            duration: 5000,
        });
        throw error;
    }
}
