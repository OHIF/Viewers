import { ToolbarService } from '@ohif/core';

export const createActionButton = ToolbarService._createButton.bind(null, 'action');
export const createToggleButton = ToolbarService._createButton.bind(null, 'toggle');
export const createToolButton = ToolbarService._createButton.bind(null, 'tool');
