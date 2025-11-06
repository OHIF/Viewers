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

    };

    return actions;
};
