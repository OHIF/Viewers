import { setGpuSettingsPreset, resetGpuSettingsPreset, setLossyDownsampling } from '@cornerstonejs/core';

const CUSTOMIZATION_ID = 'cornerstone.gpuSettingsPreset';

/**
 * Applies the `cornerstone.gpuSettingsPreset` customization, and applies it
 * again when the global or the mode customization changes.
 *
 * - A preset id selects that preset and turns final downsampling on, also in a
 *   config that keeps `lossyDownsampling.final` off, such as `config/default.js`.
 * - `null` returns to the Cornerstone3D default preset and to
 *   `appConfig.lossyDownsampling.final`.
 *
 * A volume viewport reads the preset when it adds its actor, so call this
 * before a mode opens a viewport. The `bootstrap` and `global` phases of a
 * `?customization=` module both apply early enough.
 *
 * See the "Select the GPU settings preset" section of specificCustomizations.md.
 */
export default function initGpuSettingsPreset({ customizationService, appConfig }): void {
  const configuredFinal = Boolean(appConfig?.lossyDownsampling?.final);
  let appliedId = null;

  const apply = () => {
    const presetId = customizationService.getValue(CUSTOMIZATION_ID) ?? null;

    if (presetId === appliedId) {
      return;
    }

    if (!presetId) {
      resetGpuSettingsPreset();
      setLossyDownsampling({ final: configuredFinal });
      appliedId = null;
      return;
    }

    try {
      setGpuSettingsPreset(presetId);
      setLossyDownsampling({ final: true });
      appliedId = presetId;
    } catch (error) {
      console.warn(`${CUSTOMIZATION_ID} states "${presetId}", which is not a preset.`, error);
    }
  };

  apply();

  customizationService.subscribe(customizationService.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED, apply);
  customizationService.subscribe(customizationService.EVENTS.MODE_CUSTOMIZATION_MODIFIED, apply);
}
