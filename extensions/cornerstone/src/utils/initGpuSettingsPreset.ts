import * as cornerstone from '@cornerstonejs/core';

const CUSTOMIZATION_ID = 'cornerstone.gpuSettingsPreset';

/**
 * Selects the GPU settings preset from the `cornerstone.gpuSettingsPreset`
 * customization, and turns on final downsampling when the customization
 * states a preset.
 *
 * A preset is a named set of GPU settings in Cornerstone3D: the largest
 * texture edge and the texture memory. With final downsampling on, a volume
 * viewport reduces its texture to fit those values. The value `auto` asks
 * Cornerstone3D to compute the settings for the device, when the build of
 * Cornerstone3D has `auto`.
 *
 * - The customization states a preset: final downsampling is on, with that
 *   preset, also in a locked-down config such as `config/default.js`.
 * - The customization states no preset: `appConfig.lossyDownsampling.final`
 *   decides, with the default preset of Cornerstone3D.
 *
 * A viewport reads the preset when it adds its actor, so the value must arrive
 * before a mode opens a viewport. The `bootstrap` phase of a `?customization=`
 * module applies before this extension registers, and the `global` phase
 * applies immediately after it, so both are early enough.
 *
 * A build of Cornerstone3D that has no presets keeps its own behaviour, and
 * this function reports the omission and does not throw.
 */
export default function initGpuSettingsPreset({ customizationService, appConfig }): void {
  const configuredFinal = Boolean(appConfig?.lossyDownsampling?.final);
  let appliedId = null;

  const apply = () => {
    const presetId = customizationService.getValue(CUSTOMIZATION_ID) ?? null;

    if (presetId === appliedId) {
      return;
    }

    const { setGpuSettingsPreset, resetGpuSettingsPreset, setLossyDownsampling } = cornerstone;

    if (!presetId) {
      // A preset that changes to null returns to the config and to the
      // Cornerstone3D default preset.
      resetGpuSettingsPreset?.();
      setLossyDownsampling?.({ final: configuredFinal });
      appliedId = null;
      return;
    }

    if (typeof setGpuSettingsPreset !== 'function') {
      console.warn(
        `${CUSTOMIZATION_ID} states "${presetId}", and this build of ` +
          '@cornerstonejs/core has no GPU settings presets. The viewer keeps ' +
          'the behaviour of that build.'
      );
      appliedId = presetId;
      return;
    }

    try {
      setGpuSettingsPreset(presetId);
      setLossyDownsampling?.({ final: true });
      appliedId = presetId;
    } catch (error) {
      console.warn(`${CUSTOMIZATION_ID} states "${presetId}", which is not a preset.`, error);
    }
  };

  apply();

  customizationService.subscribe(customizationService.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED, apply);
  customizationService.subscribe(customizationService.EVENTS.MODE_CUSTOMIZATION_MODIFIED, apply);
}
