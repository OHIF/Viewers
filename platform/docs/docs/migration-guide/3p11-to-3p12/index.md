---
sidebar_position: 1
sidebar_label: 3.11 -> 3.12 beta
---

# Migration Guide

This guide provides information about migrating from OHIF version 3.11 to version 3.12 beta

## Optional: Migrate modes to extend `modes/basic`

There is a lot of support for the basic mode definition contained in the
`modes/basic` module.  Using this framework will allow your mode to avoid
creating a lot of boilerplate code that may not upgrade very well.

This is an OPTIONAL change - your existing mode definitions will continue to work,
but using the new basic mode as a basis will reduce the amount of effort when
there are changes unrelated to your custom mode.


## ui button with text size

Using the class text size with the ui-button is inconsistent as to whether
it will apply or not.  Instead, create a new size value to assign the desired size.
To support this, a new size enum is created, smallTall, which is used in the worklist
for an over-ride.

## `createReportDialogPrompt`

The create report dialog prompt (which is MOSTLY an internal component) has
change the API a bit.  The input is now:

 - `title` shown in the dialog
 - `modality` being stored, used to query existing series
 - `minSeriesNumber` is the start of new series of this modality type.
    Will get set to 4000 if not determined by the modality
 - predecessorImageId is the image id that this series was currently loaded
   from.  That allows defaulting the dialog to show the specified series instead
   of always creating a new series.

The minSeries and predecessor are both optional, so the input doesn't have to be
updated.

The output has been enhanced with:

  - `series`, is the series to store do, as referenced by a predecessorImageId value.
    This allows exactly specifying which item to replace, which allows selecting it in the
    menu by default instead of just guessing what value is being replaced.
  - `priorSeriesNumber` is the previously lowest series number at least minSeriesNumber
     of all the seris of the given modality type.  This allows adding an instance to the
     `next` series number by adding 1 to this value.

The priorSeriesNumber will default to 4000 for an unknown modality type, or
3000 for sr, 3100 for seg and 3200 for rtstruct.

## metadataProvider and formatted metadata

The metadata provider has been formatting some fields, which causes inconsistency
between different metadata providers and use of the instance object.  The
specific fields that have changed are:

- `patientName`
- `studyDate`, `studyTime`
- `seriesDate`, `seriesTime`

If these fields need formatted versions, it is recommended to add a secondary/computed
metadata provider which simply gets the base metadata module and adds the
formatting.  That way different metadata providers are all handled identically.
