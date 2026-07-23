---
title: Measurements
summary: Migration guide for measurement changes in OHIF 3.9, covering the new structured 'displayText' object with primary and secondary arrays for better organization, and the renaming of 'selected' property to 'isSelected'.
---


## Display Text


Previously, `displayText` for measurements was often a simple string or an array of strings. This approach made it difficult to distinguish between primary measurement values (e.g., length, area) and secondary information (e.g., series number, instance number).  It also limited styling options for differentiating these types of information.

The new approach introduces a structured object for `displayText`, consisting of `primary` and `secondary` arrays. This separation allows for better organization and presentation of measurement information.  The `primary` array is intended for the main measurement values (on the left), while the `secondary` array is for contextual information like series and instance numbers (on the right)

### Migration Steps

If you have custom measurement tools or modify existing ones, you need to update the `getDisplayText` functions within the `measurementServiceMappings` to return a structured object in the new format.

**Update Measurement Mappings:** If your extension defines custom measurement tools or modifies existing ones, update the `getDisplayText` functions within the `measurementServiceMappings` to return a structured object in the new format.

```js
// Old Implementation (example for Length tool)
function getDisplayText(mappedAnnotations, displaySet, customizationService) {
    // ...
    return `${roundedLength} ${unit} (S: ${SeriesNumber}${instanceText}${frameText})`;
}
// New Implementation
function getDisplayText(mappedAnnotations, displaySet) {
  // ...
  return {
    primary: [`${roundedLength} ${unit}`],      // Primary measurement value
    secondary: [`S: ${SeriesNumber}${instanceText}${frameText}`], // Secondary information
  };
}
```

---

### selected property

`selected` property on measurements is now renamed to `isSelected` to match the rest of `isLocked` , `isVisible` naming convention.

Migration: you probably don't need to perform any migration

---
