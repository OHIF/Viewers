/**
 * Example URL-loaded customization module: ctPresets
 *
 * Replaces the CT window/level presets offered in the window-level menu with a
 * site-specific set (key: `cornerstone.windowLevelPresets`). Other modalities
 * keep their defaults because only the `CT` entry is overridden.
 *
 * Load it with `?customization=ctPresets`.
 */
export default {
  global: {
    'cornerstone.windowLevelPresets': {
      $merge: {
        CT: [
          { id: 'ct-soft-tissue', description: 'Soft tissue', window: '400', level: '40' },
          { id: 'ct-lung', description: 'Lung', window: '1500', level: '-600' },
          { id: 'ct-angio', description: 'Angio', window: '600', level: '300' },
          { id: 'ct-bone', description: 'Bone', window: '2500', level: '480' },
        ],
      },
    },
  },
};
