// The following are the default window level presets and can be further
// configured via the customization service.
const defaultWindowLevelPresets = {
  CT: [
    { description: 'Soft tissue', window: '400', level: '40' },
    { description: 'Lung', window: '1500', level: '-600' },
    { description: 'Liver', window: '150', level: '90' },
    { description: 'Bone', window: '2500', level: '480' },
    { description: 'Brain', window: '80', level: '40' },
  ],

  PT: [
    { description: 'Default', window: '5', level: '2.5' },
    { description: 'SUV', window: '0', level: '3' },
    { description: 'SUV', window: '0', level: '5' },
    { description: 'SUV', window: '0', level: '7' },
    { description: 'SUV', window: '0', level: '8' },
    { description: 'SUV', window: '0', level: '10' },
    { description: 'SUV', window: '0', level: '15' },
  ],
};

export default defaultWindowLevelPresets;
