
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
- **Display sets** are ordered by the creation date/time of their `instance`.
- **Series**, and any display set whose instance says nothing about when it was
  created, have nothing but their own `SeriesDate`/`SeriesTime` and are ordered
  by those alone.  Sorting a list of series rather than display sets is
  therefore the plain series date/time sort it always was.

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

For any of this to work on newly stored objects, `updateNewInstanceMetadata`
stamps every report, segmentation and structure set OHIF saves with the current
date/time in UTC - the same clock dcmjs writes the derived object's
`SeriesDate`/`SeriesTime` on, so that the series and instance level attributes
of one object cannot disagree by the UTC offset - and with an instance number
one higher than every instance already in the series - the most recently created instance of a series is not necessarily
the one with the highest instance number, so deriving the instance number from a
single predecessor instance can collide with an instance that already exists.

#### Behaviour change: `addSameSeriesCompare` comparators now run

A comparator registered with `addSameSeriesCompare` is used to order two display
sets of the same series.  Until now `compareSameSeriesDisplaySet` returned the
comparator's answer only when that answer was `0`, and discarded it whenever it
actually ordered the two sides, falling through to the instance compare instead -
so a registered comparator had no effect on the resulting order.  It is now
applied as documented: a non zero answer decides, and only a tie falls through to
the instance compare.

Anyone who registered a comparator will see it take effect, which may reorder
display sets within a series that were previously ordered by instance number
alone.  If the old order is the wanted one, remove the registration by passing
`null` as the compare function - `addSameSeriesCompare(name, null, priority)`.
