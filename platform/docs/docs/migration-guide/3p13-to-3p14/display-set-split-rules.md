---
sidebar_position: 15
sidebar_label: Display set split rules
title: Display set split rules and SOP class handlers
summary: What an extension with a SOP class handler must add so that its display sets work when a deployment turns on the display set split rules, and how to move a rule customization from splitRules with priorities to displaySetRules and displaySetRuleOrder.
---

# Display set split rules and SOP class handlers

3.14 adds the display set split rules of `@cornerstonejs/metadata`, as an opt-in
customization (`useMetadataDisplaySet`). The rules are **off by default**. With
the rules off, nothing in this page applies, and every SOP class handler runs as
in 3.13.

This page is for the author of an extension that has a SOP class handler. It
states what changes when a deployment turns the rules on, for example with
`?customization=split/enableNewSplit`. The last section is for the author of a
rule customization from an earlier build of the split rules.

| Change | Kind |
|---|---|
| With the rules on, a SOP class handler of another extension does not run | Breaking, only with the rules on |
| A SOP class handler can declare `handlerNames` and `extendDisplaySet` | New, optional |
| `splitRules` with a `priority` for each rule is replaced by `displaySetRules` and `displaySetRuleOrder` | Breaking, only for a customization of the rules |

## What the user sees

With the rules on, the rules decide the display sets of each series. Each rule
can name a handler. A SOP class handler serves the display sets of the names
that it declares.

- The SOP class handlers of the OHIF extensions declare their names, so SEG,
  RTSTRUCT, parametric maps, SR, PDF, video, ECG, whole slide and microscopy
  display sets show as with the rules off.
- The default `unsupported` rule takes each instance that no other rule takes.
  So a series of a private SOP class shows as an **unsupported display set**,
  also when the mode has a SOP class handler for that class.
- With the rules off, the same series shows with the handler of the extension.
- A deployment can remove `unsupported` from the rule order. Then OHIF gives
  each instance that no rule claims to the SOP class handlers, as with the
  rules off.

## What an extension adds

To serve a SOP class with the rules on, add two things.

**1. A handler name and `extendDisplaySet` on the SOP class handler.**

**Before (3.13)**, the handler builds the display sets from a series:

```js
{
  name: 'my-private-object',
  sopClassUids: ['1.2.3.4.5'],
  getDisplaySetsFromSeries,
}
```

**After (3.14)**, the handler also declares a name, and a function that adds its
fields to a display set that a rule made. Keep `getDisplaySetsFromSeries` for the
rules off. Use the same code in both paths:

```js
{
  name: 'my-private-object',
  sopClassUids: ['1.2.3.4.5'],
  getDisplaySetsFromSeries,
  handlerNames: ['myPrivateObject'],
  extendDisplaySet: (displaySet, { addedInstances, servicesManager, extensionManager }) => {
    // Add the fields of the handler to displaySet, in place and synchronously.
    // addedInstances is undefined at creation, and lists the new instances at an update.
  },
}
```

A handler that declares `handlerNames` and has no `extendDisplaySet` is an error
when the mode starts.

**2. A rule that claims the SOP class and names the handler.** Add the rule to
the registry (`displaySetRules`), and put its id first in the rule order
(`displaySetRuleOrder`), so that it runs before the default rules:

```js
customizationService.setCustomizations({
  useMetadataDisplaySet: {
    displaySetRules: {
      $merge: {
        myPrivateObject: {
          description: 'My private SOP class: one display set for each instance.',
          handler: 'myPrivateObject',
          matches: { SOPClassUID: '1.2.3.4.5' },
          groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'],
        },
      },
    },
    displaySetRuleOrder: { $unshift: ['myPrivateObject'] },
  },
});
```

A server that builds the same display sets reads the same rule, so put the rule
in a customization file, and not only in code.

## Move a customization from `splitRules` to the registry and the order

Earlier builds of the split rules had one customization field, `splitRules`.
It held the rules keyed by rule id, and each rule had a `priority`. The
customization now has two fields:

- `displaySetRules`: the rule registry, keyed by rule id. A rule in the
  registry does nothing until the order names it.
- `displaySetRuleOrder`: the rule ids in evaluation order. The first rule that
  matches an instance claims it.

A rule has no `priority` field. The compiler rejects a rule with a `priority`
(`unknown field 'priority'`), and OHIF then creates no display sets. Remove the
`priority` field from each rule, and use this table:

| Before (`splitRules`) | Now |
|---|---|
| `splitRules: { $merge: { myRule } }` | `displaySetRules: { $merge: { myRule } }`, and put the id in `displaySetRuleOrder` |
| A priority below `0` (before every default rule) | `displaySetRuleOrder: { $unshift: ['myRule'] }` |
| A priority between two default priorities | `displaySetRuleOrder: { $spliceById: [['volume3d', 0, 'myRule']] }`, with the id of the later default rule |
| A priority above `10000` (a fallback) | `displaySetRuleOrder: { $spliceById: [['unsupported', 0, 'myRule']] }` |
| `volume3d: { priority: { $set: null } }` (turn a rule off) | `displaySetRuleOrder: { $spliceById: [['volume3d', 1]] }` |
| `priority: null` on a new rule (in the module, but off) | Add the rule to `displaySetRules` only, and not to the order |
| A change of the priority of a default rule (move it) | Remove the id from the order, and insert it at the new position, with two `$spliceById` entries |
| `splitRules: { volume3d: { sortBy: { $set: [...] } } }` (change one field) | `displaySetRules: { volume3d: { sortBy: { $set: [...] } } }`; the rule keeps its place |
| `?customization=split/volumeProjectionOrder` | `?customization=split/optional/volumePositionOrder` |
| `?customization=split/optional/byAcquisitionTime` | `?customization=split/optional/byAcquisition` |

`$spliceById` is `$splice` with a rule id as the position.
`[['volume3d', 0, 'myRule']]` inserts `myRule` before `volume3d`.
`[['volume3d', 1]]` removes `volume3d`. `[['volume3d', 1, 'myVolume']]`
replaces `volume3d` with `myVolume`. An id that is not in the order is an
error. Each entry finds its position after the earlier entries. For example,
`[['ctScout', 1], ['localizer', 0, 'ctScout']]` moves `ctScout` to the position
just before `localizer`. Do not put an id in `$splice`: plain
`immutability-helper` reads a string position as `0` and gives no error.

An id of the order that is not in the registry, or an id that is in the order
twice, is a compile error. OHIF then creates no display sets, and shows an
error that names the rule.

The default rule ids and their order are in the
[Cornerstone docs](https://www.cornerstonejs.org/docs/concepts/cornerstone-metadata/display-sets#the-default-rules).
Use an id, and not an index, because the index of a default rule can change in
a later release.

The OHIF module `split/volumeProjectionOrder` is removed. The optional file
`volumePositionOrder` of `@cornerstonejs/metadata` replaces it. The file sets
the `sortBy` of `volume3d` to `sliceDistance`, then `InstanceNumber`. The rule
keeps its id, so a hanging protocol that selects the
`splitRuleId` `volume3d` still finds the display sets.

An optional file of `@cornerstonejs/metadata` (`rules/optional/<id>.jsonc`) is
now an `immutability-helper` spec over `{ displaySetRules, displaySetRuleOrder }`.
The OHIF build applies the file to `useMetadataDisplaySet`, and does not wrap
the file in `splitRules: { $merge: ... }`. A copy of an optional file in a
deployment must use the new form.

## More information

- [Display Set Splitting](../../platform/services/customization-service/displaySetSplitting.md),
  section "Handlers: `handlerNames` and `extendDisplaySet`".
- The user requirements `SP-FIX-5`, `SP-FIX-9`, `SP-FIX-10` and `SP-FIX-11` in the
  [display set splitting specification](../../development/specs/display-set-splitting/requirements.md).
