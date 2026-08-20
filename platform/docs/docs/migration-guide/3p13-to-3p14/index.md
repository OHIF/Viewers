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
  measurements, segmentations and contours now states whether it is creating a
  new series or extending the existing one, and offers a button to switch
  between the two instead of a series drop down.  The series number of a new
  series is editable, and the series descriptions used before are remembered per
  type of item and offered as completions.  `createReportDialogPrompt` takes
  `defaultSeriesDescription`, `itemType` and `rememberedDescriptionCount`, and
  returns a `seriesNumber`.  A stored instance is now identified like a loaded
  one, so the object just saved becomes the predecessor of the next save of the
  same data.

<DocCardList />
