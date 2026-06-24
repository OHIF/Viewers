import type { CustomizationModule, PhasedCustomizationConfig } from './customizationUrlTypes';

/**
 * Extracts the phase-tagged payload from a loaded customization module.
 *
 * A module is considered to carry a payload when it declares any of the
 * lifecycle phase blocks (`preExtension` / `global` / `mode`) or a `requires`
 * edge. Returns `null` when none are present so callers can warn/skip a module
 * that does nothing.
 */
export function getUrlCustomizationModulePayload(
  module: CustomizationModule | null | undefined
): PhasedCustomizationConfig | null {
  if (!module || typeof module !== 'object') {
    return null;
  }
  const hasPreExtension = isPhaseInput(module.preExtension);
  const hasGlobal = isPhaseInput(module.global);
  const hasMode = module.mode && typeof module.mode === 'object' && !Array.isArray(module.mode);
  const hasRequires =
    typeof module.requires === 'string' ||
    (Array.isArray(module.requires) && module.requires.length > 0);

  if (!hasPreExtension && !hasGlobal && !hasMode && !hasRequires) {
    return null;
  }
  return {
    ...(hasPreExtension ? { preExtension: module.preExtension } : {}),
    ...(hasGlobal ? { global: module.global } : {}),
    ...(hasMode ? { mode: module.mode } : {}),
    ...(hasRequires ? { requires: module.requires } : {}),
  };
}

/** A phase block is either an object map or an array of references. */
function isPhaseInput(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.length > 0;
  }
  return Boolean(value) && typeof value === 'object';
}
