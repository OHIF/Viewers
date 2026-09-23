import { defaults } from '@ohif/core';
import defaultWindowLevelPresets from './defaultWindowLevelPresets';

describe('window level preset hotkeys', () => {
  const presetHotkeys = defaults.hotkeyBindings.filter(
    binding => binding.commandName === 'setWindowLevelPreset'
  );

  it('has one hotkey per default CT preset, keyed 1 to N in menu order', () => {
    const expected = defaultWindowLevelPresets.CT.map((preset, index) => ({
      commandName: 'setWindowLevelPreset',
      commandOptions: { presetName: preset.id, presetIndex: index },
      label: `W/L Preset ${index + 1}`,
      keys: [`${index + 1}`],
    }));

    expect(presetHotkeys).toEqual(expected);
  });
});
