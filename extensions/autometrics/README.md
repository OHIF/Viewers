# Autometrics Extension

This extension adds an "Autometrics" panel to the OHIF viewer with a group of buttons for automated measurement tools.

## Features

The Autometrics panel includes the following button groups:

### Angular Measurements
- **M1M2** - Automated M1M2 measurements
- **TMT-DOR** - Automated TMT-DOR measurements
- **TMT-LAT** - Automated TMT-LAT measurements
- **CP** - Automated CP measurements
- **HA** - Automated HA measurements

### Foot Ankle Offset
- **TALAS** - Automated TALAS measurements

## Installation

The extension is automatically included in the OHIF viewer configuration and will appear in the right panel of the Basic Viewer mode.

## Usage

1. Open the Basic Viewer mode
2. The Autometrics panel will appear in the right sidebar
3. Click on any of the measurement buttons to trigger automated measurements
4. Currently, the buttons log to the console - you can extend the functionality by modifying the `handleButtonClick` function in `AutometricsPanel.tsx`

## Customization

To add custom functionality to the buttons, modify the `handleButtonClick` function in `src/Panels/AutometricsPanel.tsx`:

```typescript
const handleButtonClick = (buttonName) => {
  switch (buttonName) {
    case 'M1M2':
      // Add M1M2 measurement logic
      break;
    case 'TMT-DOR':
      // Add TMT-DOR measurement logic
      break;
    case 'TMT-LAT':
      // Add TMT-LAT measurement logic
      break;
    case 'CP':
      // Add CP measurement logic
      break;
    case 'HA':
      // Add HA measurement logic
      break;
    case 'TALAS':
      // Add TALAS measurement logic
      break;
  }
};
```

## Development

The extension is built using React and follows the OHIF extension pattern. The main components are:

- `AutometricsPanel.tsx` - The main panel component
- `getPanelModule.tsx` - Panel module registration
- `index.ts` - Extension entry point
- `Icons/FootIcon.tsx` - Custom foot skeleton icon for the panel
