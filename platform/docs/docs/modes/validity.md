# Mode: Validity

- [Mode: Validity](#mode-validity)
  - [Overview](#overview)
  - [isValidMode](#isvalidmode)

## Overview
There are two mechanism for checking the validity of a mode for a study.

- `isValidMode`: which is called on a selected study in the workList.
- `validTags`





## isValidMode
This hook can be used to define a function that return a `boolean` which decided the
validity of the mode based on `StudyInstanceUID` and `modalities` that are in the study.

For instance, for pet-ct mode, both `PT` and 'CT' modalities should be available inside the study.

```js
export default function mode() {
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
