/**
 * The GPU settings preset that a deployment selects.
 *
 * The value is the `id` of a Cornerstone3D GPU settings preset: `auto`,
 * `low-tablet`, `low`, `medium`, `high`, or `high-texture-4096`. A preset is a
 * named set of values, the largest texture edge and the texture memory, and
 * nothing probes the device to choose it. `auto` computes the values for the
 * device, when the build of Cornerstone3D has `auto`.
 *
 * A preset applies only with final downsampling on. A value here turns final
 * downsampling on, also in a locked-down config. `null`, the default, selects
 * no preset: `appConfig.lossyDownsampling.final` then decides, with the
 * default preset of Cornerstone3D.
 *
 * Set this value in the `bootstrap` phase or in the `global` phase of a
 * `?customization=` module. `?customization=` needs `customizationUrlPrefixes`,
 * and `config/default.js` has none: there, set the value through
 * `customizationService` in the config. The shipped examples are
 * `platform/app/public/customizations/gpu/<id>.jsonc`.
 */
export default {
  'cornerstone.gpuSettingsPreset': null,
};
