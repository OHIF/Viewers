import * as cornerstone from '@cornerstonejs/core';

const CUSTOMIZATION_ID = 'cornerstone.gpuCapabilityProfile';

/**
 * States which class of GPU applies, from the `cornerstone.gpuCapabilityProfile`
 * customization.
 *
 * The capability profiles live in Cornerstone3D. A profile states the largest
 * texture edge and the texture memory of the device, and a volume viewport
 * reduces its texture to fit those limits. A viewport reads the profile when it
 * adds its actor, so the value must arrive before a mode opens a viewport. The
 * `bootstrap` phase of a `?customization=` module applies before this extension
 * registers, and the `global` phase applies immediately after it, so both are
 * early enough.
 *
 * The profiles are new work in Cornerstone3D. A build against a version that
 * carries no profile keeps its own behaviour, and this function reports the
 * omission rather than throwing.
 */
export default function initGpuCapabilityProfile({ customizationService }): void {
  let appliedId = null;

  const apply = () => {
    const profileId = customizationService.getValue(CUSTOMIZATION_ID);

    if (!profileId || profileId === appliedId) {
      return;
    }

    const setActiveProfile = cornerstone.setActiveGpuCapabilityProfile;

    if (typeof setActiveProfile !== 'function') {
      console.warn(
        `${CUSTOMIZATION_ID} states "${profileId}", and this build of ` +
          '@cornerstonejs/core carries no capability profile. The viewer keeps ' +
          'the behaviour of that build.'
      );
      appliedId = profileId;
      return;
    }

    try {
      setActiveProfile(profileId);
      appliedId = profileId;
    } catch (error) {
      console.warn(`${CUSTOMIZATION_ID} states "${profileId}", which is not a profile.`, error);
    }
  };

  apply();

  customizationService.subscribe(customizationService.EVENTS.GLOBAL_CUSTOMIZATION_MODIFIED, apply);
  customizationService.subscribe(customizationService.EVENTS.MODE_CUSTOMIZATION_MODIFIED, apply);
}
