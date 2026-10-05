/**
 * Which class of GPU the deployment states.
 *
 * The value is the `id` of a Cornerstone3D capability profile: `low-tablet`,
 * `low`, `medium`, `high`, or `high-texture-4096`. A profile states the largest
 * texture edge and the texture memory of the device, and a volume viewport
 * reduces its texture to fit those limits.
 *
 * `null` states no profile, and Cornerstone3D keeps its own default. That
 * default is `high`, which states the limit of 2048 that every known WebGL
 * device holds.
 *
 * Nothing probes the device. A deployment states the profile, because a probe
 * reports what a device claims, and a device can overstate its memory.
 *
 * Set this value in the `bootstrap` phase or in the `global` phase of a
 * `?customization=` module. The shipped examples are
 * `platform/app/public/customizations/gpu/<id>.jsonc`.
 */
export default {
  'cornerstone.gpuCapabilityProfile': null,
};
