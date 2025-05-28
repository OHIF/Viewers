---
title: useMeasurements
summary: A React hook that provides mapped measurements from the measurement service with automatic updates when measurements change.
---

# useMeasurements

The `useMeasurements` hook provides access to measurements from the measurement service, with automatic updates when measurements are added, updated, or removed.

## Overview

This hook retrieves measurements from the measurement service and maps them to a display-friendly format. It monitors various measurement service events and updates the returned measurements automatically when changes occur.

## Import

```js
import { useMeasurements } from '@ohif/extension-cornerstone';
```

## Usage

```jsx
function MeasurementPanel() {
  const measurementFilter = measurements => measurements.someFilter;

  const measurements = useMeasurements({
    measurementFilter,
  });

  return (
    <div>
      {measurements.map(measurement => (
        <div key={measurement.uid}>
          <span>{measurement.label}</span>
          <div>
            {measurement.displayText.primary.map((text, i) => (
              <p key={i}>{text}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
```

## Parameters

- `options` - Configuration options:
  - `measurementFilter` - Optional function to filter measurements returned by the measurement service.

## Returns

An array of mapped measurements with the following structure:


## Events

The hook automatically updates when any of these measurement service events occur:
- `MEASUREMENT_ADDED`
- `RAW_MEASUREMENT_ADDED`
- `MEASUREMENT_UPDATED`
- `MEASUREMENT_REMOVED`
- `MEASUREMENTS_CLEARED`

## Implementation Details

The hook uses debouncing to prevent excessive re-renders when multiple measurement events occur in rapid succession. It also performs a deep comparison of the measurements to avoid unnecessary state updates when the data hasn't actually changed.
