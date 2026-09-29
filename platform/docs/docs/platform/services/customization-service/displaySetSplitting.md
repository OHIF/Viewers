---
id: displaySetSplitting
title: Display Set Splitting
summary: Metadata-driven display set splitting with customizable split rules and safe $function expressions.
sidebar_position: 12
---

# Metadata-Driven Display Set Splitting

The `useMetadataDisplaySet` customization switches display set creation from
the stack SOP class handler to the split-rules engine of
`@cornerstonejs/metadata`.  Series instances are matched against a set of
**split rules**, keyed by rule id and evaluated in `priority` order (first
matching rule wins per instance), grouped by each rule's `groupBy` keys, and
every group becomes one display set.

Instances that no rule matches — video, whole-slide, ECG, SEG, SR, RT
Structure Sets, PDFs, and anything else handled by a dedicated extension —
fall through to the registered SOP class handlers unchanged, so existing
`getSopClassHandlerModule` handlers keep working exactly as before.

The feature is **off by default**.

## Enabling

Per mode (in `onModeEnter`):

```js
customizationService.setCustomizations({
  useMetadataDisplaySet: { enabled: { $set: true } },
});
```

Globally from the app config, via the named customization module:

```js
window.config = {
  // ...
  customizationService: [
    '@ohif/extension-default.customizationModule.metadataDisplaySet',
  ],
};
```

From the URL (requires `appConfig.customizationUrlPrefixes` to allow the
prefix):

```
?customization=split/enableNewSplit
```

## The customization value

```ts
useMetadataDisplaySet: {
  /** default false */
  enabled: boolean;
  /** rules keyed by id; ascending priority, first match wins per instance */
  splitRules: Record<string, SplitRule & { priority: number | null }>;
  /** builds an OHIF display set from a matched instance group */
  createDisplaySetFromGroup: (group, { splitNumber, compareInstances }) => DisplaySet;
  /** optional host comparator, consulted after a rule's own compareInstances */
  compareInstances?: (a, b, context) => number;
}
```

The key of each `splitRules` entry is the rule id. `priority` decides the
evaluation order: rules run in ascending priority, and equal priorities run in
id order. A priority of `null` turns the rule off.

The default rules use the priorities `1..n`. A rule with a priority below `0`
runs before every default rule, and a rule with a priority above `10000` runs
after every default rule.

The default `splitRules` (from `@ohif/extension-default`) are:

| Priority | Rule id | Behavior |
|---|---|---|
| 1 | `singleImageModality` | CR/DX/MG — one display set **per image** (preserves multi-view mammography) |
| 2 | `multiFrame` | any image with `NumberOfFrames > 1` — one display set per instance (including US clips) |
| 3 | `mixedDimensionalityBValue` | MR series mixing instances with and without `DiffusionBValue` — split into separate display sets (fixes mixed-b-value DWI window leveling) |
| 4 | `volume3d` | CT/MR/PT series with more than one instance — a single reconstructable display set |
| 5 | `defaultImageRule` | catch-all: one display set per series for every remaining stack-owned instance |

Every default rule is gated on the same ownership test: **the instance's SOP
class must be one the stack SOP class handler is registered for.** Split rules
run before any SOP class routing, so without that gate a rule matching on pixel
data alone would claim instances that belong elsewhere — SEG, RT Dose and
Parametric Map are multiframe image objects with `Rows` like any other. The
gate reproduces the legacy routing exactly, and covers the image SOP classes
(Ultrasound, NM, RT Image, Enhanced US Volume, ophthalmic) that a generic
"is this an image?" list tends to miss.

The default display set factory (`createDisplaySetFromGroup`) builds the same
`ImageSet` the stack handler builds — same `label`, `supportsWindowLevel`,
`FrameOfReferenceUID`, `SOPClassHandlerId`, reconstructability checks and
messages — plus `splitKey` / `splitRuleId` / `viewportTypes` from the split
engine and the matched rule's `customAttributes`.

## Anatomy of a split rule

```ts
// splitRules.myRule
{
  priority: -1,                                // evaluation order; null turns it off
  viewportTypes: ['stack'],                    // preferred viewport hints
  series: ({ instances }) => ({ ... }),        // facts computed once per series
  matches: (instance, { series }) => boolean,  // per-instance predicate
  groupBy: ['SeriesInstanceUID', ...],         // tag names or functions
  customAttributes: (ctx, options) => ({ ... }) // extra display set attributes
}
```

Rules are evaluated in priority order and the **first** matching rule claims
the instance.  Groups are namespaced per rule id, so two rules never merge
their instances even when their `groupBy` values collide.

In TypeScript (a mode or extension) rules are written with plain functions.
In **data-only customizations** — JSONC URL modules or JSON app configs,
which are parsed as data and never executed — rules are written declaratively
with `$function` expressions. The expression language, its call signatures,
the `denyAttributes` policy, and how to diagnose an expression that matches
nothing are described in [`$function` expressions](./functionExpressions.md).
This section covers only what is specific to split rules.

## Split rules as data

Where each rule field runs:

| Field | Arguments | Bare identifiers read |
|---|---|---|
| `series` fact | the series context | `instances` (the series' instance array) |
| `matches` | `(instance, context)` | the instance's DICOM tags; facts on `context.series` |
| `groupBy` entry | `(instance, context)` | the instance's DICOM tags |
| `compareInstances` | `(a, b, context)` | fields of `a` — write `a.` and `b.` explicitly |
| `customAttributes` value | `(instance, context)` | the group's first instance; `context.instances`, `context.splitNumber` |

`@ohif/extension-default` registers these signatures — and the signature of
the top-level `useMetadataDisplaySet.compareInstances` — through
`registerFunctionSignatures`, so a rule written in JSONC does not state a
calling convention and cannot state a wrong one.

### Ordering comparators

Because the signature puts both instances in scope, an ordering comparator is
declarable as data:

```jsonc
"spatial": {
  "priority": -1,
  "matches": { "$function": "Modality === 'CT'" },
  "compareInstances": { "$function": "a.SliceLocation - b.SliceLocation" }
}
```

The top-level `useMetadataDisplaySet.compareInstances` is a comparator with the
same arguments. The engine consults it after the rule's own `compareInstances`,
and the display set factory applies both again whenever it re-sorts a display
set.

Returning 0 from a comparator declines to have an opinion rather than asserting
the two instances are interchangeable: OHIF's default order (the
`instanceSortingCriteria` customization, else patient position, else instance
number) is the base, and whatever the comparator does not decide keeps it. So a
rule can order by one attribute and leave the rest of the ordering alone.

:::note Composing text from attributes is intended
A rule can build a display set's `label` or `SeriesDescription` out of any
attribute the instance carries — that is the point of template literals here,
and relabelling a split ("`SCOUT ${SeriesDescription}`", "b=0 / b=1000") is a
main reason to write a rule at all. It is a capability, not an oversight.

It does mean a rule decides what appears in the study browser and viewport
overlays, and the instance it reads from carries patient identifiers alongside
the acquisition tags. A rule that interpolates `PatientName` or `PatientID`
will therefore put them on screen — and, because the text is composed by a
*rule*, that can happen without anyone editing a viewer template.

So treat a split-rule set as content a reviewer reads, on the same footing as
the overlay configuration: whoever can write rules for a deployment can change
what its screens say. Two things follow for how rules reach a deployment.
Loading them from the URL is off unless `customizationUrlPrefixes` names a
prefix, and that prefix should point somewhere with the same write controls as
any other deployed configuration. And where text composition is not wanted at
all, [`customizationFunctionPolicy.denyAttributes`](./functionExpressions.md#withholding-an-attribute-from-data)
is where to withhold it — deny `customAttributes.label` and
`customAttributes.SeriesDescription` and rules can still split, just not
relabel.
:::

:::caution
A `$function` that fails to compile resolves to `undefined`. For `matches` and
`groupBy` that would be dangerous — the engine treats a rule with no `matches`
as matching **every** instance — so a rule whose `matches` or `groupBy` did not
resolve to something callable is **dropped** with a console warning. The
remaining rules stay in charge, so a typo degrades to "my rule did nothing"
rather than "every series is grouped wrong".

An undefined `series` fact fails closed instead (the rule simply never
matches); that also warns, since it is otherwise a silent mystery.
:::

### Display set identity and re-splits

**Existing display sets only grow.** When new instances of a series arrive, or
the split rules change during a session, an instance that already has a display
set stays in it. A display set is never deleted, never loses an instance, and
keeps its `displaySetInstanceUID`, so viewport state survives. The re-split only
places the instances that are new to the series:

1. into the existing display set that holds the other instances of their group,
   through that display set's `extendInstances` hook;
2. else into the existing display set with their group's `splitKey`;
3. else into a new display set of their own.

The result can therefore differ from a split of the complete series from the
start. For example, an ultrasound series with a `runBy` rule arrives as `img1`,
`img3` (single images) and `clip4` (a multi-frame clip): two display sets,
`[img1, img3]` and `[clip4]`. Then `clip2` arrives. A split from the start gives
four display sets, `[img1] [clip2] [img3] [clip4]`. The re-split gives three:
`[img1, img3]` stays as it is, `clip2` gets a new display set, and `[clip4]`
stays as it is.

`splitKey` holds the rule id and the rule's `groupBy` values, and no position:
a `runBy` run is keyed by its first instance, not by its run number. A display
set keeps the key of the group that created it.

`extendInstances` receives the rule's series facts from the re-split, so the
re-sort of the display set uses the facts that the split used.

`splitNumber` is only an index into the engine's group list, and shifts when a
new group appears. Do not use it as a stable identity in `customAttributes`.

## Worked example: splitting a CT SCOUT image

`platform/app/public/customizations/split/scoutSeries.jsonc` (load with
`?customization=split/scoutSeries`) splits the first image — the lowest
`InstanceNumber`, typically the scout / localizer — off every CT series with
at least 10 frames into its own display set labelled `SCOUT`:

```jsonc
{
  // Loads split/enableNewSplit first, turning the splitter on.
  "requires": ["split/enableNewSplit"],
  "global": {
    "useMetadataDisplaySet": {
      "splitRules": {
        // Adds the rule under its id. Priority -1 runs it before `volume3d`
        // (priority 4) claims the series.
        "$merge": {
          "ctScout": {
            "priority": -1,
            "viewportTypes": ["stack"],
            "series": {
              // Computed once per series; multiframe-aware frame count.
              "frameCount": {
                "$function": "sumOf(instances, defined(NumberOfFrames) ? NumberOfFrames : 1)"
              },
              "firstInstanceNumber": { "$function": "minOf(instances, InstanceNumber)" }
            },
            "matches": {
              "$function": "Modality === 'CT' && context.series.frameCount >= 10 && InstanceNumber == context.series.firstInstanceNumber"
            },
            "groupBy": ["SeriesInstanceUID"],
            "customAttributes": {
              "label": "SCOUT",
              "SeriesDescription": { "$function": "`SCOUT ${SeriesDescription}`" }
            }
          }
        }
      }
    }
  }
}
```

Result: for a 120-image CT, the study browser shows a one-image `SCOUT`
display set and a 119-image reconstructable volume display set.  CT series
with fewer than 10 frames are left intact (the rule does not match, so the
whole series falls through to `volume3d`).

## Overriding rules

Split rules resolve through the usual customization scopes
(global → mode → default) and can be edited with immutability-helper
commands:

```js
// Add a rule that runs before every default rule (see the SCOUT example above)
useMetadataDisplaySet: { splitRules: { $merge: { myRule: { ...myRule, priority: -1 } } } }

// Add a fallback rule (only sees instances no default rule matched)
useMetadataDisplaySet: { splitRules: { $merge: { myRule: { ...myRule, priority: 20000 } } } }

// Replace one rule, and keep its place
useMetadataDisplaySet: {
  splitRules: { singleImageModality: { $set: { ...myRule, priority: 1 } } },
}

// Move one rule
useMetadataDisplaySet: { splitRules: { volume3d: { priority: { $set: 0 } } } }

// Turn one rule off
useMetadataDisplaySet: { splitRules: { volume3d: { priority: { $set: null } } } }

// Replace the whole rule set
useMetadataDisplaySet: { splitRules: { $set: { ruleA: { ...ruleA, priority: 1 } } } }
```

:::note
Because rules are first-match-wins, a rule with a priority above `10000` only
receives instances that none of the default rules claimed. A rule that must
take precedence over the defaults needs a priority below `0`.

A keyed rule set cannot hold two rules with one id, so a customization layer
replaces or edits a rule instead of adding a copy of it. An entry whose
`priority` is missing or is not a number is dropped with a console warning.
:::

:::caution
The OHIF default rules deliberately claim only the instances the stack SOP
class handler owns.  A custom rule that matches video, whole-slide, ECG, SEG,
RT Structure Set, Parametric Map or any other SOP class with a dedicated
extension takes those instances away from that extension — the resulting
display sets will not work with its viewports.

Note that "has `Rows`" is not a safe test for this: SEG, RT Dose and Parametric
Map are all multiframe image objects.  A custom rule should check
`SOPClassUID` explicitly, or reuse `isStackHandledInstance` from
`@ohif/extension-default`.
:::
