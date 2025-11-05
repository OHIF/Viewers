import { ToolbarService, ViewportGridService } from '@ohif/core';
import { EVENTS } from '@cornerstonejs/core';

const { createButton } = ToolbarService;

// Constants to avoid undefined reference errors
export const VIEWPORT_GRID_EVENTS = {
    ACTIVE_VIEWPORT_ID_CHANGED: 'event::activeviewportidchanged',
    VIEWPORTS_READY: 'event::viewportsReady',
};

export const ReferenceLinesListeners = [
    {
        commandName: 'setSourceViewportForReferenceLinesTool',
        context: 'CORNERSTONE',
    },
];

export const setToolActiveToolbar = {
    commandName: 'setToolActiveToolbar',
    commandOptions: {
        toolGroupIds: ['default', 'mpr', 'SRToolGroup', 'volume3d'],
    },
};

export const callbacks = (toolName: string) => [
    {
        commandName: 'setViewportForToolConfiguration',
        commandOptions: {
            toolName,
        },
    },
];
