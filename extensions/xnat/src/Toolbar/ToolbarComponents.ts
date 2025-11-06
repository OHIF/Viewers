/**
 * Toolbar component registrations
 * Extracted from getToolbarModule.tsx
 */

import { ToolButton } from '@ohif/ui-next';

// Legacy toolbar components
import ToolbarDividerLegacy from './ToolbarDivider';
import ToolbarSplitButtonWithServicesLegacy from './ToolbarSplitButtonWithServices';
import ToolbarButtonGroupWithServicesLegacy from './ToolbarButtonGroupWithServices';
import { ProgressDropdownWithService } from '../Components/ProgressDropdownWithService';

// New toolbar components
import ToolButtonListWrapper from './ToolButtonListWrapper';
import { ToolBoxButtonGroupWrapper, ToolBoxButtonWrapper } from './ToolBoxWrapper';
import ReturnToXNATButton from './ReturnToXNATButton';
import ToolbarLayoutSelectorWithServices from './ToolbarLayoutSelector';

import type { ToolbarModuleItem, withAppTypes } from './ToolbarTypes';

/**
 * Get toolbar component registrations
 * @param commandsManager - Commands manager
 * @param servicesManager - Services manager
 * @returns Array of toolbar component configurations
 */
export function getToolbarComponents(commandsManager: any, servicesManager: any): ToolbarModuleItem[] {
    return [
        // New toolbar components
        {
            name: 'ohif.toolButton',
            defaultComponent: ToolButton,
        },
        {
            name: 'ohif.toolButtonList',
            defaultComponent: ToolButtonListWrapper,
        },
        {
            name: 'ohif.toolBoxButtonGroup',
            defaultComponent: ToolBoxButtonGroupWrapper,
        },
        {
            name: 'ohif.toolBoxButton',
            defaultComponent: ToolBoxButtonWrapper,
        },
        // Legacy toolbar components
        {
            name: 'ohif.radioGroup',
            defaultComponent: ToolButton,
        },
        {
            name: 'ohif.buttonGroup',
            defaultComponent: ToolbarButtonGroupWithServicesLegacy,
        },
        {
            name: 'ohif.divider',
            defaultComponent: ToolbarDividerLegacy,
        },
        {
            name: 'ohif.splitButton',
            defaultComponent: ToolbarSplitButtonWithServicesLegacy,
        },
        // Other toolbar components
        {
            name: 'ohif.layoutSelector',
            defaultComponent: (props: any) =>
                ToolbarLayoutSelectorWithServices({ ...props, commandsManager, servicesManager }),
        },
        {
            name: 'ohif.progressDropdown',
            defaultComponent: ProgressDropdownWithService,
        },
        {
            name: 'ohif.returnToXNAT',
            defaultComponent: ReturnToXNATButton,
        },
    ];
}
