# Report dialog: where a save goes, and what the series is called

Status: **Implemented — current behaviour**

The report dialog stores a segmentation, a contour set, or a measurement report.
The dialog asks the user two things: which series the object goes into, and what
that series is called.

Implemented across:

- `extensions/default/src/customizations/reportDialogCustomization.tsx` — the
  dialog, and the `ohif.createReportDialog` customization.
- `extensions/default/src/Panels/createReportDialogPrompt.tsx` — the prompt that
  shows the dialog, and the input and the output of the prompt.
- `extensions/default/src/utils/seriesDescriptionHistory.ts` — the descriptions
  that the viewer remembers.
- `extensions/cornerstone-dicom-seg/src/commandsModule.ts` — `storeSegmentation`,
  the SEG caller and the RTSTRUCT caller.
- `extensions/default/src/utils/promptSaveReport.tsx` — the measurement report
  caller.
- `libs/@cornerstonejs/packages/adapters/src/utilities/referencedMetadataProvider.ts`
  — the `PredecessorSequence` provider, which reads the predecessor instance.

## One save stores one object

Each destination stores all of the current data as one object, and the dialog
merges nothing. A save into a series that already holds data does not read that
data, and the save leaves no part of the current data out. The destination
decides which series holds the new object, and therefore which instance the new
object supersedes. The earlier instances stay in the series, and the new
instance becomes the one that the viewer loads by default.

## The three destinations

| Destination | Where the object goes | When the dialog offers the destination |
| --- | --- | --- |
| `Save to current` | The series that the viewer loaded the data from | The `predecessorImageId` of the data names a loaded series |
| `Save as new` | A new series, with an editable number and description | Always |
| `Replace existing` | Another loaded series of this modality, which the user selects | The viewer holds at least one other such series |

`Save to current` is the default choice when the dialog offers it, and
`Save as new` is the default choice otherwise. `Save to current` and
`Replace existing` keep the number and the description of the target series, so
the dialog does not let the user edit either one.

## Which series the dialog offers

The dialog offers a loaded series as a destination only when both of these hold:

1. The series holds the same type of object, which is the modality of the save.
2. The series has a `predecessorImageId` value.

The `predecessorImageId` value names the immediate prior object that someone
saved into the series. The save supersedes that one instance. The adapter reads
the series and the instance number through the value, from the
`PredecessorSequence` provider.

The dialog does **not** fall back to the `SeriesInstanceUID` value of the display
set. A UID names a series and not an instance, so a UID names no prior object,
and a UID is not an image id. The provider finds no instance for a UID, and the
provider then throws
`TypeError: Cannot read properties of undefined (reading 'instanceNumber')` while
the adapter makes the object. The dialog offered a UID before, and a save into a
downloaded series then failed with that error.

A local id, such as `dicomfile:3`, is a valid value. The viewer registers an
uploaded instance under a local id, and the provider resolves a local id, so a
user can save against an uploaded instance more than once.

A display set that the viewer downloaded and never stored has no
`predecessorImageId` value, and the dialog does not offer that display set. The
count for the number of a new series still includes such a series: the count
reads every loaded series of the modality. A count of the offered series alone
gave a new series a number that a loaded series already held.

## What the new series is called

`Save as new` offers four names, and the field starts from the first name that is
not blank:

1. `itemName`, the name that the user chose for the item. A rename before the
   save therefore reaches the field. `storeSegmentation` passes
   `segmentation.label`, but only when the user chose that label: the service
   invents a name such as `Segmentation 3` for a new segmentation, and marks the
   segmentation with `labelIsGenerated`. A label that is still marked this way
   goes to `defaultSeriesDescription` instead, so a generated name does not
   outrank the remembered descriptions. A rename clears the mark, and the save
   compares no two strings, so a user who types the invented name still gets the
   name in `itemName`.
2. The description of the series that the viewer loaded the data from, which is
   the name of the last save of this data.
3. The descriptions that the user used before for this type of item, most recent
   first. See [remembered descriptions](#remembered-descriptions).
4. `defaultSeriesDescription`, the name for an item that has no other name. The
   in-tree callers pass `Segmentation`, `Contours` and `Measurements`.

The pull-down holds the four names in that order. A blank name, and a name of
spaces, drops out of the list, so such a name cannot hide a later name. The
dialog compares the names without case, and the list holds each name once. An
emptied field falls back to the first name of the list.

A caller with no editable name passes no `itemName`: the measurement report has
no such name, and the report therefore starts from the description of the loaded
series, or from the last used name.

### Remembered descriptions

The viewer remembers a description when the user creates a new series with the
description, and a download counts as a save. A save into a series that already
exists remembers nothing, because that series keeps its own description.

The history holds a name that the user chose. A save that uses
`defaultSeriesDescription` remembers nothing, because the caller supplies that
name at every save, and the dialog offers the name in any case. A generated
segmentation label reaches `defaultSeriesDescription`, so `Segmentation 1` stays
out of the history and the dialog cannot offer `Segmentation 1` as the name of a
later, unrelated segmentation.

- `itemType` is the key that the viewer remembers the descriptions under, and
  `itemType` defaults to the modality.
- `rememberedDescriptionCount` is how many descriptions the viewer remembers, and
  the count defaults to 5.
- A count of 0 turns the history off. The list then holds one name, and the
  dialog does not render the pull-down.

The user reaches the list in three ways: the pull-down button shows every name;
typing narrows the list to the names that the typing can complete; **Tab**
completes to the first of those names, and the arrow keys plus **Enter** select
one.

## The series number of a new series

The dialog offers one past the highest series number of the loaded series of this
modality, and at least `minSeriesNumber`. The user can edit the number. An empty
number, and a number that is not valid, falls back to the offered number.

`createReportDialogPrompt` returns `seriesNumber`, and also
`priorSeriesNumber`, which is one less. A caller that computes the number as
`1 + priorSeriesNumber` gets the number that the dialog shows.
