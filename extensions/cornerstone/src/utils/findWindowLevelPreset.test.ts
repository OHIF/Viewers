import { findWindowLevelPreset } from './findWindowLevelPreset';
import defaultWindowLevelPresets from '../components/WindowLevelActionMenu/defaultWindowLevelPresets';

// The CT presets of platform/app/public/customizations/tools/ctPresets.jsonc
const fourCtPresets = [
  { id: 'ct-soft-tissue', description: 'Soft tissue', window: '400', level: '40' },
  { id: 'ct-lung', description: 'Lung', window: '1500', level: '-600' },
  { id: 'ct-angio', description: 'Angio', window: '600', level: '300' },
  { id: 'ct-bone', description: 'Bone', window: '2500', level: '480' },
];

describe('findWindowLevelPreset', () => {
  it('finds a default CT preset by its id', () => {
    const preset = findWindowLevelPreset(defaultWindowLevelPresets.CT, 'ct-brain', 4);

    expect(preset).toMatchObject({ id: 'ct-brain', window: '80', level: '40' });
  });

  it('finds the preset by id when a customization orders the presets differently', () => {
    const preset = findWindowLevelPreset(fourCtPresets, 'ct-bone', 2);

    expect(preset).toMatchObject({ id: 'ct-bone', window: '2500', level: '480' });
  });

  it('uses the position when no preset has the id', () => {
    const preset = findWindowLevelPreset(fourCtPresets, 'ct-liver', 2);

    expect(preset).toMatchObject({ id: 'ct-angio' });
  });

  it('returns undefined when neither the id nor the position matches', () => {
    expect(findWindowLevelPreset(fourCtPresets, 'ct-brain', 4)).toBeUndefined();
  });

  it('supports presets given as an object keyed by id', () => {
    const presets = {
      'ct-lung': { description: 'Lung', window: '1500', level: '-600' },
      'ct-bone': { description: 'Bone', window: '2500', level: '480' },
    };

    expect(findWindowLevelPreset(presets, 'ct-bone', 0)).toMatchObject({ window: '2500' });
    expect(findWindowLevelPreset(presets, 'ct-brain', 0)).toMatchObject({ window: '1500' });
    expect(findWindowLevelPreset(presets, 'ct-brain', 2)).toBeUndefined();
  });

  it('does not match inherited object properties', () => {
    const presets = { 'ct-lung': { description: 'Lung', window: '1500', level: '-600' } };

    expect(findWindowLevelPreset(presets, 'toString', 5)).toBeUndefined();
  });

  it('returns undefined when the modality has no presets', () => {
    expect(findWindowLevelPreset(undefined, 'ct-brain', 4)).toBeUndefined();
  });
});
