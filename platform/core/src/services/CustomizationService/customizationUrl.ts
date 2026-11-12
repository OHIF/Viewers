import {
  CUSTOMIZATION_URL_PREFIXES_KEY,
  customizationUrlDefaults,
  DEFAULT_PREFIX,
} from './customizationUrlDefaults';
import type { CustomizationUrlPolicy } from './customizationUrlDefaults';
import { getUrlCustomizationModulePayload } from './getUrlCustomizationModulePayload';
import {
  parseCustomizationParams,
  validateCustomizationRequests,
  normalizeCustomizationValue,
} from './validate';
import type { ValidatedCustomization, ValidationResult } from './validate';
import { resolveCustomizationUrl } from './resolve';

/**
 * Builds the `?customization=` policy from the **app config** property
 * `customizationUrlPrefixes` (read off `extensionManager.appConfig`). This is
 * intentionally not a customization: customizations can be loaded from the URL,
 * so letting one define prefixes would let it widen its own allowlist. When the
 * property is absent the policy has no prefixes and the feature is off.
 */
export function getCustomizationUrlPolicy(customizationService: any): CustomizationUrlPolicy {
  const prefixes =
    customizationService?.extensionManager?.appConfig?.[CUSTOMIZATION_URL_PREFIXES_KEY];
  if (prefixes && typeof prefixes === 'object') {
    return { prefixes };
  }
  return customizationUrlDefaults;
}

export {
  CUSTOMIZATION_URL_PREFIXES_KEY,
  customizationUrlDefaults,
  DEFAULT_PREFIX,
  getUrlCustomizationModulePayload,
  parseCustomizationParams,
  validateCustomizationRequests,
  normalizeCustomizationValue,
  resolveCustomizationUrl,
};

export type {
  CustomizationUrlPolicy,
  ValidatedCustomization,
  ValidationResult,
};

export type { CustomizationModule, LoadedCustomization, LoadOptions } from './customizationUrlTypes';
