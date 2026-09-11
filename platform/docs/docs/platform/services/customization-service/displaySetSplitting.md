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
| `volume3d` | CT/MR/PT series with more than one instance — a single reconstructable display set |
| `defaultImageRule` | catch-all: one display set per series for every remaining stack-owned instance |

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

- literals: numbers (including exponent notation, `1e3`, `2.5E-3`),
  `'strings'`, arrays, `true/false/null/undefined`, and template literals for
  building strings: `` `${SeriesDescription} #${InstanceNumber}` ``
- member/index access: `context.series.frameCount`, `instances[0]`
- comparison: `== != === !== < <= > >=` (`==`/`!=` treat `null` and
  `undefined` as equal and compare numeric strings numerically)
- logic and arithmetic: `&& || !`, `+ - * / %`, ternary `a ? b : c`
- membership: `Modality in ['CR', 'DX', 'MG']`
- helper functions: `defined(x)`, `includes(listOrString, v)`,
  `startsWith(s, p)`, `endsWith(s, p)`, `abs`, `min`, `max`, `round`,
  `floor`, `ceil`, `Number`, `String` (`min()`/`max()` with no arguments
  evaluate to `undefined` rather than `±Infinity`)
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
all, `customizationFunctionPolicy.denyAttributes` is where to withhold it — deny
`customAttributes.label` and `customAttributes.SeriesDescription` and rules can
still split, just not relabel.
:::

Where each rule field runs:

| Field | Arguments | Bare identifiers read |
|---|---|---|
| `series` fact | the series context | `instances` (the series' instance array) |
| `matches` | `(instance, context)` | the instance's DICOM tags; facts on `context.series` |
| `groupBy` entry | `(instance, context)` | the instance's DICOM tags |
| `customAttributes` value | `(instance, context)` | the group's first instance; `context.instances`, `context.splitNumber` |

Parse errors are reported at customization-read time with the offending
expression; runtime errors warn once and evaluate to `undefined`.

The expression language itself lives in `@cornerstonejs/metadata` (as
`compileExpression`, part of its **safe functions**) rather than in OHIF, so a
server building a study index compiles the same rules the viewer does. OHIF
contributes only the `$function` marker that wires it into customizations.

### How a `$function` is called

The compiled closure's parameters are declared by the code that **calls** it, not
by the data that writes it:

```ts
customizationService.registerFunctionSignatures({
  'useMetadataDisplaySet.splitRules.matches': ['instance', 'context'],
  'useMetadataDisplaySet.splitRules.compareInstances': ['a', 'b', 'context'],
});
```

`@ohif/extension-default` registers the split-rule signatures, so a rule written
in JSONC does not state a convention and cannot state a wrong one. A marker that
declares `params` disagreeing with the registered signature is compiled with the
registered one and warns — data changing its own calling convention is how a
marker computes nonsense while looking correct. With nothing registered for a
path, the default `['instance', 'context']` applies and a marker's own `params`
are honoured.

This is what makes an ordering comparator declarable as data, since a comparator
needs both instances in scope:

```jsonc
{
  "id": "spatial",
  "matches": { "$function": "Modality === 'CT'" },
  "compareInstances": { "$function": "a.SliceLocation - b.SliceLocation" }
}
```

Returning 0 from a comparator declines to have an opinion rather than asserting
the two instances are interchangeable: OHIF's default order (the
`instanceSortingCriteria` customization, else patient position, else instance
number) is the base, and whatever the comparator does not decide keeps it. So a
rule can order by one attribute and leave the rest of the ordering alone.

:::caution Bare identifiers still bind to the first argument
In a comparator, a bare `SliceLocation` resolves against `a` — the first
argument — rather than being an error, so `SliceLocation - b.SliceLocation`
silently means `a.SliceLocation - b.SliceLocation`. Write `a.` and `b.`
explicitly in a comparator.
:::

### Withholding an attribute from data

A `$function` cannot run code; it computes the value of the attribute it sits on
from the subject it is handed. A deployment that nonetheless wants to keep data
out of a particular attribute names it in
`appConfig.customizationFunctionPolicy.denyAttributes`:

```js
window.config = {
  customizationFunctionPolicy: {
    denyAttributes: [
      // this deployment composes series labels centrally
      'useMetadataDisplaySet.splitRules.customAttributes.SeriesDescription',
    ],
  },
};
```

A path is the chain of object keys from the customization id to the key holding
the marker. **Array indices are not segments**, so one pattern covers every rule
in a list and stays valid when the list is reordered. `*` matches exactly one
segment (useful for author-named keys such as a series fact); a trailing `**`
matches any remaining segments. A refused marker resolves to `undefined` with a
console warning naming the path, and the rest of the rule still applies.

**Nothing is denied by default.** `['**']` switches `$function` off entirely.

It is a deny list rather than an allow list because the set of attributes a rule
may legitimately compute is not knowable in advance — a rule's
`customAttributes` keys are chosen by its author — so an allow list would refuse
working configurations by default, which is a worse failure than the one it
would prevent.

Like `customizationUrlPrefixes`, this policy is read from the **app config and
never from a customization** — customizations can be loaded from the URL, so a
customization able to define the policy could lift its own restrictions.

### Unknown attributes resolve to `undefined`

An expression naming an attribute the instance does not carry evaluates to
`undefined` rather than throwing, which is what makes sparse DICOM tags usable
(`DiffusionBValue != undefined`). The cost is that a typo behaves the same way:
`Modallity === 'CT'` compiles cleanly and then matches nothing.

There is deliberately no validation against a known-attribute list. A
naturalized instance carries private tags, vendor additions and per-frame data
folded in by the naturalizer, so no dictionary enumerates it — validating
against one would reject expressions that would have worked, and a false
rejection breaks a deployment where a silent no-match only puzzles one.

When a rule mysteriously matches nothing, a misspelt attribute is the first
thing to check. `collectIdentifiers` from `@cornerstonejs/metadata` reports what
an expression actually reads, which is the quickest way to see it.

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

### Identity is not stable across rule changes

`splitKey` — the key used to reconcile a re-split series against the display
sets already created for it — is namespaced with the rule's **index** in the
rules array. Changing the rules after studies have loaded (a mode
`$unshift`-ing a rule mid-session) retires every previous key, so those display
sets are recreated under fresh `displaySetInstanceUID`s and lose viewport
state. Configure split rules before loading studies.

`splitNumber` is likewise only an index into the engine's key-sorted group
list, and shifts when a new group appears. Do not use it as a stable identity
in `customAttributes`.

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
