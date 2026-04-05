---
sidebar_position: 3
sidebar_label: Toggleable Passive Tools
title: Toggleable passive toolbar tools
---

# Toggleable passive toolbar tools

OHIF 3.13 adds a toolbar pattern for tools that should stay enabled without taking over the
active primary mouse binding.

This is useful for tools such as Crosshairs, where you may want the feature to remain on while
another tool such as Pan, Zoom, or Window Level stays active.

## What changed

- `ToolButton` now supports an `isToggled` visual state.
- Cornerstone adds `togglePassiveDisabledToolbar`, which toggles a tool between on and off
  without replacing the active tool.
- A matching evaluator pattern can return `isToggled` so the toolbar button reflects that state.
- The basic mode Crosshairs button uses this pattern and can optionally expose its jump modifier
  as a user preference.

## When to use this

Use this pattern when a tool should:

- stay available while another primary tool remains active
- be visually "on" in the toolbar
- toggle between `Passive` or `Enabled` and `Disabled`

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
- If you expose the modifier as a preference, refresh toolbar state after changing it so tooltip
  and toggle state stay in sync.
