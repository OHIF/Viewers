---
id: displaySetSplitting
title: Display Set Splitting
summary: Metadata-driven display set splitting with customizable split rules and safe $function expressions.
sidebar_position: 12
---

# Metadata-Driven Display Set Splitting

The `useMetadataDisplaySet` customization switches display set creation from
the stack SOP class handler to the split-rules engine of
`@cornerstonejs/metadata`.  Series instances are matched against an ordered
list of **split rules** (first matching rule wins per instance), grouped by
each rule's `groupBy` keys, and every group becomes one display set.

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
  /** ordered rules; first match wins per instance */
  splitRules: SplitRule[];
  /** builds an OHIF display set from a matched instance group */
  createDisplaySetFromGroup: (group, { splitNumber }) => DisplaySet;
}
```

The default `splitRules` (from `@ohif/extension-default`) are, in order:

| Rule id | Behavior |
|---|---|
| `singleImageModality` | CR/DX/MG — one display set **per image** (preserves multi-view mammography) |
| `multiFrame` | any image with `NumberOfFrames > 1` — one display set per instance (including US clips) |
| `mixedDimensionalityBValue` | MR series mixing instances with and without `DiffusionBValue` — split into separate display sets (fixes mixed-b-value DWI window leveling) |
| `volume3d` | CT/MR/PT/NM series with more than one instance — a single reconstructable display set |
| `defaultImageRule` | catch-all for remaining image instances |

The default display set factory (`createDisplaySetFromGroup`) builds the same
`ImageSet` the stack handler builds — same `label`, `supportsWindowLevel`,
`FrameOfReferenceUID`, `SOPClassHandlerId`, reconstructability checks and
messages — plus `splitKey` / `splitRuleId` / `viewportTypes` from the split
engine and the matched rule's `customAttributes`.

## Anatomy of a split rule

```ts
{
  id: 'myRule',
  viewportTypes: ['stack'],                    // preferred viewport hints
  series: ({ instances }) => ({ ... }),        // facts computed once per series
  matches: (instance, { series }) => boolean,  // per-instance predicate
  groupBy: ['SeriesInstanceUID', ...],         // tag names or functions
  customAttributes: (ctx, options) => ({ ... }) // extra display set attributes
}
```

Rules are evaluated in order and the **first** matching rule claims the
instance.  Groups are namespaced per rule, so two rules never merge their
instances even when their `groupBy` values collide.

In TypeScript (a mode or extension) rules are written with plain functions.
In **data-only customizations** — JSONC URL modules or JSON app configs,
which are parsed as data and never executed — rules are written declaratively
with `$function` expressions.

## `$function`: safe expressions in data customizations

A `{ "$function": "<expression>" }` value anywhere in a customization is
compiled — once, at read time — into a plain closure.  The expression
language is a small, safe subset of JavaScript expressions.  There is no
`eval` or `new Function` (CSP-safe), no assignments, no arbitrary calls, and
no prototype access (`__proto__`, `constructor` and `prototype` are rejected
at parse time).

Supported syntax:

- literals: numbers, `'strings'`, arrays, `true/false/null/undefined`, and
  template literals for building strings: `` `${SeriesDescription} #${InstanceNumber}` ``
- member/index access: `context.series.frameCount`, `instances[0]`
- comparison: `== != === !== < <= > >=` (`==`/`!=` treat `null` and
  `undefined` as equal and compare numeric strings numerically)
- logic and arithmetic: `&& || !`, `+ - * / %`, ternary `a ? b : c`
- membership: `Modality in ['CR', 'DX', 'MG']`
- helper functions: `defined(x)`, `includes(listOrString, v)`,
  `startsWith(s, p)`, `endsWith(s, p)`, `abs`, `min`, `max`, `round`,
  `floor`, `ceil`, `Number`, `String`
- aggregates over a list, evaluating the second argument once per element:
  `some(instances, DiffusionBValue != undefined)`,
  `every(list, expr)`, `count(list, expr)`, `minOf(list, expr)`,
  `maxOf(list, expr)`, `sumOf(list, expr)`

Name resolution: the compiled closure's arguments bind to declared parameter
names (default `['instance', 'context']`; override with
`{ "$function": { "expr": "...", "params": [...] } }`).  Bare identifiers
resolve parameter names first, then fields of the **first** argument — so in
a `matches` expression, bare `Modality` or `Rows` read the instance's DICOM
tags, while series facts are reached via `context.series`.

Expressions can return strings as well as booleans — the same mechanism
works for text-producing customizations such as viewport overlay items.

Where each rule field runs:

| Field | Arguments | Bare identifiers read |
|---|---|---|
| `series` fact | the series context | `instances` (the series' instance array) |
| `matches` | `(instance, context)` | the instance's DICOM tags; facts on `context.series` |
| `groupBy` entry | `(instance, context)` | the instance's DICOM tags |
| `customAttributes` value | `(instance, context)` | the group's first instance; `context.instances`, `context.splitNumber` |

Parse errors are reported at customization-read time with the offending
expression; runtime errors warn once and evaluate to `undefined`.

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
        // PREPEND: the rule must run before `volume3d` claims the series.
        "$unshift": [
          {
            "id": "ctScout",
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
        ]
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
// Prepend a higher-priority rule (see the SCOUT example above)
useMetadataDisplaySet: { splitRules: { $unshift: [myRule] } }

// Append a fallback rule (only sees instances no default rule matched)
useMetadataDisplaySet: { splitRules: { $push: [myRule] } }

// Replace one rule in place
useMetadataDisplaySet: {
  splitRules: {
    $apply: rules => rules.map(r => (r.id === 'singleImageModality' ? myRule : r)),
  },
}

// Replace the whole rule set
useMetadataDisplaySet: { splitRules: { $set: [ruleA, ruleB] } }
```

:::note
Because rules are first-match-wins, a `$push`-ed rule only receives
instances that none of the default rules claimed.  Rules that should take
precedence over the defaults must be `$unshift`-ed (or the array replaced).
:::

:::caution
The OHIF default rules deliberately claim only image instances.  A custom
rule that matches video/whole-slide/ECG or non-image SOP classes takes those
instances away from their dedicated extensions — the resulting display sets
will not work with those extensions' viewports.
:::
