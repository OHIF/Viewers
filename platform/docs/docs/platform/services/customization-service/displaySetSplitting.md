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
  /** named instance classifiers the rules reference, e.g. { stackImage } (code) */
  classifiers?: Record<string, (instance) => boolean>;
  /** builds an OHIF display set from a matched instance group */
  createDisplaySetFromGroup: (group, { splitNumber, compareInstances }) => DisplaySet;
  /** optional host comparator (code), consulted after a rule's own compareInstances */
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
"is this an image?" list tends to miss. The rules reference that test by name, as the `stackImage` classifier (see [What only code can supply](#what-only-code-can-supply)).

The default display set factory (`createDisplaySetFromGroup`) builds the same
`ImageSet` the stack handler builds — same `label`, `supportsWindowLevel`,
`FrameOfReferenceUID`, `SOPClassHandlerId`, reconstructability checks and
messages — plus `splitKey` / `splitRuleId` / `splitGroupId` / `viewportTypes` from the split
engine and the matched rule's `customAttributes`.

## Anatomy of a split rule

Split rules are `@cornerstonejs/metadata` **raw selector** data: the same
safe-function vocabulary the upstream default rules are written in, compiled by
`createDisplaySetSplitRules`. OHIF has no rule language of its own. A rule reads
the same whether it is in a mode, in the app config, or in a JSONC file that the
viewer loads from the URL:

```jsonc
// splitRules.myRule
{
  "priority": -1,                                  // evaluation order; null turns it off
  "viewportTypes": ["stack"],                      // preferred viewport hints
  "series": [                                      // facts, evaluated once per series
    { "name": "hasScout", "scope": "mixed",
      "when": { "attribute": "ImageType", "contains": "LOCALIZER" } }
  ],
  "matches": {                                     // per-instance condition
    "all": [{ "seriesFact": "hasScout" },
            { "attribute": "ImageType", "contains": "LOCALIZER" }]
  },
  "groupBy": ["SeriesInstanceUID"],                // tag names or values
  "compareInstances": { "attribute": "SliceLocation", "number": true },
  "customAttributes": {                            // extra display set attributes
    "set": { "label": "SCOUT" },
    "fromFirstInstance": {
      "SeriesDescription": { "expression": "`SCOUT ${SeriesDescription}`" }
    }
  }
}
```

A condition or a value can also be an expression, for the cases the structural
form does not cover: `{ "expression": "Modality === 'CT' && Rows > 256" }`. The
vocabulary, the expression grammar and how to diagnose an expression that
matches nothing are described in [split rule expressions](./functionExpressions.md)
and in the `@cornerstonejs/metadata` documentation of display sets and safe
functions.

Rules are evaluated in priority order and the **first** matching rule claims
the instance.  Groups are namespaced per rule id, so two rules never merge
their instances even when their `groupBy` values collide.

### What only code can supply

Some tests cannot be expressed as data — the OHIF defaults need the stack SOP
class handler's own SOP class list, for one. Code supplies such a test as a
**named classifier**, and a rule references it by name:

```js
useMetadataDisplaySet: {
  classifiers: { stackImage: isStackImageInstance }, // code
  splitRules: { myRule: { priority: 3, matches: { classifier: 'stackImage' } } }, // data
}
```

`@ohif/extension-default` registers `stackImage`. A rule that references a
classifier that no code registered does not compile, and so stops display set
creation (see [Rule errors](#rule-errors)). Named `customAttributePresets` work
the same way for custom attributes.

A mode or an extension in TypeScript can also supply a rule that is already
compiled — plain functions for `matches`, `groupBy` and the other fields. The
compiler does not compile such a rule again, and checks only its `id` and its
`priority`. A raw rule cannot fail at run time, because the safe functions give
a definite result for every instance. A function that code supplies — a rule
field or a classifier — can throw. OHIF wraps every function of every rule, so
the error names the rule and the field.

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
the split: groups and split keys stay per rule id. A rule's `customAttributes`
cannot change `splitRuleId`, `splitGroupId` or `splitKey`.

### Ordering

A rule orders its display sets with `compareInstances`:
`{ "attribute": "SliceLocation", "number": true }` sorts ascending by that
attribute, and `"descending": true` reverses it. An instance that does not carry
the attribute declines to have an opinion, and OHIF's default order (the
`instanceSortingCriteria` customization, else patient position, else instance
number) decides. So a rule can order by one attribute and leave the rest of the
ordering alone.

The top-level `useMetadataDisplaySet.compareInstances` is a comparator function
`(a, b, context)` that code supplies. The engine consults it after the rule's
own `compareInstances`, and the display set factory applies both again whenever
it re-sorts a display set.

:::note Composing text from attributes is intended
A rule can build a display set's `label` or `SeriesDescription` out of any
attribute the instance carries — that is the point of templates here, and
relabelling a split ("`SCOUT ${SeriesDescription}`", "b=0 / b=1000") is a main
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
**A rule that does not compile** — an unknown classifier, an invalid
expression, a missing priority, a priority that is not a number or `null`, an
`id` that differs from the key — stops **all** display set creation. The
viewer creates no display sets, also not for SEG, SR or other SOP classes that
no rule matches. The notification names every rule that does not compile,
because OHIF compiles each rule alone.

**A rule that fails at run time** — a function that code supplies throws for a
series, in `matches`, a `groupBy` part, `runBy`, `series`, `compareInstances`
or `customAttributes`, or the display set factory throws — stops display set
creation for **that study**. The notification names the rule, the field and
the series. The display sets that exist before the error stay. The series does
not go to the SOP class handlers, and the later series of the study get no
display sets.

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
`?customization=split/scoutSeries`) splits the localizer (scout) images off a
CT series into their own display set labelled `SCOUT`. It first evaluates the
series, and then matches each instance with a simple test:

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
            // Evaluated once per series: does it MIX localizer and other images?
            "series": [
              {
                "name": "hasScout",
                "scope": "mixed",
                "when": { "attribute": "ImageType", "contains": "LOCALIZER" }
              }
            ],
            // Then per instance: is this image a localizer?
            "matches": {
              "all": [
                { "attribute": "Modality", "equals": "CT" },
                { "seriesFact": "hasScout" },
                { "attribute": "ImageType", "contains": "LOCALIZER" }
              ]
            },
            "groupBy": ["SeriesInstanceUID"],
            "customAttributes": {
              "set": { "label": "SCOUT" },
              "fromFirstInstance": {
                "SeriesDescription": { "expression": "`SCOUT ${SeriesDescription}`" }
              }
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
`ImageType` gives the rule nothing to detect. Recognizing its scout needs a
series fact that is a number (for example, the lowest `InstanceNumber`), and
the raw selector has boolean series facts only.

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
