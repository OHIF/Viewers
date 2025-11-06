/**
 * Type definitions for Toolbar Module
 * Extracted from getToolbarModule.tsx
 */

export interface ToolbarServices {
    cineService: any;
    segmentationService: any;
    toolGroupService: any;
    toolbarService: any;
    cornerstoneViewportService: any;
    colorbarService: any;
    displaySetService: any;
    viewportGridService: any;
}

export interface withAppTypes {
    servicesManager: {
        services: ToolbarServices;
    };
    extensionManager: any;
    commandsManager: any;
}

export interface EvaluateFunctionParams {
    viewportId?: string;
    button?: any;
    itemId?: string;
    toolNames?: string[];
    disabledText?: string;
}

export interface EvaluateFunctionResult {
    primary?: any;
    items?: any[];
    className?: string;
    disabled?: boolean;
    disabledText?: string;
    isActive?: boolean;
}

export interface ToolbarModuleItem {
    name: string;
    defaultComponent?: any;
    evaluate?: (params: EvaluateFunctionParams) => EvaluateFunctionResult;
}

export interface ToggleEvaluateParams {
    viewportId: string;
    toolbarService: any;
    button: any;
    disabledText?: string;
    offModes: string[];
    toolGroupService: any;
}
