---
id: displaySetSplitting
title: Display Set Splitting
summary: Metadata-driven display set splitting with the @cornerstonejs/metadata split rules - turning it on, the metadataContext customization, the SOP class handlers that extend the display sets, and new instances and new rules.
sidebar_position: 12
---

# Metadata-Driven Display Set Splitting

The `useMetadataDisplaySet` customization switches display set creation from
the SOP class handlers to the split-rules engine of `@cornerstonejs/metadata`.
Series instances are matched against a set of **split rules**, keyed by rule id
and evaluated in `priority` order (the first matching rule wins for each
instance), grouped by each rule's `groupBy` keys, and every group becomes one
display set.

The feature is **off by default**. With the rules off, the SOP class handlers
make the display sets exactly as before.

This page has four topics:

1. [The split rules](#the-split-rules): how to turn the split on, the default
   rules, the optional modules, and how to change a rule.
2. [The `metadataContext` customization](#the-metadatacontext-customization):
   the lists and the names that the rules read.
3. [Handlers](#handlers-handlernames-and-extenddisplayset): how a SOP class
   handler extends the display sets of a rule.
4. [New instances and new rules](#new-instances-and-new-rules): what happens
   when instances or rules arrive later.

The rule language — the rule fields, the tests, the context, the expressions —
is a part of `@cornerstonejs/metadata`. OHIF has no rule language of its own.
See the Cornerstone docs:
[Display sets](https://www.cornerstonejs.org/docs/concepts/cornerstone-metadata/display-sets)
and [Safe functions](https://www.cornerstonejs.org/docs/concepts/safe-functions).
[Split rule expressions](./functionExpressions.md) gives the OHIF details.

## The split rules

### Turning the split on

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

### The customization value

```ts
useMetadataDisplaySet: {
  /** default false */
  enabled: boolean;
  /** rules keyed by id; ascending priority, first match wins for each instance.
   *  Default: the @cornerstonejs/metadata default rule set (displaySetRules). */
  splitRules: Record<string, RawSplitRule>;
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

The context that the rules read is not a part of this value. It is the
separate [`metadataContext`](#the-metadatacontext-customization)
customization.

### The default rules

The default `splitRules` is the default rule set of `@cornerstonejs/metadata`.
OHIF does not copy or change it. The Cornerstone docs list the rules, their
priorities and their handlers:
[The default rules](https://www.cornerstonejs.org/docs/concepts/cornerstone-metadata/display-sets#the-default-rules).

| Data | Display sets |
|---|---|
| CR, DX, MG | One display set for each instance. A four-view MG series gives four display sets. |
| Video, ECG, whole slide | One display set for each object, with the handler of that kind of object. |
| Multi-frame image | One display set for each `SOPInstanceUID`, in `InstanceNumber` order. A multi-frame instance that is not a clip, for example an Enhanced CT, opens as a volume. |
| CT, MR, PT series with localizer images and other images | One display set for the localizer images (`isLocalizer: true`), and the other display sets for the other images. |
| CT, MR, PT, NM series | One volume display set for each series, or the `mixedDimensionalityBValue` split of a diffusion series. |
| SEG, RTSTRUCT, parametric map, SR, encapsulated document, bulk annotation, chart | One display set for each series, with the handler of that kind of object. |
| Presentation states and other objects | The unsupported display set. |

The default rules use the priorities `10` to `160`, in steps of 10. A rule with
a priority below `0` runs before every default rule, a rule between two
defaults uses a number that is not a multiple of 10, and a rule with a priority above `10000` runs
after every default rule, before the `unsupported` catch-all. A priority of
`null` turns a rule off.

### Optional modules

Each module in `platform/app/public/customizations/split/` is a data file. A
module has no effect until a site loads it, and a load turns it on.

| Module | Case |
|---|---|
| `split/enableNewSplit` | Turns the split on. Every other module requires it. |
| `split/singleImagesBySize` | Groups the single CR, DX and MG images of a series by image size, in place of one display set for each image. |
| `split/decimation` | Splits a series of more than `decimationSize` (default 1000) single-frame images into `ceil(count / decimationSize)` display sets, by `sliceIndex` modulo the count. |
| `split/scoutSeries` | Splits the localizer images off a CT series, labelled `SCOUT`. |
| `split/dwiByBValue` | One display set for each b-value of a diffusion MR series. |
| `split/regularVolume` | A volume series with some irregular images: the regular slices become one volume display set. |
| `split/volumeProjectionOrder` | Orders the slices of `volume3d` by the distance along the normal. |
| `split/usTimeClusters` | An ultrasound series of several sweeps: one display set for each sweep. |

The modules, and every other split file, use only the standard
`immutability-helper` commands (`$set`, `$merge`, `$push`, ...). They do not
use the OHIF command `$filter`. So a server that uses `@cornerstonejs/metadata`,
`immutability-helper` and a JSONC parser, and no OHIF code, applies the same
files to the same defaults and gets the same rules. A unit test
(`urlSplitModules.test.ts`) checks this for each module.

### Changing a rule

Split rules resolve through the usual customization scopes
(global → mode → default) and can be edited with immutability-helper
commands:

```js
// Add a rule that runs before every default rule
useMetadataDisplaySet: { splitRules: { $merge: { myRule: { ...myRule, priority: -1 } } } }

// Add a fallback rule (only sees instances no default rule matched)
useMetadataDisplaySet: { splitRules: { $merge: { myRule: { ...myRule, priority: 20000 } } } }

// Change one field of a rule, and keep its place
useMetadataDisplaySet: { splitRules: { volume3d: { sortBy: { $set: ['displaySet.sliceDistance'] } } } }

// Turn one rule off
useMetadataDisplaySet: { splitRules: { volume3d: { priority: { $set: null } } } }
```

A keyed rule set cannot hold two rules with one id, so a customization layer
replaces or edits a rule instead of adding a copy of it.

:::caution
A custom rule that claims video, whole-slide, ECG, SEG, RTSTRUCT, parametric
map or another object with a dedicated extension must name the `handler` of
that kind of object (see [Handlers](#handlers-handlernames-and-extenddisplayset)).
A rule with no `handler` makes an image display set. "Has `Rows`" is not a safe
test for an image: SEG and parametric map are multi-frame image objects. Test
the SOP class with a list of the `metadataContext`, for example
`"isImage": true`.
:::

:::note Composing text from attributes
A rule can build a display set's `label` or `SeriesDescription` from any
attribute that the instance carries, and the instance carries the patient
identifiers too. So treat a split-rule set as content that a reviewer reads,
as the overlay configuration. Loading rules from the URL is off unless
`customizationUrlPrefixes` names a prefix, and that prefix must have the same
write controls as any other deployed configuration.
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
notification names every rule that does not compile.

**A rule that fails at run time** — a function that code supplies throws, or
the display set factory or a handler's `extendDisplaySet` throws — stops
display set creation for **that study**. The notification names the rule, the
field and the series. The display sets that exist before the error stay.

The stop ends when the `splitRules` value changes, and when the mode exits.
The console holds the full error.
:::

## The `metadataContext` customization

The rules read names: DICOM keywords, and the names of the **metadata
context**. The `metadataContext` customization holds that context. It is a
customization of its own, and not a part of `useMetadataDisplaySet`, so other
features can read it when the split rules are off.

The default value is the `@cornerstonejs/metadata` `defaultMetadataContext`,
with one OHIF change: the private OHIF chart SOP class
(`1.9.451.13215.7.3.2.7.6.1`) is added to the end of `chartSopClassUids`. The
value is data only: it holds no function. The Cornerstone docs describe each
entry:
[The default context](https://www.cornerstonejs.org/docs/concepts/cornerstone-metadata/display-sets#the-default-context)
and
[The SOP class lists](https://www.cornerstonejs.org/docs/concepts/cornerstone-metadata/display-sets#the-sop-class-lists).

The lists have the same names in OHIF, in the Cornerstone defaults and on a
server:

| List | Read by |
|---|---|
| `imageSopClassUids` | `isImage` |
| `videoSopClassUids`, `videoTransferSyntaxUids`, `longVideoSopClassUids`, `longVideoMinFrames` | `isVideo` |
| `ecgSopClassUids` | `isEcg` |
| `wholeSlideSopClassUids` | `isWsi` |
| `segmentationSopClassUids` | `isSegmentation` |
| `rtStructureSetSopClassUids` | `isRtStructureSet` |
| `parametricMapSopClassUids` | `isParametricMap` |
| `structuredReportSopClassUids` | `isStructuredReport` |
| `encapsulatedDocumentSopClassUids` | `isEncapsulatedDocument` |
| `bulkAnnotationSopClassUids` | `isBulkAnnotation` |
| `chartSopClassUids` | `isChart` |

A site changes a list with a standard command. This overlay makes a private
image SOP class an image for the default rules:

```jsonc
{ "global": { "metadataContext": { "imageSopClassUids": { "$push": ["1.2.3.4"] } } } }
```

The same overlay works in OHIF, on the Cornerstone defaults, and on a server.
Use `$push` to add to a list, and `$set` to replace a value, for example
`{ "longVideoMinFrames": { "$set": 120 } }`.

OHIF also makes the `metadataContext` value the active context of
`@cornerstonejs/metadata` (`setMetadataContext`), at mode start and each time a
customization changes. So a list change applies to the split rules and to the
code tests of `@cornerstonejs/metadata`: `isImageInstance`, `isVideoInstance`,
`isEcgInstance` and `isWsiInstance`. At mode exit, the default context is
active again.

Today the split rules read `metadataContext`. A later change lets the hanging
protocols and the mode applicability read the same names.

## Handlers: `handlerNames` and `extendDisplaySet`

A rule can name a **handler** for its display sets, for example
`"handler": "segmentation"`. The names are generic: `image`, `video`,
`wholeSlide`, `ecg`, `segmentation`, `rtStructureSet`, `parametricMap`,
`structuredReport`, `encapsulatedDocument`, `bulkAnnotation`, `chart`,
`unsupported`. A rule with no `handler` makes an image display set and calls no
handler. That is the common case for images.

A SOP class handler declares the names that it serves as data, and the function
that adds its fields:

```js
{
  name: 'dicom-seg',
  sopClassUids,
  getDisplaySetsFromSeries,           // the SOP class handler path (rules off)
  handlerNames: ['segmentation'],     // the split-rule path (rules on)
  extendDisplaySet: (displaySet, { addedInstances, servicesManager, extensionManager }) => {
    // add the SEG fields to displaySet, in place
  },
}
```

OHIF builds each display set of a rule in three steps:

1. `createDisplaySetFromGroup` of `@cornerstonejs/metadata` builds the display
   set of the group. A server builds the same one.
2. The OHIF generic step builds the OHIF display set with the series identity,
   and copies `splitKey`, `splitRuleId`, `splitGroupId`, `handler` and the
   rule's `attributes` from step 1. For a rule with no
   handler, or with the `image` handler, it also adds the image fields: the
   stack `SOPClassHandlerId`, `isReconstructable`, the messages, the thumbnail
   and the instance order. `@cornerstonejs/metadata` gives `isReconstructable`
   from the instance data, OHIF refines it for display, and a rule attribute
   `isReconstructable` wins over both.
3. The `extendDisplaySet` of the handler adds the handler fields. The function
   is synchronous, and changes the display set in place. `addedInstances` is
   undefined when the display set is created, and lists the new instances
   (already in `displaySet.instances`) when the display set grows. Asynchronous
   work stays in `load()`.

The rules:

- When two handlers of a mode declare the same name, the order of the handlers
  in the mode's `sopClassHandlers` decides: the first one serves the name.
- A name that no handler of the mode declares gives the unsupported display
  set, and one console warning for each name.
- A handler that declares `handlerNames` and has no `extendDisplaySet` is an
  error when the mode registers its handlers.
- With the rules off, `getSopClassHandlerModule` runs as before. The
  recognizer part of a handler (for example the video transfer syntax test)
  runs only when the rules are off; with the rules on, the rule recognizes the
  object.

The OHIF handlers:

| Handler | `handlerNames` |
|---|---|
| `@ohif/extension-default` stack | `image` |
| `@ohif/extension-default` not-supported-display-sets-handler | `unsupported` |
| `@ohif/extension-default` chart | `chart` |
| `@ohif/extension-dicom-video` | `video` |
| `@ohif/extension-dicom-pdf` | `encapsulatedDocument` |
| `@ohif/extension-cornerstone` DicomMicroscopySopClassHandler | `wholeSlide` |
| `@ohif/extension-cornerstone` DicomEcgSopClassHandler | `ecg` |
| `@ohif/extension-cornerstone-dicom-seg` | `segmentation` |
| `@ohif/extension-cornerstone-dicom-rt` | `rtStructureSet` |
| `@ohif/extension-cornerstone-dicom-pmap` | `parametricMap` |
| `@ohif/extension-cornerstone-dicom-sr` (both entries) | `structuredReport` |
| `@ohif/extension-dicom-microscopy` DicomMicroscopySRSopClassHandler | `structuredReport` |
| `@ohif/extension-dicom-microscopy` DicomMicroscopyANNSopClassHandler | `bulkAnnotation` |

**Revision chains of PDFs and charts.** With the rules on, the default rules
group the instances of one revision chain (`PredecessorDocumentsSequence`, in
the same series) into one display set. The display set holds every revision in
`instances`, with the active revision last, and names it in
`activeSopInstanceUid`. The `encapsulatedDocument` and `chart` handlers load
that instance, else the last instance, and choose again when the display set
grows. This is a bug fix: a replaced PDF or chart revision no longer shows as a
separate display set, and the older revisions stay in the display set. An
instance with no chain gives its own display set. SR and SEG do not change.

A Comprehensive 3D SR is a `structuredReport`. In the microscopy mode, the
microscopy SR handler is first, so it shows the SR. In the other modes, the
cornerstone SR handler shows it.

No default rule and no OHIF split module sets viewport types. A custom rule
may set `viewportTypes`, and OHIF keeps them on the display set as data, but
OHIF does not read them. The handler decides how OHIF shows the display set,
from the instance data: the image part of the generic step for a rule with no
handler or the `image` handler, and the handler's `extendDisplaySet` for the
other names. Each display set of a rule has `splitKey` and `splitRuleId`, also
when a handler extends it.

## New instances and new rules

### New instances: OHIF adds, a server re-splits

**OHIF adds a new instance to the display sets, and does not re-split.** When
new instances of a series arrive, an instance that already has a display set
stays in it. A display set is never deleted, never loses an instance, and keeps
its `displaySetInstanceUID`, so viewport state survives. OHIF places only the
instances that are new to the series:

1. into the existing display set that holds the other instances of their group,
   through that display set's `extendInstances` hook, and then the handler's
   `extendDisplaySet` with `addedInstances`;
2. else into the existing display set with their group's `splitKey`;
3. else into a new display set of their own.

A saved SEG or SR instance goes on the end of its display set, and the display
set shows the newest instance.

**A server re-splits the whole series when an instance arrives.** So OHIF and a
server can give different display sets for the same series, when instances
arrive in parts. For example, `split/usTimeClusters` starts a new sweep after a
gap of more than 20 seconds. An ultrasound series arrives with images at 0 s
and 10 s, and one image at 50 s: two display sets, `[0 s, 10 s]` and `[50 s]`.
Then an image at 30 s arrives. A server re-splits, and gives one display set,
because no gap is longer than 20 seconds. OHIF gives two: the image at 30 s
joins `[0 s, 10 s]`, and `[50 s]` stays. A reload of the study in OHIF gives
the server result.

`splitKey` holds the rule id and the rule's `groupBy` values, and no position.
A display set keeps the key of the group that created it. `splitNumber` is only
an index into the engine's group list, and shifts when a new group appears. Do
not use it as a stable identity.

### New rules at run time

A rule that you add at run time applies to later loads and to new instances
only. The display sets that exist do not change. A re-run of all rules is
later work.

This console example adds the SCOUT rule through the global services. Run it
in the browser console of the viewer, then open a study from the study list:

```js
const { customizationService } = window.services;
customizationService.setCustomizations(
  {
    useMetadataDisplaySet: {
      enabled: { $set: true },
      splitRules: {
        $merge: {
          ctScout: {
            priority: -1,
            context: {
              isLocalizer: "includes(ImageType, 'LOCALIZER')",
              hasScout:
                'series.instances.count(isLocalizer) > 0 && ' +
                'series.instances.count(isLocalizer) < series.instances.count()',
            },
            matches: { Modality: 'CT', hasScout: true, isLocalizer: true },
            groupBy: ['SeriesInstanceUID'],
            attributes: { SeriesDescription: { template: 'SCOUT {SeriesDescription}' } },
          },
        },
      },
    },
  },
  customizationService.Scope.Global
);
```

The global scope keeps the rule when the mode changes. A page reload removes
it. A rule with an error stops display set creation, as a rule from any other
source does (see [Rule errors](#rule-errors)).

### Testing notes

1. Open a CT study with a localizer image. Check that the study browser shows
   one display set for the series.
2. Go back to the study list, and run the console example above.
3. Open the same study again. Check that the study browser shows a `SCOUT`
   display set and a volume display set for the series.
4. Open an MG study with four views and `?customization=split/enableNewSplit`.
   Check that the study browser shows four display sets.
