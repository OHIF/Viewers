/**
 * Toolbar Module for XNAT
 * Refactored to use extracted modules for better maintainability
 */

import { getToolbarComponents } from './Toolbar/ToolbarComponents';
import { getToolbarEvaluators } from './Toolbar/ToolbarEvaluators';
import type { withAppTypes } from './Toolbar/ToolbarTypes';

export default function getToolbarModule({ commandsManager, servicesManager }: withAppTypes) {
  const toolbarComponents = getToolbarComponents(commandsManager, servicesManager);
  const toolbarEvaluators = getToolbarEvaluators(servicesManager);

  return [
    ...toolbarComponents,
    ...toolbarEvaluators,
  ];
}
