import {
  CUSTOMIZATION_URL_KEY,
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

export function getCustomizationUrlPolicy(customizationService: any): CustomizationUrlPolicy {
  const policy = customizationService?.getCustomization?.(CUSTOMIZATION_URL_KEY);
  return (policy as CustomizationUrlPolicy) || customizationUrlDefaults;
}

export {
  CUSTOMIZATION_URL_KEY,
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
