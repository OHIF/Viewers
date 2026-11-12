---
title: usePatientInfo
summary: A React hook that provides patient information from the active display sets and detects when multiple patients are loaded.
---

# usePatientInfo

The `usePatientInfo` hook provides access to basic patient demographic information from the active display sets and also detects when display sets from multiple patients are loaded simultaneously.

## Overview

This hook retrieves patient information from the first instance of the first display set added to the viewer. It monitors when new display sets are added and updates the patient information accordingly. It also checks if any of the active display sets are from different patients and provides this information through the `isMixedPatients` flag.

## Import

```js
import { usePatientInfo } from '@ohif/extension-default';
```

## Usage

```jsx
function PatientBanner() {
  const { patientInfo, isMixedPatients } = usePatientInfo();
  
  return (
    <div className="patient-banner">
      {isMixedPatients && (
        <div className="warning">Multiple patients loaded</div>
      )}
      <div className="patient-name">{patientInfo.PatientName}</div>
      <div className="patient-details">
        <span>ID: {patientInfo.PatientID}</span>
        <span>Sex: {patientInfo.PatientSex}</span>
        <span>DOB: {patientInfo.PatientDOB}</span>
      </div>
    </div>
  );
}
```

## Parameters

This hook doesn't take any parameters.

## Returns

An object containing:

- `patientInfo`: Object with the following properties:
  - `PatientName`: Formatted patient name
  - `PatientID`: Patient identifier
  - `PatientSex`: Patient sex
  - `PatientDOB`: Formatted patient date of birth
- `isMixedPatients`: Boolean indicating whether multiple patients are loaded in the viewer

## Events

The hook subscribes to the following display set service events:

- `DISPLAY_SETS_ADDED`: Updates patient information when new display sets are added to the viewer

## Implementation Details

- Patient name and date of birth are formatted using OHIF utility functions.
- The hook checks all active display sets to determine if they belong to different patients.
- Patient information is initialized with empty strings and updated when display sets are added.
- When no instances are available in a display set, the hook attempts to get information from the `instance` property as a fallback.