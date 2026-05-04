import type { CustomizationModule } from './customizationUrlTypes';

export function getUrlCustomizationModulePayload(
  module: CustomizationModule | null | undefined
): { global?: Record<string, any>; requires?: string | string[] } | null {
  if (!module || typeof module !== 'object') {
    return null;
  }
  if (module.customizations && typeof module.customizations === 'object') {
    return module.customizations;
  }
  const m = module as CustomizationModule;
  const hasGlobal = m.global && typeof m.global === 'object';
  const hasRequires =
    typeof m.requires === 'string' ||
    (Array.isArray(m.requires) && m.requires.length > 0);
  if (hasGlobal || hasRequires) {
    return {
      ...(hasGlobal ? { global: m.global } : {}),
      ...(hasRequires ? { requires: m.requires } : {}),
    };
  }
  return null;
}
