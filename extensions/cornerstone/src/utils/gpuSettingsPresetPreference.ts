/**
 * User preference for `cornerstone.gpuSettingsPreset`, stored in localStorage.
 * Deployer / URL / config customizations win for a session when they set a
 * value; this preference fills in only when the customization is still null.
 */

export const GPU_SETTINGS_PRESET_CUSTOMIZATION_ID = 'cornerstone.gpuSettingsPreset';

export const GPU_SETTINGS_PRESET_STORAGE_KEY = 'user-preferred-gpu-settings-preset';

/** Presets offered in User Preferences (excludes test-only and unshipped auto). */
export const USER_SELECTABLE_GPU_SETTINGS_PRESETS = [
  'low-tablet',
  'low',
  'medium',
  'high',
] as const;

export type UserSelectableGpuSettingsPreset =
  (typeof USER_SELECTABLE_GPU_SETTINGS_PRESETS)[number];

export function isUserSelectableGpuSettingsPreset(
  value: unknown
): value is UserSelectableGpuSettingsPreset {
  return (
    typeof value === 'string' &&
    (USER_SELECTABLE_GPU_SETTINGS_PRESETS as readonly string[]).includes(value)
  );
}

export function readUserGpuSettingsPreset(): UserSelectableGpuSettingsPreset | null {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  try {
    const stored = localStorage.getItem(GPU_SETTINGS_PRESET_STORAGE_KEY);
    return isUserSelectableGpuSettingsPreset(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function writeUserGpuSettingsPreset(
  presetId: UserSelectableGpuSettingsPreset | null
): void {
  if (typeof localStorage === 'undefined') {
    return;
  }

  try {
    if (!presetId) {
      localStorage.removeItem(GPU_SETTINGS_PRESET_STORAGE_KEY);
      return;
    }
    localStorage.setItem(GPU_SETTINGS_PRESET_STORAGE_KEY, presetId);
  } catch {
    // Ignore quota / private-mode failures; the in-session customization still applies.
  }
}
