/**
 * Main segmentation commands module
 * Refactored to use extracted modules for better maintainability
 */

import {
    loadSegmentationsForViewport
} from './SegmentationLoaders';

import {
    generateSegmentation
} from './SegmentationGenerators';

import {
    exportSegmentationToXNAT,
    exportSegmentationStatisticsToCSV
} from './SegmentationExporters';

import {
    calculateSegmentStatistics,
    xnatRunSegmentBidirectional
} from './SegmentationMeasurements';

import {
    setActiveSegmentAndCenter,
    XNATImportSegmentation
} from './SegmentationUtils';

export const createSegmentationCommands = (
    servicesManager: any,
    commandsManager?: any
) => {
    const {
        segmentationService,
        uiNotificationService,
        viewportGridService,
        displaySetService,
        toolGroupService,
    } = servicesManager.services;

    const actions = {
        /**
         * Loads segmentations for a specified viewport.
         */
        loadSegmentationsForViewport: async ({ segmentations, viewportId }) =>
            loadSegmentationsForViewport(
                { segmentations, viewportId },
                { segmentationService, viewportGridService }
            ),

        /**
         * Generates a DICOM SEG dataset from a segmentation
         */
        generateSegmentation: ({ segmentationId, options = {} }) =>
            generateSegmentation(
                { segmentationId, options },
                { segmentationService }
            ),

        /**
         * Exports a segmentation to XNAT
         */
        exportSegmentationToXNAT: async ({ segmentationId, seriesInstanceUID }) =>
            exportSegmentationToXNAT(
                { segmentationId, seriesInstanceUID },
                {
                    uiNotificationService,
                    servicesManager,
                    displaySet: displaySetService.getDisplaySets().find(ds =>
                        ds.SeriesInstanceUID === seriesInstanceUID
                    ),
                    segmentationService
                }
            ),

        /**
         * Exports segmentation statistics to CSV
         */
        exportSegmentationStatisticsToCSV: ({ segmentationId }) =>
            exportSegmentationStatisticsToCSV(
                { segmentationId },
                { segmentationService }
            ),

        /**
         * Calculates statistics for all segments in a segmentation
         */
        calculateSegmentStatistics: ({ segmentationId }) =>
            calculateSegmentStatistics(
                { segmentationId },
                { segmentationService, uiNotificationService, viewportGridService }
            ),

        /**
         * Runs bidirectional measurement on a segment
         */
        xnatRunSegmentBidirectional: async ({ segmentationId, segmentIndex }) =>
            xnatRunSegmentBidirectional(
                { segmentationId, segmentIndex },
                { segmentationService, uiNotificationService, viewportGridService }
            ),

        /**
         * Safe override of setActiveSegmentAndCenter
         */
        setActiveSegmentAndCenter: ({ segmentationId, segmentIndex }) =>
            setActiveSegmentAndCenter(
                { segmentationId, segmentIndex },
                { segmentationService, viewportGridService }
            ),

        /**
         * XNAT Import Segmentation command
         */
        XNATImportSegmentation: async ({ arrayBuffer, studyInstanceUID, seriesInstanceUID }) =>
            XNATImportSegmentation(
                { arrayBuffer, studyInstanceUID, seriesInstanceUID, servicesManager },
                { uiNotificationService }
            ),

        /**
         * Set marker mode (include / exclude) for MarkerLabelmap via toolbar option.
         */
        setMarkerModeForMarkerLabelmap: ({ value }) => {
            if (!commandsManager) {
                return;
            }

            const toolName = value === 'markerInclude' ? 'MarkerInclude' : 'MarkerExclude';
            console.log('[XNAT setMarkerModeForMarkerLabelmap]', { value, toolName });
            commandsManager.run('setToolActive', {
                toolName,
            });
        },

        /**
         * Update shape for threshold brush tool (circle / sphere).
         */
        setThresholdShape: ({ value }) => {
            if (!commandsManager) {
                return;
            }

            const toolName = value;
            console.log('[XNAT setThresholdShape]', { value, toolName });
            commandsManager.run('setToolActive', {
                toolName,
            });
        },

        /**
         * Update threshold mode (Dynamic / Range) and apply range if needed.
         */
        setThresholdMode: ({ value, options }) => {
            if (!commandsManager) {
                return;
            }

            const allOptions = (options || []) as any[];
            const thresholdShapeOption = allOptions.find(
                option => option.id === 'threshold-shape'
            );

            if (!thresholdShapeOption) {
                return;
            }

            console.log('[XNAT setThresholdMode]', {
                value,
                shape: thresholdShapeOption.value,
                optionsIds: allOptions.map(o => o?.id),
            });

            if (value === 'ThresholdDynamic') {
                const dynamicToolName =
                    thresholdShapeOption.value === 'ThresholdCircularBrush'
                        ? 'ThresholdCircularBrushDynamic'
                        : 'ThresholdSphereBrushDynamic';

                commandsManager.run('setToolActiveToolbar', {
                    toolName: dynamicToolName,
                });
            } else {
                commandsManager.run('setToolActiveToolbar', {
                    toolName: thresholdShapeOption.value,
                });

                const thresholdRangeOption = allOptions.find(
                    option => option.id === 'threshold-range'
                );
                const thresholdRangeValue = thresholdRangeOption?.value;

                console.log('[XNAT setThresholdMode -> xnatSetThresholdRange]', {
                    value,
                    shape: thresholdShapeOption.value,
                    thresholdRangeValue,
                });

                commandsManager.run('xnatSetThresholdRange', {
                    toolNames: ['ThresholdCircularBrush', 'ThresholdSphereBrush'],
                    value: thresholdRangeValue,
                });
            }
        },

        /**
         * Set threshold range for threshold brush tools, scoped to tool groups
         * that actually contain those tools (XNAT-specific override).
         */
        xnatSetThresholdRange: ({
            value,
            toolNames = [
                'ThresholdCircularBrush',
                'ThresholdSphereBrush',
                'ThresholdCircularBrushDynamic',
                'ThresholdSphereBrushDynamic',
            ],
        }) => {
            const toolGroupIds = toolGroupService?.getToolGroupIds?.();
            if (!toolGroupIds?.length) {
                return;
            }

            console.log('[XNAT xnatSetThresholdRange]', {
                value,
                toolNames,
                toolGroupIds,
            });

            for (const toolGroupId of toolGroupIds) {
                const toolGroup = toolGroupService.getToolGroup(toolGroupId);
                if (!toolGroup) {
                    continue;
                }

                // Only apply to the segmentation-capable tool groups that we know
                // should have the threshold tools configured.
                if (toolGroup.id !== 'default' && toolGroup.id !== 'mpr') {
                    continue;
                }

                toolNames?.forEach(toolName => {
                    if (!toolGroup.hasTool(toolName)) {
                        console.log('[XNAT xnatSetThresholdRange] tool missing in group', {
                            toolGroupId: toolGroup.id,
                            toolName,
                        });
                        return;
                    }

                    console.log('[XNAT xnatSetThresholdRange] applying config', {
                        toolGroupId: toolGroup.id,
                        toolName,
                        value,
                    });

                    toolGroup.setToolConfiguration(toolName, {
                        threshold: {
                            range: value,
                        },
                    });
                });
            }
        },

    };

    return actions;
};
