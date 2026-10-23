---
id: displaySetSplitting
title: Display Set Splitting
summary: Metadata-driven display set splitting with customizable split rules, written as @cornerstonejs/metadata raw selector data.
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
  /** raw selector rules keyed by id; ascending priority, first match wins per instance */
  splitRules: Record<string, RawSplitRule>;
  /** context entries over the @cornerstonejs/metadata default context; data, or code entries such as { isStackImage } */
  displaySetContext?: Record<string, ContextEntry>;
  /** named series functions for a context group, in addition to planeGeometry and timeClusters (code) */
  seriesFunctions?: Record<string, SeriesFunction | { compute; fields }>;
  /** named comparators for a sortBy entry { "sortFunction": "name" } (code) */
  sortFunctions?: Record<string, (a, b, context) => number>;
  /** builds an OHIF display set from a matched instance group */
  createDisplaySetFromGroup: (group, { splitNumber, compareInstances }) => DisplaySet;
  /** optional host comparator (code), consulted after a rule's own sortBy */
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
| `null` (off) | `singleImageModality` | CR/DX/MG — one display set **per image**, as the legacy stack handler does. Off by default: a CR, DX or MG series is one display set. See [Worked example: one display set per radiograph](#worked-example-one-display-set-per-radiograph) |
| 2 | `multiFrame` | any image with `NumberOfFrames > 1` — one display set per instance (including US clips) |
| 3 | `mixedDimensionalityBValue` | MR series mixing instances with and without `DiffusionBValue` — split into separate display sets (fixes mixed-b-value DWI window leveling) |
| 4 | `volume3d` | CT/MR/PT/NM series with more than one instance — a single reconstructable display set |
| 5 | `defaultImageRule` | catch-all: one display set per series for every remaining stack-owned instance |

The OHIF set does not hold the upstream `unsupported` catch-all, so the
instances that no rule matches go to the SOP class handlers.

Every default rule is gated on the same ownership test: **the instance's SOP
class must be one the stack SOP class handler is registered for.** Split rules
run before any SOP class routing, so without that gate a rule matching on pixel
data alone would claim instances that belong elsewhere — SEG and Parametric Map
are multiframe image objects with `Rows` like any other. The gate reproduces
the legacy routing exactly. The rules read that test as the context entry
`isStackImage` (see [What only code can supply](#what-only-code-can-supply)).
OHIF replaces the upstream `isStackImage` entry with the stack handler's own SOP
class list.

The default display set factory (`createDisplaySetFromGroup`) builds the same
`ImageSet` the stack handler builds — same `label`, `supportsWindowLevel`,
`FrameOfReferenceUID`, `SOPClassHandlerId`, reconstructability checks and
messages — plus `splitKey` / `splitRuleId` / `splitGroupId` / `viewportTypes` from the split
engine and the matched rule's `attributes`.

## Anatomy of a split rule

Split rules are `@cornerstonejs/metadata` **raw selector** data, compiled by
`createDisplaySetSplitRules`. OHIF has no rule language of its own. A rule reads
the same whether it is in a mode, in the app config, or in a JSONC file that the
viewer loads from the URL:

```jsonc
// splitRules.myRule
{
  "priority": -1,                                  // evaluation order; null turns it off
  "viewportTypes": ["stack"],                      // preferred viewport hints
  "context": {                                     // names for this rule only
    "isLocalizer": "includes(ImageType, 'LOCALIZER')",
    "hasScout": "series.instances.count(isLocalizer) > 0 && series.instances.count(isLocalizer) < series.instances.count()"
  },
  "matches": {                                     // a map of name to test; every entry must hold
    "Modality": "CT",
    "hasScout": true,
    "isLocalizer": true
  },
  "groupBy": ["SeriesInstanceUID"],                // names
  "sortBy": ["InstanceNumber"],                    // names, ascending
  "attributes": {                                  // extra display set attributes
    "label": { "template": "SCOUT" },
    "SeriesDescription": { "template": "SCOUT {SeriesDescription}" }
  }
}
```

Each name is a DICOM keyword (`Modality`) or a context name (`isLocalizer`,
`seriesInstanceCount`). The compiler rejects every other name. `matches` has no
`all`, `any` or `not`: `false` on a named boolean gives "not", and an "or" goes
in a context entry. The full reference of the rule fields, the tests, the
context and the expression language is in the `@cornerstonejs/metadata`
documentation of display sets and safe functions. See also
[split rule expressions](./functionExpressions.md).

Rules are evaluated in priority order and the **first** matching rule claims
the instance.  Groups are namespaced per rule id, so two rules never merge
their instances even when their `groupBy` values collide.

### What only code can supply

Some tests cannot be expressed as data — the OHIF defaults need the stack SOP
class handler's own SOP class list, for one. Code supplies such a test as a
**code entry** of the display set context, and a rule reads it by name:

```js
useMetadataDisplaySet: {
  displaySetContext: { isStackImage: isStackImageInstance }, // code
  splitRules: { myRule: { priority: 3, matches: { isStackImage: true } } }, // data
}
```

`@ohif/extension-default` registers `isStackImage`. A rule that reads a name
that no context entry defines does not compile, and so stops display set
creation (see [Rule errors](#rule-errors)). Named `seriesFunctions` work the
same way for context groups (see [The series context](#the-series-context)),
and named `sortFunctions` for `sortBy` entries.

A selector that reads a code entry is still JSON. But a server, or any other
system that splits the same series, must register the same code entry to get the
same result.

A mode or an extension in TypeScript can also put a function at a function
place of a raw rule: a whole `matches`, the test of one `matches` entry, a
`groupBy` entry, a `sortBy` entry, a whole `attributes`, or one
attribute value. The compiler keeps each function as it is, and compiles each
data field. A rule that the `@cornerstonejs/metadata` compiler has already
compiled is not a valid entry: its `series`, `compareInstances` and
`customAttributes` fields are not raw fields. A raw rule cannot fail at run
time, because the safe functions give a definite result for every instance. A
function that code supplies — a rule field or a code entry — can throw. OHIF
wraps every function of every rule, so the error names the rule and the field.

### Groups of rules

Each display set records the rule that made it as `splitRuleId`, and the
group of that rule as `splitGroupId`. `splitGroupId` is the rule's `groupId`,
else the rule id, so it equals `splitRuleId` unless you group rules.

Group rules when several rules make one kind of display set. Mammography, for
example, can arrive as breast tomosynthesis, as legacy mammography with all its
views in one series, and as mammography that the modality already split. Each
form needs its own rule, and all three can say `"groupId": "mammo"`:

```jsonc
"mgTomo":   { "priority": -3, "groupId": "mammo", ... },
"mgLegacy": { "priority": -2, "groupId": "mammo", ... },
"mgSplit":  { "priority": -1, "groupId": "mammo", ... }
```

A hanging protocol then matches `splitGroupId` equal to `mammo`, and finds each
mammography display set, whichever rule made it. The group id does not change
the split: groups and split keys stay per rule id. A rule's `attributes`
cannot change `splitRuleId`, `splitGroupId` or `splitKey`.

### Ordering

A rule orders its display sets with `sortBy`: `["SliceLocation"]` sorts
ascending by that attribute, numeric when both values are numbers. An instance
with no value goes after the instances with a value. `{ "sortFunction": "name" }`
uses a named comparator of `sortFunctions`. When `sortBy` has no opinion on two
instances, OHIF's default order (the `instanceSortingCriteria` customization,
else patient position, else instance number) decides.

The top-level `useMetadataDisplaySet.compareInstances` is a comparator function
`(a, b, context)` that code supplies. The engine consults it after the rule's
own `sortBy`, and the display set factory applies both again whenever it
re-sorts a display set.

### The series context

Some splits need a value of the whole series in a test of one instance: the
slice spacing, the position of each slice on a regular lattice, the time
sweeps of an ultrasound series. These values are entries of the **display set
context**. The engine computes an entry at the first read, one time for each
series, and every rule of the split reads the same value.

A rule tests the full series, and describes each display set. In `context`,
`matches` and `groupBy`, every series function runs over the series. In
`sortBy` and `attributes`, `planeGeometry` runs over the instances of the
display set, so `sliceSpacing` and `sliceDistance` describe the display set.
`timeClusters` runs over the series in every place, so `sweepOffset` stays the
offset from the start of the series. A group entry can choose with `"over":
"series"` or `"over": "displaySet"`, for example to put the spacing of the
series in a label.

A context entry has one of these forms:

| Form | Value |
|---|---|
| a number, a boolean, `null` or an array | A fixed value. A site changes it with `$set`. |
| a string | An expression, for example `"seriesInstanceCount < 10"` or `"planeGeometry.spacing * 2"`. `series.instances.count(x)`, `.min(x)`, `.max(x)` and `.sum(x)` run over the instances of the series. |
| `{ "template": "..." }` | Text, for example `"{Rows}x{Columns}"`. |
| `{ "function": "name", "args"?: {...} }` | A group: the value of a named series function. |
| `{ "attribute": "00191010" }` | A declaration of an attribute that the DICOM dictionary does not hold. |

An entry in `useMetadataDisplaySet.displaySetContext` is global. An entry in the
`context` of a rule applies to that rule only, and replaces the global entry of
the same name, also inside the global entries that the rule reads. For example,
`"context": { "timeClustersMaxGap": 20 }` changes the gap for one rule.

The default context of `@cornerstonejs/metadata` holds two groups of built-in
series functions, and names for their fields:

- **`planeGeometry`** — the dominant image plane, the slice spacing (the most
  frequent gap), and the slices on a regular lattice of that spacing. Series
  fields: `normal`, `origin`, `spacing`, `regularCount`, `irregularCount`,
  `positions`, `complete` (no missing lattice position), `duplicates`. Instance
  fields: `distance` (mm along the normal) and `index` (the lattice position of
  a regular slice). The aliases are `sliceSpacing`, `sliceDistance` and
  `sliceIndex`. `planeGeometryTolerance` (default `0.1`) is the fraction of the
  spacing a slice may be off the lattice.
- **`timeClusters`** — clusters of contiguous acquisition time. Series fields:
  `first`, `clusters`, `untimedCount`. Instance fields: `time` and `start` (the
  start time of the cluster of the instance). The aliases are `sweepCount`,
  `sweepStart`, `acquisitionSeconds` and `sweepOffset`. A gap of more than
  `timeClustersMaxGap` seconds (default `30`) starts a new cluster.

The default context also holds `seriesInstanceCount`, `isMultiFrame`, and the
code entries `isImage`, `isVideo`, `isEcg`, `isWsi` and `isStackImage`.

#### Writing a series function

Write a series function when a summary needs a sort, a mode, or geometry that
an expression cannot compute. Code registers it by name, and a context group
names it:

```ts
import type { SeriesFunction } from '@cornerstonejs/metadata';

// The most frequent image size of the series, e.g. "512x512".
// A tie goes to the smaller text, so the result does not depend on input order.
const dominantSize: SeriesFunction = instances => {
  const counts = new Map<string, number>();
  for (const { Rows, Columns } of instances) {
    const size = `${Rows}x${Columns}`;
    counts.set(size, (counts.get(size) ?? 0) + 1);
  }
  const [best] = [...counts].sort(([a, n], [b, m]) => m - n || (a < b ? -1 : 1));
  return best?.[0];
};

customizationService.setCustomizations({
  useMetadataDisplaySet: { seriesFunctions: { $merge: { dominantSize } } },
});
```

```jsonc
"context": {
  "dominantSize": { "function": "dominantSize" },
  "imageSize": { "template": "{Rows}x{Columns}" },
  "isDominantSize": "imageSize == dominantSize"
},
"matches": { "isDominantSize": true }
```

A series function must:

- be pure, and give the same result for any order of `instances`. Break each
  tie with a value of the instance, for example its `SOPInstanceUID`;
- return plain data. For a result for each instance, return a map keyed by
  `SOPInstanceUID` (`instanceKey` from `@cornerstonejs/metadata` gives the key),
  and declare it as an instance field with a definition `{ compute, fields }`;
- not return an ordinal for use in `groupBy`. Return a value that stays the
  same when later instances arrive, for example the start time of a cluster;
- read its options from `args`.

A context group that names a function that no code registered does not compile
(see [Rule errors](#rule-errors)).

Three URL modules show the forms:

| Module | Case |
|---|---|
| `split/regularVolume` | A volume series with some irregular images: the regular slices become one volume display set, and the other images stay with the default rules. |
| `split/volumeProjectionOrder` | Replaces `volume3d` under its own id, and orders its slices by the distance along the normal from one origin. |
| `split/usTimeClusters` | An ultrasound series of several sweeps: one display set for each run of images with no gap longer than 20 seconds. |

:::note Composing text from attributes is intended
A rule can build a display set's `label` or `SeriesDescription` out of any
attribute the instance carries — that is the point of templates here, and
relabelling a split ("SCOUT {SeriesDescription}", "b=0 / b=1000") is a main
reason to write a rule at all. It is a capability, not an oversight.

It does mean a rule decides what appears in the study browser and viewport
overlays, and the instance it reads from carries patient identifiers alongside
the acquisition tags. A rule that interpolates `PatientName` or `PatientID`
will therefore put them on screen — and, because the text is composed by a
*rule*, that can happen without anyone editing a viewer template.

So treat a split-rule set as content a reviewer reads, on the same footing as
the overlay configuration: whoever can write rules for a deployment can change
what its screens say. Loading rules from the URL is off unless
`customizationUrlPrefixes` names a prefix, and that prefix should point
somewhere with the same write controls as any other deployed configuration.
:::

### Rule errors

A rule can be critical for the clinician who views the study. A rule that the
viewer drops, or a fallback to the SOP class handlers, gives a grouping that
looks correct but is not the grouping that the deployment intended. So OHIF
stops display set creation when a rule has an error, and shows an error
notification. The notification stays on the screen until the user closes it.

:::caution
**A rule that does not compile** — an unknown name, an unknown field, an invalid
expression, a missing priority, a priority that is not a number or `null`, an
`id` that differs from the key — stops **all** display set creation. The
viewer creates no display sets, also not for SEG, SR or other SOP classes that
no rule matches. The notification names every rule that does not compile,
because OHIF compiles each rule alone.

**A rule that fails at run time** — a function that code supplies throws for a
series, in `matches`, a `groupBy` part, `sortBy` or `attributes`, a
code entry of the context throws, or the display set factory throws — stops
display set creation for **that study**. The notification names the rule, the
field and the series. The display sets that exist before the error stay. The
series does not go to the SOP class handlers, and the later series of the study
get no display sets.

The stop ends when the `splitRules` value changes (a new customization value
compiles again), and when the mode exits. The console holds the full error.
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
start. For example, `split/usTimeClusters` starts a new sweep after a gap of
more than 20 seconds. An ultrasound series arrives with images at 0 s and 10 s,
and one image at 50 s: two display sets, `[0 s, 10 s]` and `[50 s]`. Then an
image at 30 s arrives. Now no gap is longer than 20 seconds, so a split from
the start gives one display set. The re-split gives two: the image at 30 s
joins `[0 s, 10 s]`, the display set of its group, and `[50 s]` stays as it
is.

`splitKey` holds the rule id and the rule's `groupBy` values, and nothing
else. It holds no position. A display set keeps the key of the group that
created it.

`extendInstances` receives the series context of the re-split, so the re-sort
of the display set uses the values that the split used. The re-split computes
the context again from the whole series, but an instance never moves: a late
slice that changes the slice lattice, or a late image that joins two time
clusters, does not take instances out of an existing display set.

`splitNumber` is only an index into the engine's group list, and shifts when a
new group appears. Do not use it as a stable identity in `attributes`.

## Worked example: splitting a CT SCOUT image

`platform/app/public/customizations/split/scoutSeries.jsonc` (load with
`?customization=split/scoutSeries`) splits the localizer (scout) images off a
CT series into their own display set labelled `SCOUT`. A series value tests the
whole series, and the instance value tests each image:

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
            "context": {
              // Per instance: is this image a localizer?
              "isLocalizer": "includes(ImageType, 'LOCALIZER')",
              // Per series: does it MIX localizer and other images?
              "hasScout": "series.instances.count(isLocalizer) > 0 && series.instances.count(isLocalizer) < series.instances.count()"
            },
            "matches": {
              "Modality": "CT",
              "hasScout": true,
              "isLocalizer": true
            },
            "groupBy": ["SeriesInstanceUID"],
            "attributes": {
              "label": { "template": "SCOUT" },
              "SeriesDescription": { "template": "SCOUT {SeriesDescription}" }
            }
          }
        }
      }
    }
  }
}
```

Result, for four CT series:

| Series | Instances | Display sets |
|---|---|---|
| A | 1 localizer, then 11 axial | `ctScout` [1], `volume3d` [2–12] |
| B | 5 axial, no localizer | `volume3d` [1–5] |
| C | 3 localizers only | `volume3d` [1–3] — the series does not *mix* the two kinds, so it stays whole |
| D | 12 axial, the first one an unflagged scout | `volume3d` [all 12] |

Series D is the limit of this rule: a scanner that does not set `LOCALIZER` in
`ImageType` gives the rule nothing to detect. A series value can help there,
for example `"firstNumber": "series.instances.min(InstanceNumber)"`, or the
`planeGeometry` group, which leaves an image off the slice lattice (see
[The series context](#the-series-context)).

## Worked example: one display set per radiograph

The default rule `singleImageModality` is off, so the new split keeps a CR,
DX or MG series as one display set. The legacy stack handler always makes one
display set for each image of these modalities. A deployment that wants a
per-image split writes the split as a rule, and the rule can say which series
it applies to.

`platform/app/public/customizations/split/dxCrSingleImages.jsonc` (load with
`?customization=split/dxCrSingleImages`) splits a DX or CR series of fewer
than 10 images into one display set for each image. MG is not in the list, and
a larger series stays one display set:

```jsonc
"dxCrSingleImages": {
  "priority": -1,
  "viewportTypes": ["stack"],
  // True when the series has fewer than 10 instances.
  "context": { "isSmallSeries": "seriesInstanceCount < 10" },
  "matches": {
    "Modality": ["DX", "CR"],
    "isStackImage": true,
    "isSmallSeries": true
  },
  "groupBy": ["SeriesInstanceUID", "SOPInstanceUID"]
}
```

`seriesInstanceCount` is an entry of the default context, so a rule tests the
size of a series with one expression.

To get the legacy behavior back for all three modalities, turn the default
rule on again:

```js
useMetadataDisplaySet: { splitRules: { singleImageModality: { priority: { $set: 1 } } } }
```

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
  splitRules: { multiFrame: { $set: { ...myRule, priority: 2 } } },
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
`priority` is missing or is not a number does not compile, and stops display
set creation (see [Rule errors](#rule-errors)).
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
