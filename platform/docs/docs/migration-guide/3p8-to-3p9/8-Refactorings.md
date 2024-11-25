---
title: Refactoring
---

import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';





## Panel Segmentation

is now moved from `@ohif/extension-cornerstone-dicom-seg` to `@ohif/extension-cornerstone`.


The cornerstone extension now provides the panelSegmentation feature, which was previously part of the cornerstone-dicom-seg extension. This change is logical as panelSegmentation handles more than just DICOM. It can process various formats, including custom formats from the backend and potentially NIFTI format in the future.


Before in your modes you were using

```js
'@ohif/extension-cornerstone-dicom-seg.panelModule.panelSegmentation',
```


Now you should use it via


```js
'@ohif/extension-cornerstone.panelModule.panelSegmentation',
```

---

## `callInputDialog` and `colorPickerDialog` and `showLabelAnnotationPopup`

Due to the excessive number of `callInputDialog` instances, we centralized them. You can now import them from `@ohif/extension-default`.


```js
import { showLabelAnnotationPopup, callInputDialog, colorPickerDialog } from '@ohif/extension-default';
```


---

## disableEditing

The configuration has moved from appConfig to allow more precise control over component disabling. To disable editing for segmentation and measurements, add the following settings:


**Before: **

```js
customizationService.addModeCustomizations([
  {
    id: 'segmentation.panel',
    disableEditing: true,
  },
]);
```

**Now **

```js
customizationService.addModeCustomizations([
    // To disable editing in the SegmentationTable
    {
      id: 'PanelSegmentation.disableEditing',
      disableEditing: true,
    },
    // To disable editing in the MeasurementTable
    {
      id: 'PanelMeasurement.disableEditing',
      disableEditing: true,
    },
])
```


---

## Customization Ids

The primary reason for this migration is to improve modularity and maintainability in configuration management, as we plan to focus more on the customization service in the near future.

**Before**

```js
customizationService.addModeCustomizations([
  {
    id: 'segmentation.panel',
    segmentationPanelMode: 'expanded',
    addSegment: false,
    onSegmentationAdd: () => {
      commandsManager.run('createNewLabelmapFromPT');
    },
  },
]);
```


**Now**

```js
customizationService.addModeCustomizations([
  {
    id: 'PanelSegmentation.tableMode',
    mode: 'expanded',
  },
  {
    id: 'PanelSegmentation.onSegmentationAdd',
    onSegmentationAdd: () => {
      commandsManager.run('createNewLabelmapFromPT');
    },
  },
]);

```
