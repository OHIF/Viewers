---
sidebar_position: 3
sidebar_label: Toggleable Passive Tools
title: Toggleable passive toolbar tools
---

# Toggleable passive toolbar tools

OHIF 3.13 adds a toolbar pattern for tools that should stay on without stealing the default
primary mouse interaction.

This is useful for tools such as Crosshairs, where you may want the feature to remain on while
another tool such as Pan, Zoom, or Window Level stays active. In 3.13, that "on" state can be a
true `Passive`/`Enabled` tool or an `Active` tool that only responds when a modifier key is held.

## What changed

- `ToolButton` now supports an `isToggled` visual state.
- Cornerstone adds `togglePassiveDisabledToolbar`, which toggles a tool between off and a
  non-primary "on" state without forcing it to become the default primary tool.
- A matching evaluator pattern can return `isToggled` so the toolbar button reflects that state.
- Crosshairs uses this pattern in basic mode and, when `jumpOnClick` is enabled, turns on as an
  `Active` tool bound to `Primary + modifierKey`.
- Mouse modifier assignments can be exposed from a mode's `onModeEnter` through
  `mouseBindingsManager.setActionDefinitions(...)`, and the default preferences modal persists
  them across reloads.

## When to use this

Use this pattern when a tool should:

- stay available while another primary tool remains active
- be visually "on" in the toolbar
- toggle between `Disabled` and a non-primary on-state

That on-state can be:

- `Passive` or `Enabled` for tools that should always listen in the background
- `Active` with a modifier-only binding for tools such as Crosshairs that should only react on
  `Primary + modifier`

Do not use this pattern for tools that should become the active primary interaction. Those should
continue using `setToolActiveToolbar` and `evaluate.cornerstoneTool`.

## Migration

If you have a custom toolbar tool that previously had to choose between:

- acting like a normal active tool, or
- acting like a simple enabled/disabled toggle,

you can now adopt the passive-toggle pattern instead.

**Before**

```ts
{
  id: 'Crosshairs',
  uiType: 'ohif.toolButton',
  props: {
    type: 'tool',
    icon: 'tool-crosshair',
    label: 'Crosshairs',
    commands: {
      commandName: 'setToolActiveToolbar',
      commandOptions: {
        toolGroupIds: ['mpr'],
      },
    },
    evaluate: {
      name: 'evaluate.cornerstoneTool',
    },
  },
}
```

**After**

```ts
{
  id: 'Crosshairs',
  uiType: 'ohif.toolButton',
  props: {
    type: 'tool',
    icon: 'tool-crosshair',
    label: 'Crosshairs',
    commands: {
      commandName: 'togglePassiveDisabledToolbar',
      commandOptions: {
        toolGroupIds: ['mpr'],
      },
    },
    evaluate: {
      name: 'evaluate.cornerstoneTool.crosshairToggle',
    },
  },
}
```

## Notes

- Your evaluator should treat `Active`, `Passive`, and `Enabled` as on-states if the tool can
  temporarily become active through another interaction path such as a modifier-click binding.
- If the tool should remain available after switching away from it, make sure the tool
  configuration does not auto-disable on passive.
- If the tool uses a modifier-bound active path, update both the tool configuration and the active
  binding when the modifier changes.
- If you expose mouse modifier preferences, register them during the mode's `onModeEnter` through
  `mouseBindingsManager`, prefer a modifier-to-action UI with automatic persistence in the
  preferences layer, and keep the tool-specific command focused on applying the resolved modifier
  rather than managing storage itself.
- In OHIF, that preference UI is now declared as modifier actions such as
  `crosshairsJump` instead of per-action shortcut rows such as "Crosshairs Jump to Click".
- See the platform manager doc for the runtime API:
  [`Mouse Bindings Manager`](../../platform/managers/mouse-bindings.md).
