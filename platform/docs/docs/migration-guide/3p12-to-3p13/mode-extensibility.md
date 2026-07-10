---
sidebar_position: 11
sidebar_label: Mode extensibility
title: 'Mode lifecycle regularization (basic / longitudinal / segmentation / tmtv)'
---

# Mode lifecycle regularization

3.13 makes the `segmentation`, `tmtv` and `basic-test` modes extend the `basic`
mode's shared lifecycle (as `longitudinal` already did), and in the process
regularizes a few mode-instance properties that 3.12 introduced. If you built a
mode on top of `@ohif/mode-basic` (or spread one of the shipped
`modeInstance` objects), review the changes below.

## Lifecycle ordering

Mode-related customizations follow one deterministic sequence; the final value
of every key is decided by scope precedence (global > mode > default) plus
application order, with no special cases:

1. app-config `requires` and `?customization=` chains are resolved up front;
2. mode modules load and register the `customizations` maps they carry
   (Default scope);
3. the `bootstrap` phase applies (Global scope) — it can modify what the modes
   registered;
4. extensions register; extension defaults merge; the `global` phase applies;
5. mode instances are created (`modeFactory`) — after bootstrap/global, so they
   see modifications;
6. on mode enter, the mode scope is reset, then layered bottom-up: the mode's
   layout panel lists (seeded as `leftPanels` / `rightPanels`) and its
   toolbar/tool-group composition (seeded as the plain `toolbarButtons` /
   `toolbarSections` / `toolGroupAdditions`), the mode's `modeCustomizations`
   block, the `mode` phase `*` block, and the mode-specific block;
7. only then do the sidebars, toolbar, and `onModeEnter` consume the values.

## `initToolGroups` takes an options object

All modes now share one tool group setup signature, so an extending mode (or a
`modeConfiguration`) can substitute any other mode's implementation via the
`initToolGroups` instance property:

```js
// Before (3.12) — basic/segmentation form:
function initToolGroups(extensionManager, toolGroupService, commandsManager) { ... }
// Before (3.12) — tmtv form:
function initToolGroups(toolNames, Enums, toolGroupService, commandsManager) { ... }

// After (3.13) — every mode:
function initToolGroups({ extensionManager, toolGroupService, commandsManager, servicesManager }) {
  // resolve toolNames/Enums yourself when needed:
  const utilityModule = extensionManager.getModuleEntry(
    '@ohif/extension-cornerstone.utilityModule.tools'
  );
  const { toolNames, Enums } = utilityModule.exports;
  ...
}
```

This only affects functions passed as the `initToolGroups` mode-instance
property (invoked by the shared `onModeEnter`); a self-contained mode that
calls its own function inside its own `onModeEnter` is unaffected.

## `enableSegmentationEdit` is replaced by `modeCustomizations`

Mode-scoped customizations are now declared as data instead of one-off boolean
capabilities, and the final value of every key is decided by the customization
service's normal resolution alone — scope precedence (global > mode > default)
plus application order within the mode scope — with no special-case logic.

On mode enter the mode route layers the mode scope bottom-up:

1. the mode's `modeCustomizations` block, applied right after the mode scope is
   reset (e.g. `basic.modeCustomizations` seeds `panelSegmentation.disableEditing: true`);
2. the app config / URL `mode` phase blocks (the general `*` block, then the
   mode-specific block) — e.g. `?customization=segmentation/segmentationEditing` sets
   `panelSegmentation.disableEditing: false` in its `mode.basic` / `mode.viewer`
   blocks, which wins over step 1 by application order.

A `global`-scope customization still overrides the whole mode scope by scope
precedence when a value genuinely needs to apply to every mode.

The block itself is registered with the customization service at default scope
by the **mode** when it loads — modes carry a `customizations` map on their
definition, registered during app init *before* the bootstrap phase applies —
and the mode instance references it by name, so bootstrap and `?customization=`
modules can modify the block before it is ever applied:

```js
// Before (3.12)
export const modeInstance = {
  enableSegmentationEdit: false,
};

// After (3.13) — the mode registers the block when it loads (plain
// key -> value data; registered customization values never carry `$`
// commands — commands are how later customizations modify them):
export const customizations = {
  'basic.modeCustomizations': {
    'panelSegmentation.disableEditing': true,
  },
};

export const mode = {
  id,
  modeFactory,
  modeInstance,
  extensionDependencies,
  customizations,
};

// and the mode instance references it:
export const modeInstance = {
  modeCustomizations: 'basic.modeCustomizations',
};
```

`modeCustomizations` may also be a literal value on the mode instance: an
object whose entries are plain values or immutability-helper commands (a
command merges with the value registered at default scope — e.g. the
`basic-test` mode `$push`es an extra hotkey onto `ohif.hotkeyBindings`), or an
array mixing customization module reference strings with such objects.

## `activatePanelTrigger` is replaced by data-driven `activatePanelTriggers`

The 3.12 `activatePanelTrigger` boolean (which hardcoded the cornerstone panel
ids) is replaced by an `activatePanelTriggers` list the shared `onModeEnter`
wires up. Entries are JSON-serializable — event names are looked up in the
source service's `EVENTS` map — so a customization or an extending mode can
point at its own panels:

```js
export const modeInstance = {
  activatePanelTriggers: [
    {
      panelId: '@ohif/extension-cornerstone.panelModule.panelSegmentation',
      sourceServiceName: 'segmentationService',
      sourceEvents: ['SEGMENTATION_ADDED'],
    },
  ],
};
```

It is empty by default (matching 3.12 behavior, where nothing set the boolean).
The basic mode exports `defaultActivatePanelTriggers` with the historical
segmentation/measurement panel triggers.

Relatedly, subscriptions created during `onModeEnter` are now tracked as
unsubscribe **functions** in a single `this._unsubscriptions` array
(initialized by the shared `onModeEnter`, cleaned by the shared `onModeExit`).
The `_activatePanelTriggersSubscriptions` array of subscription objects is
gone; extending modes push plain functions instead:

```js
export function onModeEnter(ctx) {
  basicOnModeEnter.call(this, ctx);
  const { unsubscribe } = someService.subscribe(...);
  this._unsubscriptions.push(unsubscribe);
}
// No custom onModeExit needed — the shared one cleans up.
```

## Data-driven `isValidMode`

The shared `isValidMode` gained two properties alongside `modeModalities` /
`nonModeModalities`, letting modes declare validity without custom code:

- `excludedModalities`: the study is invalid when it contains **any** of these
  (e.g. tmtv rejects `SM`).
- `excludedStudies`: a list of `{ attribute: value }` objects; a study matching
  every attribute of an entry is invalid (e.g. `[{ mrn: 'M1' }]`).

Also note a 3.12 bug fix: `modeModalities` matching previously used a bare
`indexOf` truthiness check, which inverted matches in some cases; it now
correctly tests list membership.

## tmtv now clears measurements on enter

Because tmtv shares the basic mode's `onModeEnter`, it now calls
`measurementService.clearMeasurements()` on mode entry like every other mode.
