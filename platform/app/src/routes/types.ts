/**
 * Common types used across route components
 */

import { ExtensionManager, ServicesManager, CommandsManager, HotkeysManager } from '@ohif/core';

/**
 * Base type for app-level props passed to route components
 * This includes the core managers and services needed by most routes
 */
export interface AppTypes {
  extensionManager: ExtensionManager;
  servicesManager: ServicesManager;
  commandsManager: CommandsManager;
  hotkeysManager: HotkeysManager;
}

/**
 * Generic type that combines app-level props with component-specific props
 * Usage: withAppTypes<ComponentProps>
 */
export type withAppTypes<T = Record<string, never>> = AppTypes & T;

/**
 * Props for route creation
 */
export interface RouteCreationProps extends AppTypes {
  modes: unknown[];
  dataSources: unknown[];
  showStudyList: boolean;
}
