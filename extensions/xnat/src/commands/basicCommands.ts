import { Types, DicomMetadataStore } from '@ohif/core';
import { ContextMenuController } from '../CustomizableContextMenu';
import { ContextMenuProps } from '../CustomizableContextMenu/types';
import requestDisplaySetCreationForStudy from '../Panels/requestDisplaySetCreationForStudy';

export const createBasicCommands = (
    servicesManager: any,
    commandsManager: any,
    extensionManager: any
) => {
    const {
        customizationService,
        measurementService,
        hangingProtocolService,
        uiNotificationService,
        viewportGridService,
        displaySetService,
        multiMonitorService,
    } = servicesManager.services;

    // Define a context menu controller for use with any context menus
    const contextMenuController = new ContextMenuController(servicesManager, commandsManager);

    const actions = {
        /**
         * Runs a command in multi-monitor mode.  No-op if not multi-monitor.
         */
        multimonitor: async options => {
            const { screenDelta, StudyInstanceUID, commands, hashParams } = options;
            if (multiMonitorService.numberOfScreens < 2) {
                return options.fallback?.(options);
            }

            const newWindow = await multiMonitorService.launchWindow(
                StudyInstanceUID,
                screenDelta,
                hashParams
            );

            // Only run commands if we successfully got a window with a commands manager
            if (newWindow && commands) {
                // Todo: fix this properly, but it takes time for the new window to load
                // and then the commandsManager is available for it
                setTimeout(() => {
                    multiMonitorService.run(screenDelta, commands, options);
                }, 1000);
            }
        },

        /**
         * Ensures that the specified study is available for display
         * Then, if commands is specified, runs the given commands list/instance
         */
        loadStudy: async options => {
            const { StudyInstanceUID } = options;
            const displaySets = displaySetService.getActiveDisplaySets();
            const isActive = displaySets.find(ds => ds.StudyInstanceUID === StudyInstanceUID);
            if (isActive) {
                return;
            }
            const [dataSource] = extensionManager.getActiveDataSource();
            await requestDisplaySetCreationForStudy(dataSource, displaySetService, StudyInstanceUID);

            const study = DicomMetadataStore.getStudy(StudyInstanceUID);
            hangingProtocolService.addStudy(study);
        },

        /**
         * Show the context menu.
         * @param options.menuId defines the menu name to lookup, from customizationService
         * @param options.defaultMenu contains the default menu set to use
         * @param options.element is the element to show the menu within
         * @param options.event is the event that caused the context menu
         * @param options.selectorProps is the set of selection properties to use
         */
        showContextMenu: (options: ContextMenuProps) => {
            const {
                menuCustomizationId,
                element,
                event,
                selectorProps,
                defaultPointsPosition = [],
            } = options;

            const optionsToUse = { ...options };

            if (menuCustomizationId) {
                Object.assign(optionsToUse, customizationService.getCustomization(menuCustomizationId));
            }

            // TODO - make the selectorProps richer by including the study metadata and display set.
            const { protocol, stage } = hangingProtocolService.getActiveProtocol();
            optionsToUse.selectorProps = {
                event: event as unknown as Event,
                protocol,
                stage,
                ...selectorProps,
            };

            contextMenuController.showContextMenu(optionsToUse, element, defaultPointsPosition);
        },

        /** Close a context menu currently displayed */
        closeContextMenu: () => {
            contextMenuController.closeContextMenu();
        },

        displayNotification: ({ text, title, type }) => {
            uiNotificationService.show({
                title: title,
                message: text,
                type: type,
            });
        },

        clearMeasurements: () => {
            measurementService.clearMeasurements();
        },
    };

    return actions;
};
