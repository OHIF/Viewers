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

Generally, imaging studies should be shown in increasing order by series number,
or by series date/time for identical series numbers as the lowest series numbers
are often informational/overview series.  Thus, for image containing series, the
order used is:

- series number
- series date/time

As well, there are many types of non-imaging series such as annotations.
Non-imaging series are usually of interest most recent first, so the normal
sort order is series date/time descending.

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
