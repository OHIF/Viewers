import { Types } from '@ohif/core';
import { utilities as csUtils, Enums } from '@cornerstonejs/tools';
import { adaptersSEG, helpers } from '@cornerstonejs/adapters';
import { cache, metaData } from '@cornerstonejs/core';
import { segmentation as cornerstoneToolsSegmentation } from '@cornerstonejs/tools';
import dcmjs from 'dcmjs';
import DICOMSEGExporter from '../utils/IO/classes/DICOMSEGExporter';
import sessionMap from '../utils/sessionMap';
import { getTargetViewport } from './helpers';

const { segmentation: segmentationUtils } = csUtils;
const { datasetToBlob } = dcmjs.data;

const {
    Cornerstone3D: {
        Segmentation: { generateSegmentation },
    },
} = adaptersSEG;

const { downloadDICOMData } = helpers;

export const createSegmentationCommands = (
    servicesManager: any,
    commandsManager?: any
) => {
    const {
        segmentationService,
        uiNotificationService,
        viewportGridService,
        displaySetService,
    } = servicesManager.services;

    const actions = {
        /**
         * Loads segmentations for a specified viewport.
         * The function prepares the viewport for rendering, then loads the segmentation details.
         * Additionally, if the segmentation has scalar data, it is set for the corresponding label map volume.
         *
         * @param {Object} params - Parameters for the function.
         * @param params.segmentations - Array of segmentations to be loaded.
         * @param params.viewportId - the target viewport ID.
         *
         */
        loadSegmentationsForViewport: async ({ segmentations, viewportId }) => {
            // Todo: handle adding more than one segmentation
            const viewport = getTargetViewport({ viewportId, viewportGridService });
            const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];

            const segmentation = segmentations[0];
            const segmentationId = segmentation.segmentationId;
            const label = segmentation.config.label;
            const segments = segmentation.config.segments;

            const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

            await segmentationService.createLabelmapForDisplaySet(displaySet, {
                segmentationId,
                segments,
                label,
            });

            segmentationService.addOrUpdateSegmentation(segmentation);

            await segmentationService.addSegmentationRepresentation(viewport.viewportId, {
                segmentationId,
            });

            return segmentationId;
        },

        /**
         * Creates a labelmap for the active viewport using modern OHIF segmentation service
         */
        createLabelmapForViewport: async ({ viewportId, options = {} }) => {
            const { viewportGridService, displaySetService, segmentationService } =
                servicesManager.services;
            const { viewports } = viewportGridService.getState();
            const targetViewportId = viewportId;

            const viewport = viewports.get(targetViewportId);

            // Todo: add support for multiple display sets
            const displaySetInstanceUID =
                (options as any).displaySetInstanceUID || viewport.displaySetInstanceUIDs[0];

            const segs = segmentationService.getSegmentations();

            const label = (options as any).label || `Segmentation ${segs.length + 1}`;
            const segmentationId = (options as any).segmentationId || `seg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

            const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);

            const generatedSegmentationId = await segmentationService.createLabelmapForDisplaySet(
                displaySet,
                {
                    label,
                    segmentationId,
                    segments: (options as any).createInitialSegment
                        ? {
                            1: {
                                label: 'Segment 1',
                                active: true,
                            },
                        }
                        : {},
                }
            );

            await segmentationService.addSegmentationRepresentation(viewportId, {
                segmentationId,
                type: Enums.SegmentationRepresentations.Labelmap,
            });

            return generatedSegmentationId;
        },

        /**
         * Generates a DICOM SEG dataset from a segmentation
         * Uses a more robust approach that works with XNAT segmentation structure
         */
        generateSegmentation: ({ segmentationId, options = {} }) => {
            try {
                // Get segmentation from both sources to ensure compatibility
                const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
                const cornerstoneSegmentation = cornerstoneToolsSegmentation.state.getSegmentation(segmentationId);

                if (!segmentationInOHIF || !cornerstoneSegmentation) {
                    throw new Error('Segmentation not found');
                }

                // Get the labelmap representation data
                const { representationData } = cornerstoneSegmentation;
                const labelmapData = representationData.Labelmap;

                if (!labelmapData) {
                    throw new Error('No labelmap data found in segmentation');
                }

                // Get image IDs - handle both volumeId and imageIds cases
                let imageIds = [];
                if ('imageIds' in labelmapData && labelmapData.imageIds) {
                    imageIds = labelmapData.imageIds;
                } else if ('volumeId' in labelmapData && labelmapData.volumeId) {
                    // Get imageIds from volume cache
                    const volume = cache.getVolume(labelmapData.volumeId);
                    if (volume && volume.imageIds) {
                        imageIds = volume.imageIds;
                    }
                }

                if (!imageIds || imageIds.length === 0) {
                    throw new Error('No image IDs found for segmentation');
                }

                const segImages = imageIds.map(imageId => cache.getImage(imageId));
                const referencedImages = segImages.map(image => cache.getImage(image.referencedImageId));

                const labelmaps2D = [];
                let z = 0;

                for (const segImage of segImages) {
                    const segmentsOnLabelmap = new Set();
                    const pixelData = segImage.getPixelData();
                    const { rows, columns } = segImage;

                    // Use a single pass through the pixel data
                    for (let i = 0; i < pixelData.length; i++) {
                        const segment = pixelData[i];
                        if (segment !== 0) {
                            segmentsOnLabelmap.add(segment);
                        }
                    }

                    labelmaps2D[z++] = {
                        segmentsOnLabelmap: Array.from(segmentsOnLabelmap),
                        pixelData,
                        rows,
                        columns,
                    };
                }

                const allSegmentsOnLabelmap = labelmaps2D.map(labelmap => labelmap.segmentsOnLabelmap);

                const labelmap3D = {
                    segmentsOnLabelmap: Array.from(new Set(allSegmentsOnLabelmap.flat())),
                    metadata: [],
                    labelmaps2D,
                };

                // Get representations for color information
                const representations = segmentationService.getRepresentationsForSegmentation(segmentationId);

                // Build segment metadata
                Object.entries(segmentationInOHIF.segments || {}).forEach(([segmentIndex, segment]) => {
                    if (!segment) {
                        return;
                    }
                    const segmentLabel = (segment as any).label || `Segment ${segmentIndex}`;

                    // Get color information
                    let color = [255, 0, 0]; // Default red
                    if (representations && representations.length > 0) {
                        try {
                            color = segmentationService.getSegmentColor(
                                representations[0].viewportId,
                                segmentationId,
                                parseInt(segmentIndex)
                            );
                        } catch (e) {
                            console.warn('Could not get segment color, using default');
                        }
                    }

                    const RecommendedDisplayCIELabValue = dcmjs.data.Colors.rgb2DICOMLAB(
                        color.slice(0, 3).map(value => value / 255)
                    ).map(value => Math.round(value));

                    const segmentMetadata = {
                        SegmentNumber: segmentIndex.toString(),
                        SegmentLabel: segmentLabel,
                        SegmentAlgorithmType: 'MANUAL',
                        SegmentAlgorithmName: 'OHIF Brush',
                        RecommendedDisplayCIELabValue,
                        SegmentedPropertyCategoryCodeSequence: {
                            CodeValue: 'T-D0050',
                            CodingSchemeDesignator: 'SRT',
                            CodeMeaning: 'Tissue',
                        },
                        SegmentedPropertyTypeCodeSequence: {
                            CodeValue: 'T-D0050',
                            CodingSchemeDesignator: 'SRT',
                            CodeMeaning: 'Tissue',
                        },
                    };
                    labelmap3D.metadata[segmentIndex] = segmentMetadata;
                });

                const generatedSegmentation = generateSegmentation(
                    referencedImages,
                    labelmap3D,
                    metaData,
                    options
                );

                return generatedSegmentation;
            } catch (error) {
                console.error('Error generating segmentation:', error);
                throw new Error(`Failed to generate segmentation dataset: ${error.message}`);
            }
        },

        /**
         * Downloads a segmentation based on the provided segmentation ID.
         * This function retrieves the associated segmentation and
         * uses it to generate the corresponding DICOM dataset, which
         * is then downloaded with an appropriate filename.
         *
         * @param {Object} params - Parameters for the function.
         * @param params.segmentationId - ID of the segmentation to be downloaded.
         *
         */
        downloadSegmentation: ({ segmentationId }) => {
            const segmentationInOHIF = segmentationService.getSegmentation(segmentationId);
            const generatedSegmentation = actions.generateSegmentation({
                segmentationId,
            });

            downloadDICOMData(generatedSegmentation.dataset, `${segmentationInOHIF.label}`);
        },

        /**
         * Stores a segmentation to XNAT using the existing DICOMSEGExporter
         */
        XNATStoreSegmentation: async ({ segmentationId }) => {
            const segmentation = segmentationService.getSegmentation(segmentationId);

            if (!segmentation) {
                throw new Error('No segmentation found');
            }

            try {
                // Get the series instance UID from the segmentation
                const { activeViewportId } = viewportGridService.getState();
                const viewport = viewportGridService.getState().viewports.get(activeViewportId);
                const displaySetInstanceUID = viewport.displaySetInstanceUIDs[0];
                const displaySet = displaySetService.getDisplaySetByUID(displaySetInstanceUID);
                const seriesInstanceUID = displaySet.SeriesInstanceUID;

                // Create default label for the export
                const defaultLabel = segmentation.label || `Segmentation_${Date.now()}`;

                // Function to sanitize label for XNAT (remove special characters)
                const sanitizeLabel = (label) => {
                    return label.replace(/[^a-zA-Z0-9_-]/g, '_');
                };

                // Show dialog to get user input for segmentation label
                const userLabel = await new Promise((resolve) => {
                    // Use a simple prompt for now since the dialog service API has changed
                    const promptMessage = `Enter a name for the segmentation export to XNAT.\nOnly letters, numbers, underscores, and hyphens are allowed.\n\nCurrent name: ${sanitizeLabel(defaultLabel)}`;

                    const userInput = window.prompt(promptMessage, sanitizeLabel(defaultLabel));

                    if (userInput === null) {
                        // User cancelled
                        resolve(null);
                    } else if (userInput.trim() === '') {
                        // Empty input, use default
                        resolve(sanitizeLabel(defaultLabel));
                    } else {
                        // Sanitize user input
                        const sanitizedInput = sanitizeLabel(userInput.trim());
                        resolve(sanitizedInput);
                    }
                });

                // If user cancelled, exit early
                if (!userLabel) {
                    return;
                }

                // Generate the DICOM SEG dataset
                const generatedData = actions.generateSegmentation({
                    segmentationId,
                });
                if (!generatedData || !generatedData.dataset) {
                    throw new Error('Error during segmentation generation');
                }

                // Convert dataset to blob
                const segBlob = datasetToBlob(generatedData.dataset);

                // Try multiple approaches to get the experiment ID
                let experimentId = null;

                // 1. Try to get from sessionRouter service if available
                const { sessionRouter } = servicesManager.services;
                if (sessionRouter && sessionRouter.experimentId) {
                    experimentId = sessionRouter.experimentId;
                }

                // 2. Try to get from sessionStorage
                if (!experimentId && window.sessionStorage) {
                    experimentId = window.sessionStorage.getItem('xnat_experimentId');
                }

                // 3. Try to get from sessionMap using series UID
                if (!experimentId) {
                    experimentId = sessionMap.getExperimentID(seriesInstanceUID);
                }

                // 4. Try to get from sessionMap without series UID (single session case)
                if (!experimentId) {
                    experimentId = sessionMap.getExperimentID();
                }

                // 5. Try to get from study session data
                if (!experimentId) {
                    const sessionData = sessionMap.get(displaySet.StudyInstanceUID);
                    if (sessionData && sessionData.experimentId) {
                        experimentId = sessionData.experimentId;
                    }
                }

                // Use the existing XNAT DICOMSEGExporter with the experiment ID and user-provided label
                const exporter = new DICOMSEGExporter(segBlob, seriesInstanceUID, userLabel, experimentId);

                // Export to XNAT with retry logic for overwrite
                let exportSuccessful = false;
                let attempts = 0;
                const maxAttempts = 2;

                while (!exportSuccessful && attempts < maxAttempts) {
                    try {
                        const shouldOverwrite = attempts > 0; // First attempt without overwrite, second with overwrite
                        await exporter.exportToXNAT(shouldOverwrite);
                        exportSuccessful = true;

                        // Show success notification
                        uiNotificationService.show({
                            title: 'Export Successful',
                            message: `Segmentation "${userLabel}" exported to XNAT successfully`,
                            type: 'success',
                            duration: 3000,
                        });

                    } catch (error) {
                        attempts++;

                        // Check if this is a collection exists error and we haven't tried overwrite yet
                        if ((error as any).isCollectionExistsError && attempts === 1) {
                            const shouldOverwrite = window.confirm(
                                `A segmentation collection named "${userLabel}" already exists in XNAT.\n\n` +
                                `Do you want to overwrite it?\n\n` +
                                `Click "OK" to overwrite or "Cancel" to abort the export.`
                            );

                            if (!shouldOverwrite) {
                                // User chose not to overwrite, exit
                                uiNotificationService.show({
                                    title: 'Export Cancelled',
                                    message: `Export cancelled by user - collection "${userLabel}" already exists`,
                                    type: 'info',
                                    duration: 3000,
                                });
                                return;
                            }
                            // Continue to next attempt with overwrite=true
                        } else {
                            // Either not a collection exists error, or user already tried overwrite, or other error
                            throw error;
                        }
                    }
                }

            } catch (error) {
                console.error('Error exporting segmentation to XNAT:', error);
                uiNotificationService.show({
                    title: 'Export Failed',
                    message: `Failed to export segmentation to XNAT: ${error.message}`,
                    type: 'error',
                    duration: 5000,
                });
                throw error;
            }
        },

        /**
         * Downloads RTSS - simplified version
         */
        downloadRTSS: async ({ segmentationId }) => {
            const segmentation = segmentationService.getSegmentation(segmentationId);

            if (!segmentation) {
                throw new Error('No segmentation found');
            }

            // For now, just download as DICOM SEG
            // TODO: Implement RTSS conversion
            actions.downloadSegmentation({ segmentationId });
        },

        /**
         * Downloads CSV segmentation report
         */
        downloadCSVSegmentationReport: ({ segmentationId }) => {
            const segmentation = segmentationService.getSegmentation(segmentationId);

            if (!segmentation) {
                throw new Error('No segmentation found');
            }

            const { representationData } = segmentation;
            const { Labelmap } = representationData;
            const { referencedImageIds } = Labelmap;

            const firstImageId = referencedImageIds[0];

            // find displaySet for firstImageId
            const displaySet = displaySetService
                .getActiveDisplaySets()
                .find(ds => ds.imageIds?.some(i => i === firstImageId));


            const {
                SeriesNumber,
                SeriesInstanceUID,
                StudyInstanceUID,
                SeriesDate,
                SeriesTime,
                SeriesDescription,
            } = displaySet;

            const additionalInfo = {
                reference: {
                    SeriesNumber,
                    SeriesInstanceUID,
                    StudyInstanceUID,
                    SeriesDate,
                    SeriesTime,
                    SeriesDescription,
                },
            };

            actions.generateSegmentationCSVReport(segmentation, additionalInfo);
        },

        /**
         * Generates CSV report for segmentation
         */
        generateSegmentationCSVReport: (segmentationData, info) => {
            // Initialize the rows for our CSV
            const csvRows = [];

            // Add segmentation-level information
            csvRows.push(['Segmentation ID', segmentationData.segmentationId || '']);
            csvRows.push(['Segmentation Label', segmentationData.label || '']);

            csvRows.push([]);

            const additionalInfo = info.reference;
            // Add reference information
            const referenceKeys = [
                ['Series Number', additionalInfo.SeriesNumber],
                ['Series Instance UID', additionalInfo.SeriesInstanceUID],
                ['Study Instance UID', additionalInfo.StudyInstanceUID],
                ['Series Date', additionalInfo.SeriesDate],
                ['Series Time', additionalInfo.SeriesTime],
                ['Series Description', additionalInfo.SeriesDescription],
            ];

            referenceKeys.forEach(([key, value]) => {
                if (value) {
                    csvRows.push([`reference ${key}`, value]);
                }
            });

            // Add a blank row for separation
            csvRows.push([]);

            csvRows.push(['Segments Statistics']);
            // Add segment information in columns
            if (segmentationData.segments) {
                // First row: Segment headers
                const segmentHeaderRow = ['Label'];
                for (const segmentId in segmentationData.segments) {
                    const segment = segmentationData.segments[segmentId];
                    segmentHeaderRow.push(`${(segment as any).label || ''}`);
                }
                csvRows.push(segmentHeaderRow);

                // Add segment properties
                csvRows.push([
                    'Segment Index',
                    ...Object.values(segmentationData.segments).map((s: any) => s.segmentIndex || ''),
                ]);
                csvRows.push([
                    'Locked',
                    ...Object.values(segmentationData.segments).map((s: any) => (s.locked ? 'Yes' : 'No')),
                ]);
                csvRows.push([
                    'Active',
                    ...Object.values(segmentationData.segments).map((s: any) => (s.active ? 'Yes' : 'No')),
                ]);

                // Add segment statistics
                // First, collect all unique statistics across all segments
                const allStats = new Set();
                for (const segment of Object.values(segmentationData.segments) as any[]) {
                    if (segment.cachedStats && segment.cachedStats.namedStats) {
                        for (const statKey in segment.cachedStats.namedStats) {
                            const stat = segment.cachedStats.namedStats[statKey];
                            const statLabel = stat.label || stat.name;
                            const statUnit = stat.unit ? ` (${stat.unit})` : '';
                            allStats.add(`${statLabel}${statUnit}`);
                        }
                    }
                }

                // Then create a row for each statistic
                for (const statName of allStats) {
                    const statRow = [statName];

                    for (const segment of Object.values(segmentationData.segments) as any[]) {
                        let statValue = '';

                        if (segment.cachedStats && segment.cachedStats.namedStats) {
                            for (const statKey in segment.cachedStats.namedStats) {
                                const stat = segment.cachedStats.namedStats[statKey];
                                const currentStatName = `${stat.label || stat.name}${stat.unit ? ` (${stat.unit})` : ''}`;


                                if (currentStatName === statName) {
                                    statValue = stat.value !== undefined ? stat.value : '';
                                    break;
                                }
                            }
                        }

                        statRow.push(statValue);
                    }

                    csvRows.push(statRow);
                }
            }

            // Convert to CSV string
            let csvString = '';
            for (const row of csvRows) {
                const formattedRow = row.map(cell => {
                    // Handle values that need to be quoted (contain commas, quotes, or newlines)
                    const cellValue = cell !== undefined && cell !== null ? cell.toString() : '';
                    if (cellValue.includes(',') || cellValue.includes('"') || cellValue.includes('\n')) {
                        // Escape quotes and wrap in quotes
                        return '"' + cellValue.replace(/"/g, '""') + '"';
                    }
                    return cellValue;
                });
                csvString += formattedRow.join(',') + '\n';
            }
            // Create a download link and trigger the download
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');

            link.setAttribute('href', url);
            link.setAttribute(
                'download',
                `${segmentationData.label || 'Segmentation'}_Report_${new Date().toISOString().split('T')[0]}.csv`
            );
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        // Segmentation Tool Commands
        setBrushSize: ({ value, toolNames }) => {
            const { toolGroupService } = servicesManager.services;
            const brushSize = Number(value);

            toolGroupService.getToolGroupIds()?.forEach(toolGroupId => {
                if (toolNames?.length === 0) {
                    segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize);
                } else {
                    toolNames?.forEach(toolName => {
                        segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize, toolName);
                    });
                }
            });
        },

        setThresholdRange: ({
            value,
            toolNames = [
                'ThresholdCircularBrush',
                'ThresholdSphereBrush',
                'ThresholdCircularBrushDynamic',
                'ThresholdSphereBrushDynamic',
            ],
        }) => {
            const { toolGroupService } = servicesManager.services;
            const toolGroupIds = toolGroupService.getToolGroupIds();
            if (!toolGroupIds?.length) {
                return;
            }

            for (const toolGroupId of toolGroupIds) {
                const toolGroup = toolGroupService.getToolGroup(toolGroupId);
                toolNames?.forEach(toolName => {
                    toolGroup.setToolConfiguration(toolName, {
                        threshold: {
                            range: value,
                        },
                    });
                });
            }
        },

        increaseBrushSize: () => {
            const { toolGroupService } = servicesManager.services;
            const toolGroupIds = toolGroupService.getToolGroupIds();
            if (!toolGroupIds?.length) {
                return;
            }

            for (const toolGroupId of toolGroupIds) {
                const currentBrushSize = segmentationUtils.getBrushSizeForToolGroup(toolGroupId);
                // Handle case where getBrushSizeForToolGroup might return undefined
                const brushSize = typeof currentBrushSize === 'number' ? currentBrushSize : 25;
                segmentationUtils.setBrushSizeForToolGroup(toolGroupId, brushSize + 3);
            }
        },

        decreaseBrushSize: () => {
            const { toolGroupService } = servicesManager.services;
            const toolGroupIds = toolGroupService.getToolGroupIds();
            if (!toolGroupIds?.length) {
                return;
            }

            for (const toolGroupId of toolGroupIds) {
                const currentBrushSize = segmentationUtils.getBrushSizeForToolGroup(toolGroupId);
                // Handle case where getBrushSizeForToolGroup might return undefined
                const brushSize = typeof currentBrushSize === 'number' ? currentBrushSize : 25;
                segmentationUtils.setBrushSizeForToolGroup(toolGroupId, Math.max(1, brushSize - 3));
            }
        },

        addNewSegment: () => {
            const { activeViewportId } = viewportGridService.getState();
            const activeSegmentation = segmentationService.getActiveSegmentation(activeViewportId);
            segmentationService.addSegment(activeSegmentation.segmentationId);
        },

        xnatRunSegmentBidirectional: async () => {
            try {
                await commandsManager.runCommand('runSegmentBidirectional');
            } catch (error) {
                if (error.message.includes('No suitable viewport found')) {
                    uiNotificationService.show({
                        title: 'Segment Bidirectional',
                        message: 'Measurement created, but no suitable viewport was found to display it.',
                        type: 'info',
                    });
                } else {
                    console.error('Error running Segment Bidirectional:', error);
                    uiNotificationService.show({
                        title: 'Segment Bidirectional',
                        message:
                            'Could not compute bidirectional data for the segment. The segmented area may be too small.',
                        type: 'error',
                    });
                }
            }
        },

        /**
         * Safe override of setActiveSegmentAndCenter that avoids crashes when segment center is undefined
         */
        setActiveSegmentAndCenter: ({ segmentationId, segmentIndex }) => {
            const { segmentationService, viewportGridService } = servicesManager.services;
            const viewportId = viewportGridService.getActiveViewportId();

            // Set both active segmentation and active segment
            segmentationService.setActiveSegmentation(viewportId, segmentationId);
            segmentationService.setActiveSegment(segmentationId, segmentIndex);

            // Safely attempt to jump to segment center, but catch any errors
            try {
                // Check if the segmentation and segment exist before attempting to jump
                const segmentation = segmentationService.getSegmentation(segmentationId);
                if (segmentation && segmentation.segments && segmentation.segments[segmentIndex]) {
                    const segment = segmentation.segments[segmentIndex];
                    // Only attempt jump if we have cached stats with center data
                    if (segment.cachedStats && (segment.cachedStats.center || segment.cachedStats.namedStats?.center?.value)) {
                        segmentationService.jumpToSegmentCenter(segmentationId, segmentIndex);
                    } else {
                        console.log('XNAT: Segment center not available, skipping jump to center');
                    }
                }
            } catch (error) {
                console.warn('XNAT: Error jumping to segment center:', error);
                // Continue without jumping - the segment is still activated
            }
        },

        /**
         * XNAT Import Segmentation command
         */
        XNATImportSegmentation: async ({ arrayBuffer, studyInstanceUID, seriesInstanceUID }) => {
            const { importSegmentation } = await import('../utils/importSegmentation');

            try {
                const segmentationId = await importSegmentation({
                    arrayBuffer,
                    studyInstanceUID,
                    seriesInstanceUID,
                    servicesManager,
                });

                uiNotificationService.show({
                    title: 'Import Successful',
                    message: 'Segmentation imported successfully from XNAT',
                    type: 'success',
                    duration: 3000,
                });

                return segmentationId;
            } catch (error) {
                console.error('Error importing segmentation:', error);
                uiNotificationService.show({
                    title: 'Import Failed',
                    message: `Failed to import segmentation: ${error.message}`,
                    type: 'error',
                    duration: 5000,
                });
                throw error;
            }
        },
    };

    return actions;
};
