---
sidebar_label: Display Set Split Rules
title: Display Set Split Rules Customization
summary: How to customize the rules that split a series into display sets using a serializable "raw display set selector", and how the same rules are shared with server-side consumers such as static-dicomweb without redefining them.
sidebar_position: 13
---

# Display Set Split Rules

> **Status: proposed integration.** The rule engine and the raw selector described
> here live in `@cornerstonejs/metadata` today and are exercised by its own tests.
> OHIF's image SOP class handler still splits series with its own imperative logic
> (`extensions/default/src/getSopClassHandlerModule.js`); the customization keys
> below describe how OHIF is intended to feed the shared rules once it adopts
> them. Nothing here changes OHIF's current display set behaviour.

A **display set** is the unit a viewport renders: the instances of a series that
should be shown together, plus which viewport types can render them. A series does
not always become one display set — a diffusion MR series that mixes 4D b-value
frames with trailing frames that have none must split, or the wrong window/level
is applied to the 3D part.

The rules that decide those splits are needed in more than one place.

## The problem: two implementations of one rule set

OHIF splits a series **on the client**, as it loads metadata. But a back end often
wants the same answer **on the server**: `static-dicomweb`, building a study's
metadata tree, can only advertise display sets if it computes the same ones the
viewer will build. Historically each side implemented the rules itself, which means
they drift — and a drifted rule is not a cosmetic problem: the server describes a
study one way and the viewer renders it another.

The fix is to have exactly one definition of the rules, expressed in a form both
sides can consume.

## The shape of the shared definition

`@cornerstonejs/metadata` splits the rules into two pieces:

1. **The raw display set selector** — the rules as **pure JSON data**
   (`rawDisplaySetSelector`). Conditions, groupings, and derived series facts are
   all declarative; there are no functions in it.
2. **The compiler** — `createDisplaySetSplitRules(selector, options)`, which turns
   that data into the predicate functions the split engine runs.

```js
import {
  createDisplaySetSplitRules,
  rawDisplaySetSelector,
} from '@cornerstonejs/metadata';

const splitRules = createDisplaySetSplitRules(rawDisplaySetSelector);
```

Because the selector is JSON, it travels: a deployment can keep one selector, serve
it to a Node back end that reads it from config, and hand the identical value to
OHIF through the customization service. Both compile it with the same function and
get the same splits. Nobody redefines anything.

The compiled predicates are **safe functions**: the compiler assembles them from a
fixed vocabulary of operators, so there is no `eval` and no `new Function` anywhere
on the path from selector data to executed code. A selector is therefore safe to
accept from a config file, an HTTP response, or a customization — the worst a
malformed one can do is throw at compile time, naming the offending fragment.

The vocabulary is not specific to display sets — it is a general facility in
Cornerstone3D, intended to replace hand-written matching code elsewhere (hanging
protocol matching being the obvious candidate). See
[Safe Functions](https://www.cornerstonejs.org/docs/concepts/safe-functions) for
the full condition and value reference, and
[Display Sets → Sharing rules between
applications](https://www.cornerstonejs.org/docs/concepts/cornerstone-metadata/display-sets#sharing-rules-between-applications-the-raw-selector)
for how a selector travels between a server and OHIF.

## Customizing the selector in OHIF

The intended integration uses two customizations. Both are plain data, which is
what keeps them shareable with a server.

| Customization                | Type                        | Purpose                                                        |
| ---------------------------- | --------------------------- | -------------------------------------------------------------- |
| `displaySetSelector`         | `RawSplitRule[]`            | The whole rule set, as data. Defaults to `rawDisplaySetSelector`. |
| `displaySetClassifiers`      | `Record<string, (i) => boolean>` | Named classifiers a selector may reference by name.        |

In `platform/app/public/config/default.js`:

```js
window.config = {
  customizationService: {
    // Claim ultrasound series before the default rules see them, so interleaved
    // single frames and clips become one display set per run.
    displaySetSelector: [
      {
        id: 'usInterleaved',
        viewportTypes: ['stack'],
        matches: { attribute: 'Modality', equals: 'US' },
        runBy: { condition: { attribute: 'NumberOfFrames', greaterThan: 1 } },
      },
      // ...then the defaults. Spread them in from the package, or inline the
      // JSON if this config must stay dependency-free.
    ],
  },
};
```

Rules are evaluated in order and the first match wins per instance, so position
matters. Every rule needs a unique `id`: an id namespaces the bucket keys its rule
produces, which is what lets the selector be edited — reordered, or a rule inserted
— without changing the other rules' display set identities.

The consuming code resolves the customization and compiles it:

```js
const selector =
  customizationService.getCustomization('displaySetSelector') ??
  rawDisplaySetSelector;

const splitRules = createDisplaySetSplitRules(selector, {
  classifiers: customizationService.getCustomization('displaySetClassifiers'),
});
```

Note the direction of the dependency. Cornerstone3D never reads the customization
service, and must not: it is an OHIF service, and a rule set that could only be
resolved through it would be unusable on a server. OHIF resolves its own overrides
and passes the resulting data down. That is the whole reason the selector is data
rather than a module of functions.

### Non-image objects are surfaced, never dropped

Every image rule requires a renderable image, so a series can hold objects no rule
claims — SEG, RTSTRUCT, RTDOSE, SR, encapsulated PDF, presentation states. The
default selector's last rule is a catch-all that claims them and marks the result
**not displayable** rather than dropping it, because a dropped instance leaves no
trace that the object was in the study at all:

```js
displaySet.isDisplayable;         // false
displaySet.preferredViewportType; // 'none' — not a misleading 'stack'
displaySet.imageIds;              // [] — nothing to render
displaySet.sopClassUids;          // what it is, so the UI can say which kind
displaySet.instances;             // Modality, SeriesDescription, ...
```

Check `isDisplayable` before mounting a display set on a viewport. A study browser
can list these and explain why they are not viewable.

OHIF already handles most of these formats through dedicated SOP class handlers
(`@ohif/extension-cornerstone-dicom-seg`, `-rt`, `-sr`, `dicom-pdf`, …). When OHIF
adopts the shared rules, those extensions contribute their own split rule *ahead*
of the catch-all, with real viewport types, and the catch-all becomes the safety
net for whatever no extension claims:

```js
displaySetSelector: [
  { id: 'seg', viewportTypes: ['stack', 'volume'],
    matches: { attribute: 'Modality', equals: 'SEG' },
    groupBy: ['SeriesInstanceUID', 'SOPInstanceUID'] },
  // ...the defaults, whose 'unsupported' rule must stay last.
],
```

The catch-all has no `matches`, so it claims everything — any rule placed after it
is dead code.

### When data is not enough

Some classification genuinely cannot be written as JSON — "is this a video?" needs
a transfer-syntax and SOP-class heuristic. Those are referenced **by name** and
resolved against a registry, so the selector stays serializable:

```js
// In an extension's getCustomizationModule:
{
  name: 'default',
  value: {
    displaySetClassifiers: {
      // Referenced from selector data as { classifier: 'siteProtocol' }
      siteProtocol: instance => instance.ProtocolName?.startsWith('SITE-'),
    },
  },
}
```

A selector using named extensions is still shareable, but the names become part of
the contract: whatever compiles it — client or server — must register the same
names, or compilation throws.

Built-in classifier names, available without registering anything, are `image`,
`video`, `ecg`, and `wsi`.

## Sharing one selector across applications

The end state a deployment is aiming for:

```
              ┌─────────────────────────────┐
              │  displaySetSelector (JSON)  │   one definition
              └──────────────┬──────────────┘
                    ┌────────┴────────┐
                    ▼                 ▼
   static-dicomweb (Node)         OHIF (browser)
   reads it from config           reads it from customizationService
                    │                 │
                    ▼                 ▼
      createDisplaySetSplitRules(selector)  ← the same compiler
                    │                 │
                    ▼                 ▼
        display sets in the index   display sets in the viewer
```

Practical notes for keeping the two sides honest:

- **Version the selector with the data it describes.** If a server bakes display
  set identities into an index, a later selector edit changes those identities.
  Rule `id`s limit the blast radius (editing one rule leaves other rules' keys
  untouched) but do not eliminate it.
- **Keep named extensions to a minimum.** Every named classifier is a name both
  sides must register. A selector that is pure data has no such coupling.
- **Compile once, at setup.** `createDisplaySetSplitRules` validates eagerly, so a
  bad selector fails at startup rather than while a study is loading.
