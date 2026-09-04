---
sidebar_position: 2
sidebar_label: Save/report dialog
title: Save/report dialog destination
---

# Save/report dialog destination

The dialog shown when storing measurements, segmentations or contours
(`createReportDialogPrompt`, and the `ohif.createReportDialog` customization it
renders) contained a single series drop down that mixed together two quite
different operations - creating a new series, and storing into a series that
already exists.  Which one was about to happen, and what it would do to the
data already stored, was not visible.

The destination is now an explicit choice of three, made with a segmented control
on a `Series` row, with a line of help under it and the same words repeated on the
button that commits the save:

- **Save to current** adds a version to the series the data was loaded from - the
  series identified by `predecessorImageId`.  The stored instance becomes the one
  loaded by default for that series; the data already there is kept, but is no
  longer the default.  It is the default choice when there is such a series, and
  is unavailable otherwise.
- **Save as new** creates a separate series, with no predecessor.  The series
  number and the series description are both editable: the number is offered as
  one past the existing series of this modality (at least `minSeriesNumber`), and
  the description as the one last used for this type of item, falling back to
  `defaultSeriesDescription` - see
  [remembered series descriptions](#remembered-series-descriptions).  It is the
  default choice when the data has not been stored before, and is always
  available.
- **Replace existing** adds a version to another loaded series of this modality,
  chosen from a select of their descriptions.  It behaves like `Save to current`
  otherwise, and is unavailable when no such series is loaded.  This is what the
  old drop down could do, as its own destination rather than an entry mixed in
  among the series.

A series that already exists keeps its own series number and description, so both
are read-only for `Save to current` and `Replace existing`; the number shown
follows the series picked.

All three store the same object: all of the current data, as selected from the
service holding it - the measurements in the measurement service, the segments in
the segmentation service.  The destination only decides which series that object
belongs to, and so which instance it supersedes.  In particular, `Replace
existing` does not merge: it neither loads what is already stored in the chosen
series to add to it, nor leaves any of the current data out.  The instance it
supersedes is kept, and stops being the one loaded by default.

Storing into a series makes that series the one the data was last stored as, so a
save after a `Replace existing` defaults to `Save to current` on the series that
was replaced.

The dialogs are titled **Save Segmentation**, **Save Contours** and **Save
Measurements**, having been `Store Segmentation`, `Store Contours` and `Create
Report`, to match the `Save` action in them.  A caller that passes its own `title`,
or a mode that sets `defaultSaveTitle`, is unaffected.

The footer is now a `FooterAction` with `Download` on the left and `Cancel` and
the primary action on the right, rather than the right-aligned cluster
`InputDialog.Actions` gives.

## `createReportDialogPrompt` input

`defaultSeriesDescription` is new, and optional:

```ts
const { value, series, seriesNumber, dataSourceName, action } =
  await createReportDialogPrompt({
    servicesManager,
    extensionManager,
    title: 'Save Segmentation',
    modality: 'SEG',
    predecessorImageId,
    // New: the series description offered when a new series is created
    defaultSeriesDescription: segmentation.label,
    enableDownload: true,
  });
```

It should be the name of the thing being stored, so that the user is offered a
meaningful series description rather than an empty field.  The in-tree callers
pass the segmentation name (falling back to `Contours` for an RTSTRUCT export
and `Segmentation` for a SEG), and `Measurements` for a measurement report.
Previously an unedited description stored the *title of the dialog* as the series
description, so a measurement report saved without typing a name was stored as
`Create Report`.

`itemType` and `rememberedDescriptionCount` are also new and optional - see
[remembered series descriptions](#remembered-series-descriptions).

The meaning of `predecessorImageId` is unchanged, but it now decides whether
extending an existing series is possible at all, not just what the drop down
defaults to.  A `predecessorImageId` that does not belong to a loaded series of
the given modality falls back to creating a new series, rather than claiming to
update a series that cannot be described.

## `createReportDialogPrompt` output

`seriesNumber` is new:

- `seriesNumber` is the series number to store the instance as - the value shown
  in the dialog, including any edit the user made to it.  **Prefer this over
  `1 + priorSeriesNumber`**, which cannot see the user's edit.
- `priorSeriesNumber` is now `seriesNumber - 1`, so existing callers computing
  `1 + priorSeriesNumber` keep working and pick up an edited series number.  It
  is no longer the highest existing series number of the modality.
- `value` is the series description.  When an existing series is being extended
  this is that series' existing description, since an existing series keeps it.
- `series` is unchanged - the series being extended, as a `predecessorImageId`
  value, and falsy when a new series is created.

**Before (3.13):**

```ts
options: {
  SeriesDescription,
  SeriesNumber: 1 + priorSeriesNumber,
  predecessorImageId: series,
}
```

**After (3.14):**

```ts
options: {
  SeriesDescription,
  SeriesNumber: seriesNumber,
  predecessorImageId: series,
}
```

Note that `SeriesDescription` and `SeriesNumber` are ignored when
`predecessorImageId` is set, because the predecessor's series data is applied to
the generated instance - which is why the dialog shows them as read-only when
extending a series.

## After the save, the stored object is the predecessor

Saving to the current series relies on the data knowing which instance it was
last stored as - its `predecessorImageId`. That was only ever known for data
loaded from a store, so the first save of a segmentation or a report created a new
series, and so did the save after it, and the one after that.

An instance stored from the viewer is now identified the way one loaded from a
data source is: `registerStoredInstanceImageId` gives it the imageId that loading
it back would use, and maps that imageId to its UIDs, before it is added to the
metadata store. The display set made from the stored instance therefore has a
`predecessorImageId`, which is what the two save types then record:

- **segmentations and contours** are reloaded from the series just written (the
  save removes the in-memory segmentation and displays the stored one), so the
  reloaded segmentation picks the predecessor up from that display set through
  the normal load path;
- **measurements** are not reloaded from the report they were stored into, so the
  new `recordMeasurementsPredecessor` command (`CORNERSTONE`) records it on them
  directly - on the measurement and on the annotation it is derived from, so that
  editing a measurement afterwards does not lose it.

The effect is that saving the same data twice defaults to **Save to current** the
second time, pointing at the series the first save created.

## Remembered series descriptions

The series descriptions used to store something are remembered, so that storing
the next one of the same kind can offer them again.  They are kept in local
storage under `ohif.seriesDescriptionHistory`, most recently used first, keyed by
the **type of item** being stored, so that segmentations, contours and reports
each have their own list.

Two new optional inputs control this:

- `itemType` is the key the descriptions are remembered under.  It defaults to
  the `modality`, which is already distinct for the in-tree callers (`SEG`,
  `RTSTRUCT`, `SR`), so it only needs passing when one modality covers several
  kinds of item that deserve their own list.
- `rememberedDescriptionCount` is how many to remember, and defaults to **5**.
  **0 disables the feature**: nothing is remembered, nothing is offered, and the
  pull down is not shown, leaving a plain description field.

In the dialog, the `Save as new` description field:

- is prefilled with the description last used for this type of item, and with
  `defaultSeriesDescription` when there is none yet;
- offers a pull down whose first entry is `defaultSeriesDescription`, followed by
  the remembered descriptions, most recent first;
- narrows that list to the entries the typing can complete, with **Tab**
  completing to the first of them, and the arrow keys plus Enter picking one.

A description is remembered when it is used to create a new series, including a
download.  Storing into a series that already exists records nothing, since that
series keeps its own description.  Reusing a description moves it back to the
front of the list rather than duplicating it, matched without regard to case.

Deployments that must not persist anything into local storage should pass
`rememberedDescriptionCount: 0`.

## Replacing the dialog

A custom `ohif.createReportDialog` component receives the new
`defaultSeriesDescription`, `itemType` and `rememberedDescriptionCount` props, and
its `onSave` payload gained `seriesNumber` alongside the existing `reportName`,
`dataSource`, `series` and `priorSeriesNumber`.  A dialog that only ever creates
new series can pass `series: null` and its own `seriesNumber`.

Remembering descriptions is the dialog's own doing, via
`getSeriesDescriptionHistory` and `rememberSeriesDescription` in
`extensions/default/src/utils/seriesDescriptionHistory.ts`.  A replacement dialog
that wants the same behavior should call those, and one that does not simply
ignores `itemType` and `rememberedDescriptionCount`.
