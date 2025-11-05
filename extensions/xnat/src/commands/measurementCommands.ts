import { Types } from '@ohif/core';
import dcmjs from 'dcmjs';
import MeasurementImportMenu from '../xnat-components/XNATMeasurementImportMenu/XNATMeasurementImportMenu';
import JSONMeasurementExporter from '../utils/IO/classes/JSONMeasurementExporter';
import sessionMap from '../utils/sessionMap';

const { DicomMetaDictionary } = dcmjs.data;

export const createMeasurementCommands = (
    servicesManager: any,
    commandsManager: any
) => {
    const {
        measurementService,
        uiNotificationService,
        viewportGridService,
        displaySetService,
    } = servicesManager.services;

    const actions = {
        /**
         * Stores the current measurement set to XNAT as a MeasurementCollection JSON.
         */
        XNATStoreMeasurements: async () => {
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
                const message = 'Could not determine XNAT session ID. Measurements not exported.';
                console.error(message);
                uiNotificationService.show({
                    title: 'Export Measurements',
                    message,
                    type: 'error',
                });
                throw new Error('Experiment ID not found');
            }

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

            // Build a Measurement Collection JSON payload compliant with XNAT schema
            const DicomMetaDictionary = dcmjs.data.DicomMetaDictionary;

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
                                    perpendicularStart: createHandle(points[2]),
                                    perpendicularEnd: createHandle(points[3]),
                                },
                            };
                            base.measurements.push(
                                { name: 'shortestDiameter', value: Number(sd), unit: 'mm' },
                                { name: 'longestDiameter', value: Number(ld), unit: 'mm' },
                            );
                        }
                        break;
                    case 'Angle':
                        if (typeof m.rAngle === 'number') {
                            base.data = { rAngle: Number(m.rAngle), handles: {} };
                            base.measurements.push({ name: 'angle', value: Number(m.rAngle), unit: 'deg' });
                        }
                        break;
                    case 'RectangleROI':
                    case 'EllipticalROI':
                        // Extract area and other stats from cachedStats or displayText
                        let areaVal = 0;
                        let meanVal = 0;
                        let stdDevVal = 0;
                        let minVal = 0;
                        let maxVal = 0;

                        if (m.data?.cachedStats) {
                            // Get stats from cachedStats (the standard OHIF structure)
                            const stats = Object.values(m.data.cachedStats)[0] as any;
                            areaVal = stats?.area || 0;
                            meanVal = stats?.mean || 0;
                            stdDevVal = stats?.stdDev || 0;
                            minVal = stats?.min || 0;
                            maxVal = stats?.max || 0;
                        } else if (m.displayText?.primary?.length > 0) {
                            // Fallback: parse from displayText
                            const primaryText = m.displayText.primary[0];
                            const areaMatch = primaryText.match(/([0-9.]+)\s*mm²/);
                            if (areaMatch) {
                                areaVal = parseFloat(areaMatch[1]);
                            }
                        }

                        console.log('Export: extracted ROI values:', {
                            area: areaVal,
                            mean: meanVal,
                            stdDev: stdDevVal,
                            min: minVal,
                            max: maxVal
                        }, 'from measurement:', m);
                        console.log('Export: Full measurement object for ROI:', JSON.stringify(m, null, 2));

                        // Extract handles from points
                        const handles: any = {};
                        if (points.length >= 4) {
                            // For EllipticalROI, we typically have 4 points defining the ellipse
                            handles.points = points.map(pt => createHandle(pt));
                        } else if (points.length >= 2) {
                            // Fallback: use first two points as center and end
                            handles.center = createHandle(points[0]);
                            handles.end = createHandle(points[1]);
                        }

                        // Extract the actual cachedStats from the measurement data
                        const actualCachedStats = m.data?.cachedStats || {};
                        console.log('Export: Actual cachedStats being exported:', actualCachedStats);

                        base.data = {
                            cachedStats: actualCachedStats,
                            handles: handles,
                        };

                        // Add all available measurements
                        if (areaVal > 0) {
                            base.measurements.push({ name: 'area', value: Number(areaVal), unit: 'mm²' });
                        }
                        if (meanVal !== 0) {
                            base.measurements.push({ name: 'mean', value: Number(meanVal), unit: '' });
                        }
                        if (stdDevVal !== 0) {
                            base.measurements.push({ name: 'stdDev', value: Number(stdDevVal), unit: '' });
                        }
                        if (minVal !== 0) {
                            base.measurements.push({ name: 'min', value: Number(minVal), unit: '' });
                        }
                        if (maxVal !== 0) {
                            base.measurements.push({ name: 'max', value: Number(maxVal), unit: '' });
                        }
                        break;
                    case 'CircleROI':
                        // CircleROI has specific data structure with radius, perimeter, etc.
                        let circleAreaVal = 0;
                        let circleRadiusVal = 0;
                        let circlePerimeterVal = 0;
                        let circleMeanVal = 0;
                        let circleStdDevVal = 0;
                        let circleMinVal = 0;
                        let circleMaxVal = 0;

                        if (m.data?.cachedStats) {
                            // Get stats from cachedStats (the standard OHIF structure)
                            const stats = Object.values(m.data.cachedStats)[0] as any;
                            circleAreaVal = stats?.area || 0;
                            circleRadiusVal = stats?.radius || 0;
                            circlePerimeterVal = stats?.perimeter || 0;
                            circleMeanVal = stats?.mean || 0;
                            circleStdDevVal = stats?.stdDev || 0;
                            circleMinVal = stats?.min || 0;
                            circleMaxVal = stats?.max || 0;
                        } else if (m.displayText?.primary?.length > 0) {
                            // Fallback: parse from displayText
                            const primaryText = m.displayText.primary[0];
                            const areaMatch = primaryText.match(/([0-9.]+)\s*mm²/);
                            if (areaMatch) {
                                circleAreaVal = parseFloat(areaMatch[1]);
                            }
                        }

                        console.log('Export: extracted CircleROI values:', {
                            area: circleAreaVal,
                            radius: circleRadiusVal,
                            perimeter: circlePerimeterVal,
                            mean: circleMeanVal,
                            stdDev: circleStdDevVal,
                            min: circleMinVal,
                            max: circleMaxVal
                        }, 'from measurement:', m);
                        console.log('Export: Full CircleROI measurement object:', JSON.stringify(m, null, 2));

                        // CircleROI typically has 2 points: center and end point for radius
                        const circleHandles: any = {};
                        if (points.length >= 2) {
                            circleHandles.center = createHandle(points[0]);
                            circleHandles.end = createHandle(points[1]);
                        }

                        // Extract the actual cachedStats from the measurement data
                        const actualCircleCachedStats = m.data?.cachedStats || {};
                        console.log('Export: Actual CircleROI cachedStats being exported:', actualCircleCachedStats);

                        base.data = {
                            cachedStats: actualCircleCachedStats,
                            handles: circleHandles,
                        };

                        // Add all available CircleROI measurements
                        if (circleAreaVal > 0) {
                            base.measurements.push({ name: 'area', value: Number(circleAreaVal), unit: 'mm²' });
                        }
                        if (circleRadiusVal > 0) {
                            base.measurements.push({ name: 'radius', value: Number(circleRadiusVal), unit: 'mm' });
                        }
                        if (circlePerimeterVal > 0) {
                            base.measurements.push({ name: 'perimeter', value: Number(circlePerimeterVal), unit: 'mm' });
                        }
                        if (circleMeanVal !== 0) {
                            base.measurements.push({ name: 'mean', value: Number(circleMeanVal), unit: '' });
                        }
                        if (circleStdDevVal !== 0) {
                            base.measurements.push({ name: 'stdDev', value: Number(circleStdDevVal), unit: '' });
                        }
                        if (circleMinVal !== 0) {
                            base.measurements.push({ name: 'min', value: Number(circleMinVal), unit: '' });
                        }
                        if (circleMaxVal !== 0) {
                            base.measurements.push({ name: 'max', value: Number(circleMaxVal), unit: '' });
                        }
                        break;
                    case 'ArrowAnnotate':
                        console.log('Export: ArrowAnnotate measurement:', m);
                        console.log('Export: ArrowAnnotate points:', points);
                        console.log('Export: ArrowAnnotate textBox:', m.textBox);

                        // ArrowAnnotate typically has 2 points: start and end of the arrow
                        const arrowHandles: any = {};
                        if (points.length >= 2) {
                            arrowHandles.start = createHandle(points[0]);
                            arrowHandles.end = createHandle(points[1]);
                        }

                        // Extract textBox data if available
                        const textBoxData = m.textBox ? {
                            hasMoved: m.textBox.hasMoved || false,
                            worldPosition: m.textBox.worldPosition || [0, 0, 0],
                            worldBoundingBox: m.textBox.worldBoundingBox || {
                                topLeft: [0, 0, 0],
                                topRight: [0, 0, 0],
                                bottomLeft: [0, 0, 0],
                                bottomRight: [0, 0, 0]
                            }
                        } : {};

                        base.data = {
                            text: m.text || '',
                            handles: arrowHandles,
                            textBox: textBoxData,
                        };

                        // Add arrow measurement with any text content
                        const arrowText = m.text || m.label || '';
                        base.measurements.push({ name: 'arrow', comment: arrowText, unit: '' });

                        console.log('Export: ArrowAnnotate exported data:', base.data);
                        break;
                    case 'PlanarFreehandROI':
                        console.log('Export: PlanarFreehandROI measurement:', m);
                        console.log('Export: PlanarFreehandROI points:', points);
                        console.log('Export: PlanarFreehandROI data:', m.data);

                        // Extract area and other stats from cachedStats or displayText
                        let freehandAreaVal = 0;
                        let freehandMeanVal = 0;
                        let freehandStdDevVal = 0;
                        let freehandMinVal = 0;
                        let freehandMaxVal = 0;

                        if (m.data?.cachedStats) {
                            // Get stats from cachedStats (the standard OHIF structure)
                            const stats = Object.values(m.data.cachedStats)[0] as any;
                            freehandAreaVal = stats?.area || 0;
                            freehandMeanVal = stats?.mean || 0;
                            freehandStdDevVal = stats?.stdDev || 0;
                            freehandMinVal = stats?.min || 0;
                            freehandMaxVal = stats?.max || 0;
                        } else if (m.displayText?.primary?.length > 0) {
                            // Fallback: parse from displayText
                            const primaryText = m.displayText.primary[0];
                            const areaMatch = primaryText.match(/([0-9.]+)\s*mm²/);
                            if (areaMatch) {
                                freehandAreaVal = parseFloat(areaMatch[1]);
                            }
                        }

                        console.log('Export: extracted PlanarFreehandROI values:', {
                            area: freehandAreaVal,
                            mean: freehandMeanVal,
                            stdDev: freehandStdDevVal,
                            min: freehandMinVal,
                            max: freehandMaxVal
                        }, 'from measurement:', m);
                        console.log('Export: Full PlanarFreehandROI measurement object:', JSON.stringify(m, null, 2));

                        // PlanarFreehandROI has multiple points defining the freehand shape
                        const freehandHandles: any = {};
                        if (points.length > 0) {
                            freehandHandles.points = points.map(pt => createHandle(pt));
                        }

                        // Extract the actual cachedStats from the measurement data
                        const actualFreehandCachedStats = m.data?.cachedStats || {};
                        console.log('Export: Actual PlanarFreehandROI cachedStats being exported:', actualFreehandCachedStats);

                        base.data = {
                            cachedStats: actualFreehandCachedStats,
                            handles: freehandHandles,
                        };

                        // Add all available PlanarFreehandROI measurements
                        if (freehandAreaVal > 0) {
                            base.measurements.push({ name: 'area', value: Number(freehandAreaVal), unit: 'mm²' });
                        }
                        if (freehandMeanVal !== 0) {
                            base.measurements.push({ name: 'mean', value: Number(freehandMeanVal), unit: '' });
                        }
                        if (freehandStdDevVal !== 0) {
                            base.measurements.push({ name: 'stdDev', value: Number(freehandStdDevVal), unit: '' });
                        }
                        if (freehandMinVal !== 0) {
                            base.measurements.push({ name: 'min', value: Number(freehandMinVal), unit: '' });
                        }
                        if (freehandMaxVal !== 0) {
                            base.measurements.push({ name: 'max', value: Number(freehandMaxVal), unit: '' });
                        }
                        break;
                    case 'SplineROI':
                        console.log('Export: SplineROI measurement:', m);
                        console.log('Export: SplineROI points:', points);
                        console.log('Export: SplineROI data:', m.data);

                        // Extract area and other stats from cachedStats or displayText
                        let splineAreaVal = 0;
                        let splineMeanVal = 0;
                        let splineStdDevVal = 0;
                        let splineMinVal = 0;
                        let splineMaxVal = 0;

                        if (m.data?.cachedStats) {
                            // Get stats from cachedStats (the standard OHIF structure)
                            const stats = Object.values(m.data.cachedStats)[0] as any;
                            splineAreaVal = stats?.area || 0;
                            splineMeanVal = stats?.mean || 0;
                            splineStdDevVal = stats?.stdDev || 0;
                            splineMinVal = stats?.min || 0;
                            splineMaxVal = stats?.max || 0;
                        } else if (m.displayText?.primary?.length > 0) {
                            // Fallback: parse from displayText
                            const primaryText = m.displayText.primary[0];
                            const areaMatch = primaryText.match(/([0-9.]+)\s*mm²/);
                            if (areaMatch) {
                                splineAreaVal = parseFloat(areaMatch[1]);
                            }
                        }

                        console.log('Export: extracted SplineROI values:', {
                            area: splineAreaVal,
                            mean: splineMeanVal,
                            stdDev: splineStdDevVal,
                            min: splineMinVal,
                            max: splineMaxVal
                        }, 'from measurement:', m);
                        console.log('Export: Full SplineROI measurement object:', JSON.stringify(m, null, 2));

                        // SplineROI has multiple points defining the spline curve
                        const splineHandles: any = {};
                        if (points.length > 0) {
                            splineHandles.points = points.map(pt => createHandle(pt));
                        }

                        // Extract the actual cachedStats from the measurement data
                        const actualSplineCachedStats = m.data?.cachedStats || {};
                        console.log('Export: Actual SplineROI cachedStats being exported:', actualSplineCachedStats);

                        base.data = {
                            cachedStats: actualSplineCachedStats,
                            handles: splineHandles,
                        };

                        // Add all available SplineROI measurements
                        if (splineAreaVal > 0) {
                            base.measurements.push({ name: 'area', value: Number(splineAreaVal), unit: 'mm²' });
                        }
                        if (splineMeanVal !== 0) {
                            base.measurements.push({ name: 'mean', value: Number(splineMeanVal), unit: '' });
                        }
                        if (splineStdDevVal !== 0) {
                            base.measurements.push({ name: 'stdDev', value: Number(splineStdDevVal), unit: '' });
                        }
                        if (splineMinVal !== 0) {
                            base.measurements.push({ name: 'min', value: Number(splineMinVal), unit: '' });
                        }
                        if (splineMaxVal !== 0) {
                            base.measurements.push({ name: 'max', value: Number(splineMaxVal), unit: '' });
                        }
                        break;
                    case 'LivewireContour':
                        console.log('Export: LivewireContour measurement:', m);
                        console.log('Export: LivewireContour points:', points);
                        console.log('Export: LivewireContour data:', m.data);

                        // Extract area and other stats from cachedStats or displayText
                        let livewireAreaVal = 0;
                        let livewireMeanVal = 0;
                        let livewireStdDevVal = 0;
                        let livewireMinVal = 0;
                        let livewireMaxVal = 0;

                        if (m.data?.cachedStats) {
                            // Get stats from cachedStats (the standard OHIF structure)
                            const stats = Object.values(m.data.cachedStats)[0] as any;
                            livewireAreaVal = stats?.area || 0;
                            livewireMeanVal = stats?.mean || 0;
                            livewireStdDevVal = stats?.stdDev || 0;
                            livewireMinVal = stats?.min || 0;
                            livewireMaxVal = stats?.max || 0;
                        } else if (m.displayText?.primary?.length > 0) {
                            // Fallback: parse from displayText
                            const primaryText = m.displayText.primary[0];
                            const areaMatch = primaryText.match(/([0-9.]+)\s*mm²/);
                            if (areaMatch) {
                                livewireAreaVal = parseFloat(areaMatch[1]);
                            }
                        }

                        console.log('Export: extracted LivewireContour values:', {
                            area: livewireAreaVal,
                            mean: livewireMeanVal,
                            stdDev: livewireStdDevVal,
                            min: livewireMinVal,
                            max: livewireMaxVal
                        }, 'from measurement:', m);
                        console.log('Export: Full LivewireContour measurement object:', JSON.stringify(m, null, 2));

                        // LivewireContour has multiple points defining the contour
                        const livewireHandles: any = {};
                        if (points.length > 0) {
                            livewireHandles.points = points.map(pt => createHandle(pt));
                        }

                        // Extract the actual cachedStats from the measurement data
                        const actualLivewireCachedStats = m.data?.cachedStats || {};
                        console.log('Export: Actual LivewireContour cachedStats being exported:', actualLivewireCachedStats);

                        base.data = {
                            cachedStats: actualLivewireCachedStats,
                            handles: livewireHandles,
                        };

                        // Add all available LivewireContour measurements
                        if (livewireAreaVal > 0) {
                            base.measurements.push({ name: 'area', value: Number(livewireAreaVal), unit: 'mm²' });
                        }
                        if (livewireMeanVal !== 0) {
                            base.measurements.push({ name: 'mean', value: Number(livewireMeanVal), unit: '' });
                        }
                        if (livewireStdDevVal !== 0) {
                            base.measurements.push({ name: 'stdDev', value: Number(livewireStdDevVal), unit: '' });
                        }
                        if (livewireMinVal !== 0) {
                            base.measurements.push({ name: 'min', value: Number(livewireMinVal), unit: '' });
                        }
                        if (livewireMaxVal !== 0) {
                            base.measurements.push({ name: 'max', value: Number(livewireMaxVal), unit: '' });
                        }
                        break;
                    default:
                        console.log(`🔍 DEBUG: No specific case for tool type: ${base.toolType}, using default`);
                        base.data = {};
                }

                return base;
            };

            const imageMeasurements = measurements.map(buildMeasurementObject);

            const measurementCollection = {
                uuid: DicomMetaDictionary.uid(),
                name: userLabel.substring(0, 64),
                description: '',
                created: formatDateTime(new Date()),
                modified: '',
                revision: 1,
                user: { name: '', loginName: '' },
                subject: { name: '', id: '', birthDate: '' },
                equipment: {
                    manufacturerName: displaySet.Manufacturer || '',
                    manufacturerModelName: 'XNAT-OHIF-Viewer',
                    softwareVersion: '',
                },
                imageReference: {
                    PatientID: displaySet.PatientID || '',
                    StudyInstanceUID: studyInstanceUID,
                    SeriesInstanceUID: seriesInstanceUID,
                    Modality: displaySet.Modality || '',
                    imageCollection,
                },
                imageMeasurements, // array built above
            } as any;

            console.log("Complete measurement collection JSON:", JSON.stringify(measurementCollection, null, 2));
            console.log("Export: Collection name:", userLabel);
            console.log("Export: Experiment ID:", experimentId);

            const jsonBlob = new Blob([JSON.stringify(measurementCollection)], {
                type: 'application/octet-stream',
            });

            const exporter = new JSONMeasurementExporter(
                jsonBlob,
                seriesInstanceUID,
                userLabel,
                experimentId
            );

            // Export to XNAT with retry logic for overwrite
            let exportSuccessful = false;
            let attempts = 0;
            const maxAttempts = 2;

            while (!exportSuccessful && attempts < maxAttempts) {
                try {
                    const shouldOverwrite = attempts > 0;
                    await exporter.exportToXNAT(shouldOverwrite);
                    exportSuccessful = true;

                    uiNotificationService.show({
                        title: 'Export Successful',
                        message: `Measurement collection "${userLabel}" exported to XNAT successfully`,
                        type: 'success',
                        duration: 3000,
                    });
                } catch (error) {
                    attempts++;

                    if ((error as any).isCollectionExistsError && attempts === 1) {
                        const shouldOverwrite = window.confirm(
                            `A measurement collection named "${userLabel}" already exists in XNAT. Overwrite?`
                        );

                        if (!shouldOverwrite) {
                            uiNotificationService.show({
                                title: 'Export Cancelled',
                                message: `Export of "${userLabel}" cancelled by user.`,
                                type: 'info',
                                duration: 3000,
                            });
                            return;
                        }
                    } else {
                        uiNotificationService.show({
                            title: 'Export Failed',
                            message: `Failed to export measurements: ${error.message}`,
                            type: 'error',
                            duration: 5000,
                        });
                        throw error;
                    }
                }
            }
        },

        XNATImportMeasurements: async () => {
            const { UIModalService, viewportGridService, displaySetService, uiNotificationService } =
                servicesManager.services;
            const { activeViewportId, viewports } = viewportGridService.getState();

            if (!activeViewportId) {
                uiNotificationService.show({
                    title: 'Import Measurements',
                    message: 'No active viewport found.',
                    type: 'error',
                });
                return;
            }

            const activeViewport = viewports.get(activeViewportId);
            const displaySetInstanceUID = activeViewport.displaySetInstanceUIDs[0];
            const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
            const { StudyInstanceUID: studyInstanceUID, SeriesInstanceUID: seriesInstanceUID } = displaySet;

            UIModalService.show({
                content: MeasurementImportMenu,
                title: 'Import Measurements from XNAT',
                contentProps: {
                    studyInstanceUID,
                    seriesInstanceUID,
                    servicesManager,
                    commandsManager,
                    onClose: UIModalService.hide,
                },
            });
        },
    };

    return actions;
};
