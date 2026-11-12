---
title: useMeasurementTracking
summary: A React hook that provides measurement tracking information for a specific viewport, including tracking state and tracked measurement UIDs.
---

# useMeasurementTracking

The `useMeasurementTracking` hook provides measurement tracking information for a specific viewport, including the tracking state and UIDs of tracked measurements associated with the viewport's series.

## Overview

This hook gives components access to tracking information for measurements in a viewport. It monitors the tracked measurements service and measurement service to provide up-to-date tracking states and the list of measurement UIDs associated with the series displayed in the viewport.

## Import

```js
import { useMeasurementTracking } from '@ohif/extension-cornerstone';
```

## Usage

```jsx
function MeasurementTrackingInfo({ viewportId }) {
  const {
    isTracked,
    isLocked,
    seriesInstanceUID,
    trackedMeasurementUIDs
  } = useMeasurementTracking({
    viewportId,
  });

  return (
    <div>
      <div>Series UID: {seriesInstanceUID}</div>
      <div>Tracking Status: {isTracked ? 'Tracked' : 'Not Tracked'}</div>
      <div>Locked: {isLocked ? 'Yes' : 'No'}</div>
      <div>Tracked Measurements: {trackedMeasurementUIDs.length}</div>
      <ul>
        {trackedMeasurementUIDs.map(uid => (
          <li key={uid}>{uid}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Parameters

- `options` - Configuration options:
  - `viewportId` (required): The ID of the viewport to track

## Returns

An object containing the following properties:

- `isTracked`: Boolean indicating if the series in the viewport is currently tracked
- `isLocked`: Boolean indicating if tracking is enabled (locked) globally
- `seriesInstanceUID`: The Series Instance UID of the background display set in the viewport
- `trackedMeasurementUIDs`: Array of measurement UIDs that are associated with the tracked series in the viewport

## Events

The hook automatically updates when any of these events occur:

From the tracked measurements service:
- `TRACKING_ENABLED`
- `TRACKING_DISABLED`
- `TRACKED_SERIES_CHANGED`
- `SERIES_ADDED`
- `SERIES_REMOVED`

From the measurement service:
- `MEASUREMENT_ADDED`
- `RAW_MEASUREMENT_ADDED`
- `MEASUREMENT_UPDATED`
- `MEASUREMENT_REMOVED`
- `MEASUREMENTS_CLEARED`
