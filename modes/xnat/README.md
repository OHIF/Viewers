# @ohif/mode-xnat

OHIF v3 mode that provides the XNAT (eXtensible Neuroimaging Archive Toolkit) viewing experience for the OHIF Viewer.

## Description

This mode integrates the `@ohif/extension-xnat` extension to create a complete XNAT-compatible medical imaging viewer. It supports both regular viewing workflows and specialized overread scenarios with customizable panel layouts and enhanced annotation capabilities.

## Features

### Viewing Modes

#### Regular XNAT Viewer
- Standard medical imaging viewer optimized for XNAT workflows
- Navigation through XNAT projects, subjects, and experiments
- Study browsing and selection within sessions
- Measurement and segmentation tools
- Export capabilities to XNAT ROI Collections

#### XNAT Overread Viewer
- Specialized mode for radiological overreading workflows
- Enhanced panel layout with custom forms for annotations
- Additional measurement and segmentation panels
- Optimized for review and annotation tasks

### Navigation & Routing

The mode automatically handles XNAT session routing based on URL parameters:

- `projectId`: XNAT project identifier
- `subjectId`: Subject identifier within the project
- `experimentId`: Experiment/session identifier
- `experimentLabel`: Display label for the experiment
- `overreadMode`: Enables overread mode when set to 'true'
- `parentProjectId`: Parent project for shared projects

### Panel Layouts

#### Regular Mode Panels
- **Left Panels**: Study Browser, XNAT Navigation
- **Right Panels**: Segmentation Tools, Measurements

#### Overread Mode Panels
- **Left Panels**: Study Browser, Overread Navigation
- **Right Panels**: Segmentation Tools, Measurements, Custom Forms

### Hanging Protocols

Supports multiple hanging protocols optimized for XNAT workflows:

- `default`: Standard single-viewport layout
- `mpr`: Multi-planar reconstruction
- `main3D`: Primary 3D volume rendering
- `mprAnd3DVolumeViewport`: Combined MPR and 3D
- `only3D`: 3D-only viewing
- `primary3D`: Primary 3D with secondary views
- `primaryAxial`: Primary axial view
- `fourUp`: Four-viewport layout

### Toolbar Configuration

#### Primary Toolbar
- Return to XNAT button
- Measurement tools
- Zoom and pan controls
- Window/level adjustment
- Layout selection
- Crosshairs
- Additional tools menu

#### Segmentation Toolbox
- Segmentation utilities (slice propagation, interpolation)
- Segmentation tools (brush, eraser, threshold, shapes)

### Data Sources

- **XNAT Data Source**: Primary data source for XNAT sessions
- **DICOMweb Proxy**: For XNAT-hosted DICOM data
- Automatic data source initialization and session management

## Usage

### URL Parameters

Access the XNAT mode with specific session parameters:

```
/viewer?projectId=PROJECT&subjectId=SUBJECT&experimentId=EXPERIMENT&overreadMode=true
```

### Mode Initialization

The mode automatically:

1. Parses URL parameters for session identification
2. Initializes the XNAT session router
3. Configures panel layouts based on mode (regular/overread)
4. Sets up hanging protocols and toolbar configurations
5. Loads appropriate data sources

### Session Management

- Automatic session routing based on XNAT experiment parameters
- CSRF token handling for secure API communication
- User authentication and session mapping
- Study instance UID resolution

## Configuration

### Layout Customization

The mode supports dynamic layout configuration based on:

- Overread mode detection
- Available panels and tools
- User permissions and preferences
- Study metadata and requirements

### Toolbar Customization

Configurable toolbar sections include:

- Primary tools (measurement, navigation, viewport controls)
- Segmentation toolbox (advanced segmentation tools)
- Brush tools (segmentation brush variants)

## Dependencies

- `@ohif/extension-xnat`: Core XNAT functionality
- `@ohif/extension-default`: Default OHIF extension
- `@ohif/extension-cornerstone`: Cornerstone imaging extension
- `@ohif/extension-measurement-tracking`: Measurement management
- `@ohif/ui-next` & `@ohif/ui`: OHIF UI components
- `@ohif/core`: Core OHIF services

## API

### Mode Configuration

```javascript
{
  id: '@ohif/mode-xnat',
  modeInstance: {
    id: '@ohif/mode-xnat',
    displayName: ({ servicesManager }) => {
      const isOverreadMode = servicesManager?.services?.isOverreadMode === true;
      return isOverreadMode ? 'XNAT Overread Viewer' : 'XNAT Viewer';
    },
    // ... additional configuration
  }
}
```

### Extension Dependencies

The mode requires the XNAT extension and several OHIF core extensions for full functionality.

## Author

Zachary Pick

## License

MIT