/**
 * Bidirectional mapping between modifier-key names and their numeric key-code
 * values.  These values mirror the `KeyboardBindings` enum from
 * `@cornerstonejs/tools` (packages/tools/src/enums/ToolBindings.ts).
 *
 * @ohif/core cannot depend on @cornerstonejs/tools directly, so the canonical
 * values are duplicated here.  If KeyboardBindings ever changes, update this
 * file to match.
 */

/** Modifier key-code → display name (e.g. 17 → 'Ctrl') */
const ModifierKeyCodeToName: Record<number, string> = {
  16: 'Shift',
  17: 'Ctrl',
  18: 'Alt',
  91: 'Cmd',
};

/** Lowercase key name → modifier key-code (e.g. 'ctrl' → 17) */
const ModifierKeyNameToCode: Record<string, number> = Object.fromEntries(
  Object.entries(ModifierKeyCodeToName).map(([code, name]) => [name.toLowerCase(), Number(code)])
);
// 'cmd' → 91 but preferences store 'meta' for the Meta/Cmd key
ModifierKeyNameToCode.meta = ModifierKeyNameToCode.cmd;

export { ModifierKeyCodeToName, ModifierKeyNameToCode };
