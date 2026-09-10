
---
sidebar_position: 14
sidebar_label: Notes and Requirements
title: Notes and Requirements for general OHIF behaviour
summary: Specifies some of the expected behavior of OHIF generally
---

# Notes and Requirements

This document just lists general notes and requirements for how OHIF behaves.
The plan is to break this document down into a new sub-category once there
are sufficient notes/requirements.


## Series and Display Set Sorting `sortStudy.ts`

Often a user will want to see a sorted list of series, or more generally
a sorted list of display sets.  Series are the original data and can be split
up into several display sets, although they are the same general sort of concept

For example, an MR series might contain both T1 and T2 echos, and the T2 echo
should occur after the T1.  Or, a single series might contain 4 mammography views:
`LCC`, `RCC`, `LMLO`, `RMLO` with all the `CC` views shown first, and within
that all the left views first for a given sub-type of CC view.

To allow controlling that, the `sortStudy` can register sort functions
that user used when two display sets come from the same series.  Between
those display sets, the registration also registers a default ordering
for that compare function.  Thus, the registration might look like:

```javascript
   addSameSeriesCompare('mammographyCompare', mammographyCompare, 5)
   addSameSeriesCompare('mrT1T2Compare', mrT1T2Compare, 7);
```

Then, the display set for mr and mammography need to set the field `compareSameSeries`
to the value `mammographyCompare`.

```javascript
   makeDisplaySet
     ...
     displaySet = {
      ...,
      compareSameSeries: 'mammographyCompare',
```

### Specifying Sort Order from Series Split

The series split rules (`getSopClassHandlerModule`) can specify a custom order
of display sets for the same series by adding a `sortVector`
to the display set created.  Display sets which match on series instance uid
are then compared using the sort vector.  The first element is the general sort
order for this type of value among all other sort types, and must be numeric.
The remainder of the values in the vector should be consistent for all
sort vectors whose first value is the same value.

For example, the mammography sort vector might have a primary value of '25',
and then use the next three values for `view type`, `sub type` and `side`.
It might also be true that "both" side views sort before everything and would be assigned
a value less than `25` here.

```
   // LCC view
   [25, 'CC', 'L', 'XO']
   // BCC view
   [24, 'CC', 'B']
```

### Display Set Date and Time `getSeriesDateTime`

Derived series - reports, segmentations, structure sets - are listed after the
images in reverse date/time order, so the most recently created one is the one
nearest the images.  Ordering them that way needs a single date/time saying when
each display set was created.

A display set is created from one instance of its series, which it carries as
`instance`, and the date/time it is ordered by is the creation date/time of that
instance.  This matters because every instance of a series carries that series'
`SeriesDate`/`SeriesTime`: a second report saved into an existing SR series has
the date and time of the series as it was first created, and only its
instance level date/time say when the report itself was made.

- **Instances** are sorted by instance number, increasing, as the default.  Only
  when the instance numbers do not decide - they tie, or neither instance has
  one - does the sort fall back to the creation date/time below, and then to the
  sop instance uid.  The last instance of a series is taken to be the most
  recently created one, so an instance number that fails to say which that is
  has to be replaced by something that does.
- **Display sets** are ordered by their own `SeriesDate`/`SeriesTime`, which
  hold the date/time *of the display set* and not always the date/time of the
  series the instances belong to.  The SOP class handler writes both, with
  `getSeriesDateTime` of the instance the display set shows.  A handler whose
  `addInstances` advances that instance - the SR and the chart one, which append
  to their display set rather than making a new one - has to write both again,
  or the date shown for the display set stays that of the report it replaced and
  disagrees with the place the series list has just sorted it into.
- **Series** carry the same two attributes and are ordered by them in the same
  way, so sorting a list of series rather than display sets is the plain series
  date/time sort it always was.

The sort reads the display set and never `displaySet.instance`, because
`getSeriesDateTime(instance)` differs between the display sets of one split
series.  A key that varies inside a series hides the `addSameSeriesCompare`
comparison, which runs only when the key ties, and it makes the comparator
inconsistent: with one key inside a series and another between series, a series
A whose two display sets straddle a display set B of another series gives
A1 < B, B < A2 and A2 < A1, and `Array.prototype.sort` then returns a different
list for each input order.

Two consequences follow, and both are intended:

- An image display set takes the instance's `SeriesDate`/`SeriesTime`, which
  every instance of a series carries identically.  Every display set of one
  mammography, CR, DX, ECG or multi-frame series therefore holds the same value,
  ties on the key, and the display sets stay together in the series list.
- Two display sets of one series that hold *different* values order by those
  values, and a display set of another series can come between them.  That is
  what a second segmentation saved into an existing SEG series needs:
  `DisplaySetService` gives it its own display set, because the SEG, RTSTRUCT
  and PMAP handlers have no `addInstances`, and that display set has to take the
  position of the save.  A split that needs its display sets kept together gives
  all of them one value - the value of the series - and registers a comparison
  with `addSameSeriesCompare` to order them among themselves.

DICOM records "when this was created" in several different attribute pairs, and
which of them are present depends on the modality and on whoever wrote the
object, so `getSeriesDateTime` chooses one pair from all of them:
`InstanceCreationDate`/`Time`, `ContentDate`/`Time`, `AcquisitionDate`/`Time`
(or the combined `AcquisitionDateTime`), `StructureSetDate`/`Time`,
`PresentationCreationDate`/`Time` and `SeriesDate`/`Time`.  The rules are:

- The date is the latest date found in any of those attributes.
- The time is the latest time found in an attribute carrying that exact same
  date.  A time is never combined with a date it did not arrive with, so the
  result is always a date/time that really occurred.
- When nothing carries a time for the winning date, the time is empty and the
  ordering is only accurate to the day, which is as good as the data allows.
- `StudyDate`/`StudyTime` are not included.  Every series in the study shares
  them, so they cannot tell one series from another.
- A value that is not a DICOM DA counts as no date at all.  Some series level
  metadata carries a date already formatted for display, and `19-Jan-2026` would
  otherwise read as `192026` and order by day of month.
- A combined `AcquisitionDateTime` that ends with the `&ZZXX` UTC offset is
  moved to the offset of the viewer, by `expandDicomDateTime`, and the date/time
  read from it is the local wall clock reading of that same instant.  A DT that
  declares no offset is read exactly as it is, like every bare DA and TM here.
  A DT holding a date alone names the start of that day, which is the reading
  the move needs, and it comes back with the time of that instant here.  It gets
  that time even when it declares the viewer's own offset, so that two DT values
  naming one instant always give one answer.

For any of this to work on newly stored objects, `updateNewInstanceMetadata`
stamps every report, segmentation and structure set OHIF saves with the current
date/time, and with an instance number one higher than every instance already in
the series - the most recently created instance of a series is not necessarily
the one with the highest instance number, so deriving the instance number from a
single predecessor instance can collide with an instance that already exists.

The stamp writes `InstanceCreationDate`/`Time`, which the SOP Common module
gives to every IOD, and the creation date/time pair the modality's own IOD
defines: `StructureSetDate`/`Time` for an RTSTRUCT, `PresentationCreationDate`/
`Time` for a PR, and `ContentDate`/`Time` for everything else - a SEG gets that
pair from the Multi-frame Functional Groups module, an SR from the SR Document
General module, and an image series from the General Image module.  The RTSTRUCT
and PR IODs define no content date/time at all, so writing one on them adds an
attribute a strict validator or archive can reject the instance for.

That stamp covers the instance level attributes, which are the ones that move
when an object is added to an existing series.  The date/time of the series
being *created* is generated with the object instead, from
`getCurrentDicomDateTime`, because dcmjs and the adapters stamp `SeriesDate`/
`Time` and `StructureSetDate`/`Time` in UTC - the wrong wall clock reading
anywhere else, and around midnight the wrong day.  The store commands pass those
in, so an object OHIF saves reads as one wall clock instant throughout.

A comparator registered with `addSameSeriesCompare` orders two display sets of
the same series, and decides before the instance compare that
`compareSameSeriesDisplaySet` otherwise falls through to.

The date/time stamped on a saved object, and the ordering rules above, changed in
3.14 - see
[display set date/time ordering](../migration-guide/3p13-to-3p14/display-set-ordering.md)
for what moves and what to do about it.
