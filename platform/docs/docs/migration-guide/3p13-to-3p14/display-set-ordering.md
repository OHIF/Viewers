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
`getLatestInstanceDateTime` of the instance the display set shows, chosen from every
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

## A DT that declares a UTC offset is read in the viewer's own offset

`AcquisitionDateTime` is a DICOM DT, and a DT may end with the `&ZZXX` UTC
offset the rest of it is written in. `getLatestInstanceDateTime` used to take the first
8 characters as the date and everything after as the time, which read the offset
digits as time digits: `20260819+0500` became five in the morning, and the `05`
of `202608191030-0500` became the seconds.

`expandDicomDateTime` now splits the offset off and moves the value to the
offset of the viewer, so the date and the time are the local wall clock reading
of the same instant - noon at `-0400` is 16:00 UTC, and 16:00 UTC is 10:00 at
`-0600`. That is the value a DT carrying no offset would have to hold to name
the same instant, because a value with no offset is read as local. The offset of
the viewer *at that instant* is used, so daylight saving is right for an
acquisition made in another season.

- A DT that declares no offset is read exactly as it is. Nothing says what zone
  it was written in, and every bare DA and TM is read with the same silence.
- A DT holding a date alone names the start of that day, which is the reading
  the move needs, and it comes back with the time of that instant here. Around
  midnight it changes day as well.
- A DT that declares an offset always comes back with a time, including when
  the offset it declares is the viewer's own. Two DT values naming one instant
  have to give one answer, and a date returned alone would order before the
  same instant written out in another offset.

**What changes for you:** a display set whose date/time came from an
offset-bearing `AcquisitionDateTime` changes position, and the `SeriesTime`
stored on it is now a valid DICOM TM. It used to be the raw remainder of the DT,
offset included - `100000.000000-0500` - which the thumbnail detail line then
passed to `formatTime`.

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
archive can reject the instance for. `getLatestInstanceDateTime` reads all three pairs,
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

## The exported name is `getLatestInstanceDateTime`

`platform/core` exported this function as `getSeriesDateTime` in
3.14.0-beta.25. The name says that the function gives the date and the time of
the series, and the function does not do that. The function gives the latest
date of the attributes that the instance carries, together with the latest time
that carries the same date. The export is `getLatestInstanceDateTime` now, and
the sort key export is `getLatestInstanceDateTimeSortKey`.

**What changes for you:** change the name at every call. The behaviour of both
functions is exactly the same as before.

| Before | Now |
| --- | --- |
| `utils.getSeriesDateTime` | `utils.getLatestInstanceDateTime` |
| `utils.getSeriesDateTimeSortKey` | `utils.getLatestInstanceDateTimeSortKey` |
| the type `SeriesDateTime` | the type `LatestInstanceDateTime` |
| the module `platform/core/src/utils/seriesDateTime` | the module `platform/core/src/utils/latestInstanceDateTime` |

The two fields of the type keep the names `SeriesDate` and `SeriesTime`,
because a handler assigns the two fields to a display set, and the display set
holds the two fields under those names.

`getSeriesDateTime` gets no alias, because the name was in no stable release of
OHIF. The name was in the 3.14.0-beta.25 line only.

`extensions/default/src/utils/getCurrentDicomDateTime.ts` also exported a
`getSeriesDateTime`, and that function gave the current date and time. No module
imports that file, and this release deletes the file. Use
`utils.getCurrentDicomDateTime` of `platform/core` for the current date and
time.
