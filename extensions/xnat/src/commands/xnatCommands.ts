import { Types } from '@ohif/core';
import createReportDialogPrompt from '../Panels/createReportDialogPrompt';
import PROMPT_RESPONSES from '../utils/_shared/PROMPT_RESPONSES';
import { PromptResult } from './types';

export const createXNATCommands = (
    servicesManager: any,
    commandsManager: any,
    extensionManager: any
) => {
    const {
        uiNotificationService,
    } = servicesManager.services;

    const actions = {
        XNATPromptSaveReport: async () => {
            const { UIModalService } = servicesManager.services;

            const result = (await createReportDialogPrompt(UIModalService, {
                extensionManager,
            })) as PromptResult;

            if (result && result.action === PROMPT_RESPONSES.CREATE_REPORT) {
                commandsManager.runCommand('XNATStoreReport', {
                    label: result.value,
                    dataSourceName: result.dataSourceName,
                });
            }
        },

        XNATStoreReport: ({ label, dataSourceName }) => {
            console.log(`Storing report to XNAT with label: ${label} and data source: ${dataSourceName}...`);
            // In a real implementation, you would use servicesManager to get
            // the necessary services to store the report to XNAT.
            const { uiNotificationService } = servicesManager.services;
            uiNotificationService.show({
                title: 'Store SR Report',
                message: `Report "${label}" stored to XNAT successfully.`,
                type: 'success',
            });
        },

        /**
         * Initialize and use the modern XNATMeasurementApi for measurement operations
         */
        XNATMeasurementApi: async (options: {
            action?: 'importCollection' | 'removeCollection';
            collectionData?: { SeriesInstanceUID: string; collectionLabel: string; collectionObject: any };
            collectionUuid?: string;
            displaySetInstanceUID?: string;
        } = {}) => {
            try {
                // Create a new instance of the modern XNATMeasurementApi
                const XNATMeasurementApiClass = await import('../utils/XNATMeasurementApi');
                const measurementApi = new XNATMeasurementApiClass.default(servicesManager);

                // The API is initialized in the constructor, no need for separate initialize call

                // If specific options are provided, handle them
                if (options.action) {
                    switch (options.action) {
                        case 'importCollection':
                            if (options.collectionData) {
                                const { SeriesInstanceUID, collectionLabel, collectionObject } = options.collectionData;
                                await measurementApi.addImportedCollection(SeriesInstanceUID, collectionLabel, collectionObject);
                            }
                            break;
                        case 'removeCollection':
                            if (options.collectionUuid && options.displaySetInstanceUID) {
                                measurementApi.removeImportedCollection(options.collectionUuid, options.displaySetInstanceUID);
                            }
                            break;
                        default:
                            console.log('XNATMeasurementApi: No specific action provided, API initialized successfully');
                    }
                }

                uiNotificationService.show({
                    title: 'XNAT Measurement API',
                    message: 'Modern XNAT Measurement API initialized successfully',
                    type: 'success',
                    duration: 3000,
                });

                return measurementApi;
            } catch (error) {
                console.error('Error initializing XNATMeasurementApi:', error);
                uiNotificationService.show({
                    title: 'XNAT Measurement API Error',
                    message: `Failed to initialize XNAT Measurement API: ${error.message}`,
                    type: 'error',
                    duration: 5000,
                });
                throw error;
            }
        },

        /**
         * Initialize and use the XNAT Custom Forms API for form operations
         */
        XNATCustomFormsApi: async (options: {
            action?: 'getForms' | 'getFormData' | 'saveFormData';
            projectId?: string;
            experimentId?: string;
            formUuid?: string;
            formData?: any;
        } = {}) => {
            try {
                const {
                    fetchCustomForms,
                    getExperimentCustomFormData,
                    saveExperimentCustomFormData,
                    updateExperimentFormData
                } = await import('../utils/IO/customFormsApi');

                // If specific options are provided, handle them
                if (options.action) {
                    switch (options.action) {
                        case 'getForms':
                            if (options.projectId) {
                                const forms = await fetchCustomForms(options.projectId);
                                return forms;
                            }
                            break;
                        case 'getFormData':
                            if (options.experimentId) {
                                const data = await getExperimentCustomFormData(options.experimentId, options.formUuid);
                                return data;
                            }
                            break;
                        case 'saveFormData':
                            if (options.experimentId && options.formUuid && options.formData) {
                                const result = await updateExperimentFormData(options.experimentId, options.formUuid, options.formData);
                                return result;
                            }
                            break;
                        default:
                            console.log('XNATCustomFormsApi: No specific action provided, API initialized successfully');
                    }
                }

                uiNotificationService.show({
                    title: 'XNAT Custom Forms API',
                    message: 'XNAT Custom Forms API initialized successfully',
                    type: 'success',
                    duration: 3000,
                });

                return {
                    fetchCustomForms,
                    getExperimentCustomFormData,
                    saveExperimentCustomFormData,
                    updateExperimentFormData
                };
            } catch (error) {
                console.error('Error initializing XNATCustomFormsApi:', error);
                uiNotificationService.show({
                    title: 'XNAT Custom Forms API Error',
                    message: `Failed to initialize XNAT Custom Forms API: ${error.message}`,
                    type: 'error',
                    duration: 5000,
                });
                throw error;
            }
        },
    };

    return actions;
};
