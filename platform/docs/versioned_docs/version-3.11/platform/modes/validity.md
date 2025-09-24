---
sidebar_position: 4
sidebar_label: Validity
title: Mode Validity
summary: Documentation for OHIF Mode validity checks, which determine when specific modes should be available for particular studies based on modalities, tags, or custom logic to ensure appropriate workflows for different types of imaging studies.
---
# Mode: Validity


## Overview
There are two mechanism for checking the validity of a mode for a study.

- `isValidMode`: which is called on a selected study in the workList.
- `validTags`



## isValidMode
This hook can be used to define a function that return a `boolean` which decided the
validity of the mode based on `StudyInstanceUID` and `modalities` that are in the study.

For instance, for pet-ct mode, both `PT` and 'CT' modalities should be available inside the study.

```js
function modeFactory() {
  return {
    id: '',
    displayName: '',
    isValidMode: ({ modalities, StudyInstanceUID }) => {
      const modalities_list = modalities.split('\\');
      const validMode = ['CT', 'PT'].every(modality => modalities_list.includes(modality));
      return validMode;
    },
    /*
    ...
    */
  }
}
```
