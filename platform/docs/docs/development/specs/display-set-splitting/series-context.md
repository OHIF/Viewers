---
sidebar_position: 3
sidebar_label: Series context (EARS)
title: Display set splitting — series context
summary: Values that the split rules compute once from all of the instances of a series, share between the rules, and use for each instance — for regular slice lattices, spatial order, and time sweeps.
---

# Display set splitting — series context

**Prefix:** `SP` (split rules), group `SP-SUM` — *proposed, not yet reserved in the
specification register.* The groups `SP-CTX`, `SP-SFN`, and `SP-EXM` are in the
[implementation specification](./series-context-implementation.md).
**Extends:** [Display set splitting — requirements](./requirements.md). The requirements of that
specification apply here too, in particular `SP-DET`, `SP-SAFE`, and `SP-REUSE`.
**Status:** Draft, under review. This document holds the user requirements.
**Affects:** `@cornerstonejs/metadata` (the split engine, the rule compiler, the series
functions), `@ohif/core` (`DisplaySetService`), `@ohif/extension-default` (the display set
factory, the example rule modules).
**Related:** [Display Set Splitting](../../../platform/services/customization-service/displaySetSplitting.md#the-metadatacontext-customization)
— the reference documentation for the series context.

---

## 1. Purpose

**The goal: let a rule use a value of the whole series in a decision about one instance.**

A split rule tests one instance at a time. Some data needs a test that depends on the other
instances of the series:

1. **A volume with some irregular images.** A series is a volume, except for some images that are
   not on the regular slice spacing. The regular slices must become one volume display set. The
   other images must stay as they are. To find the regular slices, the system must first find the
   slice spacing of the series. Then each slice is regular when its distance from a start point,
   in units of the spacing, is approximately an integer.
2. **A volume in spatial order.** The slices of a volume must be in order along the normal of the
   image plane, from one origin for the whole series. The order needs the origin and the normal
   first. Then each slice gets its distance along the normal.
3. **Ultrasound sweeps.** An ultrasound series holds the images of several sweeps, and each image
   records its acquisition time. Each run of images with no long gap in time must become one
   display set. The ranges of time must come from all of the times of the series.

The three cases have one shape. The system computes a summary of the series once. Then the
per-instance parts of the rules — the match, the grouping, the order, and the attributes — read
that summary. A summary can be expensive, so the system computes it once, and every rule that
needs it reads the same value.

Before this work, a series fact in the data form was a named boolean only. A rule in data could
ask "does this series mix two kinds of image?", but it could not compute a spacing, an origin, or
a range of time. Such a rule needed code.

## 2. Scope

### 2.1 How to read this specification

This document states the **user requirements** (§4): what the user must be able to do, or must
be able to determine, to work safely. The
[series context implementation specification](./series-context-implementation.md) states the
**implementation requirements**: how the work was done, or the recommended approach. Each
implementation requirement cites the user requirements that it satisfies.

You can change the implementation specification freely when a better approach appears. You
change this document in two cases only: a requirement describes the behaviour wrongly, or the
intended user-facing behaviour changes. An implementation that is inconvenient is never a reason
to change this document.

### 2.2 In scope

- Series values that hold any value: a boolean, a number, or a summary object.
- One display set context that all rules of a split share, with entries that a rule can replace
  for itself.
- Named series functions for the summaries that the expression language cannot compute, and two
  built-in series functions: `planeGeometry` and `timeClusters`.
- The use of the series context in `attributes`.
- Three example rule modules, one for each case of §1.

### 2.3 Out of scope

- **A summary of the frames of one multiframe instance.** The engine splits whole instances
  (`SP-FIX-8` in the requirements specification).
- **A summary across two or more series** (`SP-FIX-7`).
- **Vector functions in the expression language**, for example `dot` or `cross`. The geometry is in
  the `planeGeometry` series function. See §6 item 5.

## 3. Definitions

**Series context.** The entries of the display set context that have the series scope: the named
values that the engine computes once from all of the instances of the series. A rule reads each
value by its name, in the same way as a DICOM keyword.

**Series fact.** One named value in the series context. This definition replaces the definition
in the requirements specification: a series fact can hold any value, not only a boolean.

**Series function.** A named function that computes one group of series values from all of the
instances of the series. Code supplies a series function. A context group names it.

**Slice lattice.** The positions along the normal of the image plane at a fixed spacing from an
anchor position. A slice is **on the lattice** when its position is within a tolerance of a
lattice position.

**Sweep.** A run of images, in time order, with no gap between two images that is longer than a
stated time.

*The system* means the OHIF Viewer, the `@cornerstonejs/metadata` split engine and rule compiler,
and their documentation, unless a requirement narrows it.

---

## 4. User requirements

> Change these only if a requirement describes the behaviour wrongly, or if the intended
> user-facing behaviour changes.

### 4.1 Summaries of a series — `SP-SUM`

**SP-SUM-1**
The system shall let a rule compute a value from all of the instances of a series, and use that
value in the match, the grouping, the order, and the attributes of each display set that the
rule creates.

**SP-SUM-2**
The system shall let a rule claim only the instances of a series that are on a regular slice
lattice, and leave the other instances of the series to the other rules.

> This is case 1 of §1. "Leave to the other rules" means that the other instances get the display
> sets that they get without the rule (`SP-FIX-6`).

**SP-SUM-3**
The system shall let a rule order the images of a display set by their distance along the normal
of the image plane, from one origin for the series.

**SP-SUM-4**
The system shall let a rule split the images of a series into display sets of contiguous
acquisition time, where a gap longer than a time that the rule states starts a new display set.

**SP-SUM-5**
WHEN two rules of a split use a series value of the same name, and neither rule replaces that
value or a value that it reads, the system shall give both rules the same value.

> Two rules can divide one series: "the regular slices" and "the other images". The two rules must
> agree on the lattice, so that each instance goes to exactly one of them. One value also means
> one computation of an expensive summary.

**SP-SUM-10**
The system shall let a rule replace a series value, or a value that it reads, for that rule only.
The other rules of the split shall keep the shared value.

> For example, one rule uses a gap of 20 seconds between ultrasound sweeps, and the other rules
> keep the default gap of 30 seconds. This requirement changed `SP-SUM-5`: before, the first rule
> that computed a name gave the value to every rule, and a rule could not have its own value.

**SP-SUM-6**
A rule shall be able to state every series value that it reads, so that the rule works alone, and
so that a reader of the rule sees where each value comes from.

**SP-SUM-7**
The system shall let a rule put a series value in the label or the series description of a display
set, for example the slice spacing.

**SP-SUM-8**
The system shall let a rule module that is only data, for example a URL module, express
`SP-SUM-2`, `SP-SUM-3`, and `SP-SUM-4`.

> A clinical user gets a rule from an assistant (`SP-DESC-1`). A rule that needs new code for
> each case does not follow that route.

**SP-SUM-9**
IF a rule names a computation of a series value that does not exist, THEN the system shall treat
the rule as a rule with an error, as `SP-SAFE-7` states.

> `SP-DET-1` and `SP-DET-2` apply to the series context too: a summary must not depend on the
> order in which the instances arrived. `SP-DET-3` also applies: when a late instance changes a
> summary, for example the slice lattice, the existing display sets keep their instances.

---

## 5. Implementation requirements

The [series context implementation specification](./series-context-implementation.md) holds the
implementation requirements: the groups `SP-CTX`, `SP-SFN`, and `SP-EXM`.

---

## 6. Open questions

| # | Question | State |
| --- | --- | --- |
| 1 | Two rules can declare one name with two different definitions. | **Resolved.** A rule context replaces the entry for that rule only (`SP-CTX-3`), so each rule reads its own definition. |
| 2 | A late instance can change a summary: it can change the slice lattice, or it can join two sweeps. The existing display sets keep their instances (`SP-DET-3`), so the result can differ from a split of the complete series. | **Accepted.** The reference documentation states it, with an example of two sweeps. |
| 3 | A series fact sees every instance of the series, also the instances that an earlier rule claims. In `usTimeClusters`, a multi-frame clip counts in the time clusters, and can join two sweeps. Must a fact take a filter of the instances? | **Open.** A possible form is an optional `where` condition on a series fact. |
| 4 | The anchor search of `planeGeometry` takes a time proportional to the square of the number of distinct positions. | **Open.** The time is small for a series of a few thousand slices. A faster search can replace it, and `SP-SFN-3` stays the same. |
| 5 | Must the expression language get vector functions, for example `dot` and `cross`? | **Open.** Not needed for the three cases, because `planeGeometry` gives `distance`. |
| 6 | `DisplaySetService` keeps the compiled rules for one `displaySetRules` value and one `displaySetRuleOrder` value. A change of `seriesFunctions` alone does not compile the rules again. | **Accepted.** A mode that defines other rules gives a new `displaySetRules` object, which compiles again (`SP-PIPE-2`). |
| 7 | The `series` list of a rule is gone. A custom rule set in the earlier form does not compile. | **Accepted.** The feature is off by default, and no release of OHIF holds it. The earlier form must be stated in the release notes of `@cornerstonejs/metadata`. |
| 8 | The prefix groups `SP-SUM`, `SP-CTX`, `SP-SFN`, and `SP-EXM` must go into the specification register (`specs/index.md`). | **Deferred**, as §6 item 5 of the requirements specification. |

## 7. Traceability

| Requirement group | Source |
| --- | --- |
| `SP-SUM` | The three cases of §1: a regular lattice in an irregular series, a spatial order from one origin, and ultrasound sweeps by acquisition time |
| `SP-SUM-5` | The decision that the series context is shared across the rules |
| `SP-SUM-10` | The `@cornerstonejs/metadata` display set context, in which the context of a rule replaces an entry for that rule only |
| `SP-SUM-8` | `SP-DESC-1` and `SP-REUSE-1` of the requirements specification |

## 8. Verification

The tests fall in two groups: "the API must do this" (`displaySetRules.test.ts` and
`seriesContext.test.ts` of `@cornerstonejs/metadata`), and "the user must see this"
(`urlSplitModules.test.ts`).

| Requirement | Test |
| --- | --- |
| `SP-SUM-5` | `displaySetRules.test.ts`: "computes an entry one time for each series for all rules that do not replace it" |
| `SP-SUM-10` | `displaySetRules.test.ts`: "lets a rule context replace an argument for that rule only, also inside the global entries" |
| `SP-SUM-9` | `displaySetRules.test.ts`: "rejects a loop of entries, an unknown group field, and a group replaced by a value" |
| `SP-SUM-7` | `seriesContext.test.ts`: "splits the lattice from the other images, and labels each display set from the whole series" |
| `SP-SUM-2` | `urlSplitModules.test.ts`: "regularVolume makes a volume of the regular slices, and leaves the extra slice", and "regularVolume keeps a fully regular series as the default volume" |
| `SP-SUM-3` | `optionalRules.test.ts` of `@cornerstonejs/metadata`: "volumePositionOrder: the slices of a volume in position order, not InstanceNumber order". The optional file `volumePositionOrder` replaces the removed OHIF module `split/volumeProjectionOrder`. |
| `SP-SUM-4` | `urlSplitModules.test.ts`: "usTimeClusters makes one display set for each sweep, in time order" |
| `SP-DET-3` with a changed summary | *Pending* — a `DisplaySetService` test that adds a late slice which changes the lattice |
| The implementation requirements | See §4 of the [implementation specification](./series-context-implementation.md) |
