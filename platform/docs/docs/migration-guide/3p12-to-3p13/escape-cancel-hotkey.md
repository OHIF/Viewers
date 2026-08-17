---
sidebar_position: 7
sidebar_label: Escape / cancelActiveOperation hotkey
title: Escape hotkey consolidation
---

# Escape hotkey – single `cancelActiveOperation` command

The default `Escape` hotkey behavior has been consolidated. Previously the
`esc` key was bound to **two** separate commands in the default hotkey
bindings — `cancelMeasurement` and `rejectPreview`. Because the underlying
hotkey library (Mousetrap) keeps only **one** handler per key, the
later-registered binding (`rejectPreview`) silently shadowed the other, so
`cancelMeasurement` never ran and an in-progress Spline/Livewire/PlanarFreehand
contour (or any annotation being drawn) could not be cancelled with `Escape`.

`Escape` is now bound to a single generic command, **`cancelActiveOperation`**,
which orchestrates the two single-purpose commands. Each is a no-op when its
state is not active, so one `Escape` press consistently:

- rejects a provisional segmentation **preview** (via `rejectPreview`), and
- cancels an **in-progress annotation** being drawn (via `cancelMeasurement`).

## Change

| 3.12 (old)                                   | 3.13 (new)                              |
|----------------------------------------------|-----------------------------------------|
| `esc` → `cancelMeasurement` **and** `esc` → `rejectPreview` (the latter shadowed the former) | `esc` → `cancelActiveOperation`         |
| `enter` → `acceptPreview`                     | `enter` → `acceptPreview` (unchanged)   |

New command (cornerstone extension, `CORNERSTONE` context):

```ts
// extensions/cornerstone/src/commandsModule.ts
cancelActiveOperation: () => {
  actions.rejectPreview();     // discard a provisional segmentation preview
  actions.cancelMeasurement(); // cancel an in-progress annotation draw
},
```

Both `rejectPreview` and `cancelMeasurement` remain available as standalone
commands; only their default `esc` hotkey bindings changed.

## Migration

Most applications need no changes — the default behavior simply works as
expected now.

**If you provide a custom `ohif.hotkeyBindings` customization** and want the
same consolidated behavior, bind `esc` to the new command and remove the old
duplicate `esc` entries:

**Before (3.12):**

```ts
'ohif.hotkeyBindings': [
  // ...
  { commandName: 'cancelMeasurement', label: 'Cancel Measurement', keys: ['esc'] },
  { commandName: 'acceptPreview', label: 'Accept Preview', keys: ['enter'] },
  { commandName: 'rejectPreview', label: 'Reject Preview', keys: ['esc'] },
];
```

**After (3.13):**

```ts
'ohif.hotkeyBindings': [
  // ...
  { commandName: 'cancelActiveOperation', label: 'Cancel', keys: ['esc'] },
  { commandName: 'acceptPreview', label: 'Accept Preview', keys: ['enter'] },
];
```

**If you ran the `cancelMeasurement` or `rejectPreview` command directly** (for
example from a toolbar button or another command), no change is required — both
commands still exist with the same behavior.

> **User key remaps:** the per-user hotkey overrides stored in `localStorage`
> (`user-preferred-keys`) are keyed by command hash. A user who had personally
> remapped the old `cancelMeasurement` or `rejectPreview` key will fall back to
> the new `esc` default for `cancelActiveOperation`, since those old command
> hashes no longer exist in the defaults.

## Reason

Binding two separate commands to the same key is inherently fragile — only the
last registered binding survives. Routing `Escape` through a single
orchestrating command removes the shadowing bug, keeps each underlying command
single-purpose, and makes the "discard whatever is in progress" intent explicit.
