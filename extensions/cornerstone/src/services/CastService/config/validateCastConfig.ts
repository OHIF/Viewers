import type { HubConfig } from '../network/types';

export interface CastConfigLike {
  defaultHub?: string;
  hubs?: HubConfig[];
  autoStart?: boolean;
  autoReconnect?: boolean;
  productName?: string;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates cast configuration at startup. Fails fast if defaultHub is set but not found in hubs.
 */
export function validateCastConfig(config: CastConfigLike | undefined): ValidationResult {
  if (!config) {
    return { valid: true };
  }
  const { defaultHub, hubs } = config;
  if (!defaultHub) {
    return { valid: true };
  }
  if (!hubs?.length) {
    return { valid: false, error: 'cast.defaultHub is set but cast.hubs is missing or empty' };
  }
  const found = hubs.some((h) => h.enabled && h.name === defaultHub);
  if (!found) {
    return {
      valid: false,
      error: `cast.defaultHub "${defaultHub}" not found in cast.hubs or hub is disabled`,
    };
  }
  return { valid: true };
}
