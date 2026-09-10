---
sidebar_position: 3
sidebar_label: Display set date/time ordering
title: Display set date/time ordering
---

# Display set date/time ordering

Derived series - reports, segmentations, structure sets - are ordered by when
each one was created, so the most recently created is the one nearest the images.
Getting that order right needed two changes with behaviour you may be relying on.

See [display set date and time](../../development/notes-requirements.md) for how
the date/time of a display set is chosen and what it is used for.

## A display set's `SeriesDate`/`SeriesTime` are the display set's own date/time

`compareSeriesDateTime` still compares the `SeriesDate`/`SeriesTime` of the two
sides, and `dateTimeSortKey` still reads them from the display set. What changed
is the value the SOP class handler puts there. The handler now writes
`getSeriesDateTime` of the instance the display set shows, chosen from every
creation attribute that instance carries - `InstanceCreationDate`/`Time`,
`ContentDate`/`Time`, `AcquisitionDate`/`Time` (or `AcquisitionDateTime`),
`StructureSetDate`/`Time`, `PresentationCreationDate`/`Time` and
`SeriesDate`/`Time`.

So the two fields hold the date/time **of the display set**, which is not always
the date/time of the series the instances belong to. The series' own
`SeriesDate`/`SeriesTime`, in the instance metadata and in the archive, stay as
they are. Every instance of a series carries that series' `SeriesDate`/
`SeriesTime`, so a second report saved into an existing SR series used to be
indistinguishable from the first.

| Display set | Value written |
| --- | --- |
| image (CT, MR, MG, CR, DX, ECG, multi-frame) | the instance's `SeriesDate`/`SeriesTime`, identical on every instance of the series |
| derived (SEG, RTSTRUCT, SR, PMAP, PDF, video, chart) | the creation date/time of the instance the display set shows |

**What changes for you:** display sets of derived series whose instance level
date/time differ from their series date/time change position. Series themselves
are unaffected: sorting a list of series rather than display sets is the plain
series date/time sort it always was.

**If you write a SOP class handler,** write both fields, and write them again
whenever `addInstances` moves the instance the display set shows. A handler that
writes neither gets the series date/time and orders as it did in 3.13. See the
`SeriesDate` field of the `DisplaySet` type for the whole contract.

**If you split a series into several display sets,** give all of them one value.
The sort reads the display set and never `displaySet.instance`, for two reasons.
A key read from the instance differs between the display sets of a split series,
so it would order them by the instance each one happens to show and the
`addSameSeriesCompare` comparison, which runs only when the key ties, would
never run. A key read from the instance would also make the comparator
inconsistent: with one key inside a series and another between series, a series
A whose two display sets straddle a display set B of another series gives
A1 &lt; B, B &lt; A2 and A2 &lt; A1, and `Array.prototype.sort` then returns a
different list for each input order.

Two display sets of one series that hold different values order by those values,
and a display set of another series can come between them. That is what a second
segmentation saved into an existing SEG series needs: the SEG, RTSTRUCT and PMAP
handlers have no `addInstances`, so `DisplaySetService` gives the new instance
its own display set, and that display set takes the position of the save. To
keep a split together instead, give every display set of the split the value of
the series and register an `addSameSeriesCompare` comparison to order them.

## `addSameSeriesCompare` comparators now run

A comparator registered with `addSameSeriesCompare` orders two display sets of
the same series. `compareSameSeriesDisplaySet` returned the comparator's answer
only when that answer was `0`, and discarded it whenever it actually ordered the
two sides, falling through to the instance compare instead - so a registered
comparator had no effect on the resulting order.

It is now applied as documented: a non-zero answer decides, and only a tie falls
through to the instance compare.

**What changes for you:** if you registered a comparator, it now takes effect,
which may reorder display sets within a series that were previously ordered by
instance number alone. If the old order is the one you want, remove the
registration by passing `null` as the compare function:

```js
addSameSeriesCompare(name, null, priority);
```

## Instances tie-break by creation date/time

`sortByInstanceNumber` ordered by instance number and then by SOP instance UID.
It now falls back to the creation date/time before the SOP instance UID.

The instance number remains the primary key, and image series give every instance
a unique one, so their ordering is unchanged. The fallback only runs when the
instance numbers tie or neither instance has one - which is where the SOP
instance UID, an arbitrary identifier, was deciding which instance of a series is
the most recent. Two frames of the same instance are excluded from it: they share
the one date/time their instance has, so only the frame number orders them.

## New instances are stamped on save

`updateNewInstanceMetadata` stamps every report, segmentation and structure set
OHIF saves with `InstanceCreationDate`/`Time`, with the creation date/time pair
the modality's IOD defines, and with an instance number one higher than every
instance already in the series.

`InstanceCreationDate`/`Time` are in the SOP Common module, so every IOD has
them. The creation date/time of the object itself depends on the modality:

| Modality | Attribute pair | Module that defines it |
| --- | --- | --- |
| `RTSTRUCT` | `StructureSetDate`/`Time` | Structure Set |
| `PR` | `PresentationCreationDate`/`Time` | Presentation State Identification |
| every other modality | `ContentDate`/`Time` | Multi-frame Functional Groups (SEG), SR Document General (SR), General Image (an image series) |

The RTSTRUCT and PR IODs define no content date/time at all, so a
`ContentDate`/`Time` on one of them is an attribute a strict validator or
archive can reject the instance for. `getSeriesDateTime` reads all three pairs,
so the ordering is the same whichever pair the modality gets.

The date/time are read as wall clock values in the dataset's own timezone -
`TimezoneOffsetFromUTC` when it declares one, the local zone otherwise - since
that is how a viewer displays them.

The series level date/time cannot be stamped afterwards, since an object added to
an existing series has to keep that series' own. So the store commands generate
the object with the series date/time it should have: `SeriesDate`/`Time` for a
new series, and `StructureSetDate`/`Time` for every structure set, in the local
zone rather than the UTC values dcmjs and the adapters default to.

**What changes for you:** stored objects carry these attributes where they may
not have before. If you post-process saved instances and relied on the instance
number coming from a single predecessor instance, note that it is now derived
from the highest instance number in the whole series.
