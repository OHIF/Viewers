/**
 * Main measurement commands module
 * Refactored to use extracted modules for better maintainability
 */

import { XNATStoreMeasurements } from './MeasurementExporters';
import { XNATImportMeasurements } from './MeasurementImporters';

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
        XNATStoreMeasurements: async () =>
            XNATStoreMeasurements({
                measurementService,
                uiNotificationService,
                viewportGridService,
                displaySetService,
                servicesManager,
            }),

        /**
         * Imports measurements from XNAT using a modal interface
         */
        XNATImportMeasurements: async () =>
            XNATImportMeasurements({
                UIModalService: servicesManager.services.UIModalService,
                viewportGridService,
                displaySetService,
                uiNotificationService,
            }, {
                servicesManager,
                commandsManager,
            }),
    };

    return actions;
};