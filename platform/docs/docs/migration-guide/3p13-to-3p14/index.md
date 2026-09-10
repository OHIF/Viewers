---
id: index
sidebar_position: 1
sidebar_label: 3.13 -> 3.14
title: 3.13 to 3.14 Migration Guide
---

import DocCardList from '@theme/DocCardList';

# 3.13 to 3.14 Migration Guide

This guide covers changes when upgrading from OHIF version 3.13 to version 3.14.

- **[Save/report dialog](./report-dialog.md)** — the dialog for storing
  measurements, segmentations and contours replaces its series drop down with an
  explicit choice of three destinations: **Save to current**, **Save as new** and
  **Replace existing**.  The series number of a new series is editable, and the
  series descriptions used before are remembered per type of item and offered as
  completions.  `createReportDialogPrompt` takes `defaultSeriesDescription`,
  `itemType` and `rememberedDescriptionCount`, and returns a `seriesNumber`.  A
  stored instance is now identified like a loaded one, so the object just saved
  becomes the predecessor of the next save of the same data.
- **[Display set date/time ordering](./display-set-ordering.md)** — derived
  display sets are ordered by the creation date/time of the instance they show
  rather than by their series date/time, comparators registered with
  `addSameSeriesCompare` now actually run, instances tie-break by creation
  date/time before the SOP instance UID, and saved reports and segmentations are
  stamped with a creation date/time and an instance number.

<DocCardList />
