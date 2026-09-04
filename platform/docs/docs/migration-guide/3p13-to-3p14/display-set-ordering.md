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

## Display sets order by their instance's creation date/time

`compareSeriesDateTime` compared the `SeriesDate`/`SeriesTime` of the two sides
directly. It now compares the creation date/time of the instance each display set
was made from (`dateTimeSortKey`), chosen by `getSeriesDateTime` from every
creation attribute the instance carries - `InstanceCreationDate`/`Time`,
`ContentDate`/`Time`, `AcquisitionDate`/`Time` (or `AcquisitionDateTime`),
`StructureSetDate`/`Time`, `PresentationCreationDate`/`Time` and
`SeriesDate`/`Time`.

Every instance of a series carries that series' `SeriesDate`/`SeriesTime`, so a
second report saved into an existing SR series used to be indistinguishable from
the first. Only the instance level date/time say which was saved when.

**What changes for you:** display sets of derived series whose instance level
date/time differ from their series date/time will change position. Series
themselves, and display sets whose instance says nothing about when it was
created, still order by their own `SeriesDate`/`SeriesTime` exactly as before, so
sorting a list of series rather than display sets is unaffected.

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
OHIF saves with `InstanceCreationDate`/`Time` and `ContentDate`/`Time`, and with
an instance number one higher than every instance already in the series.

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
