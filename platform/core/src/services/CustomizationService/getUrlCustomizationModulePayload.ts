import type { CustomizationModule } from './customizationUrlTypes';

export function getUrlCustomizationModulePayload(
  module: CustomizationModule | null | undefined
): { global?: Record<string, any>; requires?: string | string[] } | null {
  if (!module || typeof module !== 'object') {
    return null;
  }
  const hasGlobal = module.global && typeof module.global === 'object';
  const hasRequires =
    typeof module.requires === 'string' ||
    (Array.isArray(module.requires) && module.requires.length > 0);
  if (hasGlobal || hasRequires) {
    return {
      ...(hasGlobal ? { global: module.global } : {}),
      ...(hasRequires ? { requires: module.requires } : {}),
    };
  }
  return null;
}
