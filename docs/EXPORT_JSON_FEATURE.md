# Export JSON Functionality

This document describes the new Export JSON functionality added to the OHIF dental mode.

## Overview

The Export JSON functionality allows users in dental mode to export measurement data as structured JSON files, providing more comprehensive data than CSV exports while maintaining human readability.

## Features

- **Dental Mode Only**: The JSON export button only appears when the viewer is in dental mode
- **Comprehensive Data**: Includes both common metadata and measurement-specific data
- **Structured Format**: Well-organized JSON structure with metadata and measurements arrays
- **Full Measurement Objects**: Includes complete measurement objects for advanced use cases

## Location

The Export JSON button appears in the measurements panel, directly below the existing CSV export button, when in dental mode.

## JSON Structure

The exported JSON file follows this structure:

```json
{
  "metadata": {
    "exportDate": "2024-11-24T10:30:00.000Z",
    "exportType": "JSON",
    "measurementCount": 2
  },
  "measurements": [
    {
      "uid": "measurement-uid-1",
      "patientID": "PATIENT001",
      "patientName": "Doe, John",
      "studyInstanceUID": "1.2.3.4.5.6.7.8.9",
      "seriesInstanceUID": "1.2.3.4.5.6.7.8.10",
      "sopInstanceUID": "1.2.3.4.5.6.7.8.11",
      "label": "PA Length",
      "measurementData": {
        "type": "Length",
        "columns": ["Length (mm)", "Unit"],
        "values": [15.2, "mm"]
      },
      "fullMeasurement": {
        // Complete measurement object with all properties
      }
    }
  ]
}
```

## Implementation Details

### Files Modified/Created

1. **`platform/core/src/utils/downloadJSONReport.js`** - New utility function for JSON export
2. **`platform/core/src/utils/index.ts`** - Added export for downloadJSONReport
3. **`extensions/cornerstone/src/commandsModule.ts`** - Added downloadJSONMeasurementsReport command
4. **`extensions/cornerstone/src/components/StudyMeasurementsActions.tsx`** - Added JSON export button (dental mode only)

### Detection Logic

The component detects dental mode using:
```javascript
const isDentalMode = React.useMemo(() => {
  const savedTheme = localStorage.getItem('viewerTheme');
  return savedTheme === 'dental' || document.documentElement.classList.contains('dental-theme');
}, []);
```

## Usage

1. Open OHIF viewer in dental mode (with dental imaging data)
2. Create measurements using dental measurement tools
3. Open the measurements panel
4. Click the "JSON" button (appears below the "CSV" button)
5. A JSON file will be downloaded with the filename "MeasurementReport.json"

## Benefits over CSV

- **Hierarchical Data**: JSON supports nested objects and arrays
- **Type Safety**: Preserves data types (numbers, booleans, objects)
- **Extensibility**: Easy to add new fields without breaking existing structure
- **Programmatic Use**: Easier to parse and process in applications
- **Metadata**: Includes export metadata and measurement counts
- **Complete Data**: Can include full measurement objects for advanced analysis

## Compatibility

- Works with all measurement tools available in dental mode
- Compatible with existing measurement service infrastructure
- No changes required to existing measurement data structures
- Backward compatible with existing CSV export functionality
