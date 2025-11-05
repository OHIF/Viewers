# @ohif/extension-xnat

OHIF v3 extension that provides XNAT (eXtensible Neuroimaging Archive Toolkit) integration and functionality for the OHIF Viewer.

## Description

This extension enables the OHIF Viewer to work seamlessly with XNAT by providing:

- **XNAT Data Sources**: Integration with XNAT's DICOMweb API for retrieving imaging data
- **XNAT Navigation**: Study and session navigation panels for browsing XNAT projects, subjects, and experiments
- **Measurement Tools**: Enhanced measurement capabilities with XNAT-specific workflows
- **Segmentation Support**: Advanced segmentation tools with ROI management
- **Custom Forms**: Overread mode support with customizable forms
- **Hanging Protocols**: XNAT-optimized display protocols for different imaging scenarios
- **Toolbar Integration**: XNAT-specific toolbar buttons and controls

## Key Features

### Data Sources
- `XNATDataSource`: Primary data source for XNAT sessions and experiments
- `DicomWebDataSource`: DICOMweb proxy for XNAT-hosted DICOM data
- Data source configuration management

### Panels
- **XNAT Study Browser**: Browse and select studies within XNAT sessions
- **XNAT Navigation**: Navigate projects, subjects, and experiments
- **Measurements Panel**: Manage and interact with measurements
- **Segmentation Panel**: Segmentation tools and ROI management
- **Custom Forms Panel**: Overread mode forms and annotations

### Tools & Modules
- Enhanced measurement tools (Length, Bidirectional, ROI tools)
- Segmentation utilities (brush, eraser, threshold tools)
- Hanging protocols for various imaging modalities
- Customizable context menus
- Session routing and management

### Components
- Study browser components (`XNATStudyBrowser`, `XNATStudyItem`, `XNATThumbnail`)
- Measurement tables and charts
- Line chart viewports for time-series data
- Customizable UI components

## Usage

This extension is automatically loaded when using the `@ohif/mode-xnat` mode. It provides the core XNAT functionality that enables:

1. **Session Navigation**: Navigate through XNAT projects, subjects, and experiments
2. **Study Viewing**: Load and view DICOM studies from XNAT
3. **Annotation**: Create measurements and segmentations
4. **Data Export**: Export annotations back to XNAT as ROI Collections

## Configuration

The extension supports various configuration options through the customization service:

- Panel layouts and visibility
- Toolbar button configurations
- Context menu customizations
- Hanging protocol preferences
- Segmentation settings

## API

### Exported Components
```javascript
import {
  XNATStudyBrowser,
  XNATStudyItem,
  XNATThumbnail
} from '@ohif/extension-xnat';
```

### Utilities
```javascript
import {
  sessionMap,
  fetchCSRFToken,
  isLoggedIn,
  xnatAuthenticate,
  userManagement
} from '@ohif/extension-xnat';
```

## Dependencies

- `@ohif/core`: Core OHIF services and types
- `@ohif/extension-default`: Default OHIF extension
- `@ohif/extension-cornerstone`: Cornerstone imaging extension
- `@ohif/ui-next` & `@ohif/ui`: OHIF UI components
- `@ohif/i18n`: Internationalization support

## Author

Zachary Pick

## License

MIT