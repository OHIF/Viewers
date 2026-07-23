import type { CustomizationUrlPolicy } from './customizationUrlDefaults';
import type { ValidatedCustomization } from './validate';

/**
 * The value accepted by any single customization phase block. It is whatever
 * {@link CustomizationService.setCustomizations} accepts:
 *   - an object map of `customizationId -> customization` (with optional
 *     immutability-helper commands like `$set` / `$apply` / `$splice`), or
 *   - an array that mixes string references (extension module ids resolved via
 *     the ExtensionManager) and inline object maps.
 */
export type CustomizationPhaseInput = string[] | Record<string, any>;

/**
 * Mode-phase customizations, keyed by mode. The reserved `*` key (see
 * `GENERAL_MODE_KEY`) is the "general" block applied to every mode FIRST; any
 * other key is matched against the entered mode's `id` / `routeName` and applied
 * AFTER the general block, so a single mode can override the general values.
 */
export type ModePhaseCustomizations = Record<string, CustomizationPhaseInput>;

/**
 * Phase-tagged customization payload. The same shape is used by:
 *   - URL-loaded customization modules (`?customization=` JSONC files), and
 *   - the `appConfig.customizationService` structured config.
 *
 * Each block is applied at a distinct point in the app lifecycle so ordering is
 * deterministic regardless of when extensions / modes load:
 *   - `requires`     — other URL customization modules to resolve first.
 *   - `bootstrap`    — applied (Global scope) BEFORE extensions register.
 *   - `global`       — applied (Global scope) AFTER extensions register / init.
 *   - `mode`         — applied (Mode scope) on every mode enter; general first,
 *                      then the entered mode's specific block.
 */
export interface PhasedCustomizationConfig {
  requires?: string | string[];
  bootstrap?: CustomizationPhaseInput;
  global?: CustomizationPhaseInput;
  mode?: ModePhaseCustomizations;
}

export interface CustomizationModule extends PhasedCustomizationConfig {
  [key: string]: any;
}

export interface LoadedCustomization {
  request: ValidatedCustomization;
  module: CustomizationModule;
  url: string;
}

export interface LoadOptions {
  policy?: CustomizationUrlPolicy;
  importFn?: (url: string) => Promise<any>;
  logger?: { warn: (...args: any[]) => void; error: (...args: any[]) => void };
}
