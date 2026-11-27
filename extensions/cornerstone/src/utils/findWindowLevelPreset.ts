import type { WindowLevelPreset } from '../types/WindowLevel';

type PresetEntry = WindowLevelPreset & { id?: string };

/**
 * Finds the window level preset that a hotkey asks for.
 *
 * The presets of a modality are usually an array of entries with an `id`
 * (see `defaultWindowLevelPresets`), but a customization can also give them
 * as an object keyed by id. The preset is looked up by `presetName` first,
 * then by its position `presetIndex`.
 *
 * @param presets - The presets of one modality, as an array or an object keyed by id
 * @param presetName - The id of the preset, for example `ct-brain`
 * @param presetIndex - The position of the preset, used when no preset has that id
 * @returns The preset, or undefined when neither the id nor the position matches,
 *   for example when a customization has fewer presets than there are hotkeys
 */
export function findWindowLevelPreset(
  presets: PresetEntry[] | Record<string, PresetEntry> | undefined,
  presetName?: string,
  presetIndex?: number
): PresetEntry | undefined {
  if (!presets) {
    return undefined;
  }

  const entries = Array.isArray(presets) ? presets : Object.values(presets);

  if (presetName) {
    const byName = Array.isArray(presets)
      ? presets.find(preset => preset?.id === presetName)
      : Object.prototype.hasOwnProperty.call(presets, presetName)
        ? presets[presetName]
        : undefined;
    if (byName) {
      return byName;
    }
  }

  if (Number.isInteger(presetIndex) && presetIndex >= 0) {
    return entries[presetIndex];
  }

  return undefined;
}
