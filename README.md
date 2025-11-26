# OHIF Dental Mode

## Overview

The OHIF Dental Mode is a specialized imaging viewer designed specifically for dental radiography workflows. It provides tailored tools, layouts, and features optimized for dental image analysis, measurement, and comparison.

## Table of Contents

- [Features](#features)
- [Backend Setup (Orthanc)](#backend-setup-orthanc)
- [Installation](#installation)
- [Usage](#usage)
- [Dental-Specific Tools](#dental-specific-tools)
- [Viewport Management](#viewport-management)
- [Annotation System](#annotation-system)
- [Keyboard Shortcuts](#keyboard-shortcuts)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Features

### 🦷 Dental-Specific Capabilities

- **Specialized Measurement Tools**
  - Periapical (PA) Length measurements
  - Canal Angle measurements
  - Crown Width measurements
  - Root Length measurements
  - Auto-labeling of measurements

- **Dental Theme**
  - Custom dark theme optimized for dental imaging
  - High-contrast visualization for better image interpretation
  - Dental-specific color schemes and UI elements

- **Multi-Viewport Layout**
  - 2x2 grid layout for comparison workflows
  - Current vs. Prior exam comparison
  - Bitewing image support
  - Independent viewport controls

- **Advanced Annotation System**
  - Viewport-specific annotations (annotations stay with their viewport)
  - Clear viewport function to remove images and measurements
  - Per-viewport annotation filtering

- **Modality Support**
  - **DX** - Digital Radiography
  - **PX** - Panoramic X-Ray
  - **IO** - Intra-oral Radiography
  - **CR** - Computed Radiography (dental)
  - Automatic detection of dental studies

### 🔧 General Imaging Tools

- Window/Level adjustment
- Pan, Zoom, Rotate
- Flip Horizontal
- Image capture/export
- Reset view
- Stack scrolling for multi-image series

---

## Backend Setup (Orthanc)

The OHIF Dental Mode works seamlessly with Orthanc, a lightweight DICOM server perfect for dental imaging workflows.

### Prerequisites

- Docker (recommended) or Orthanc standalone installation
- At least 2GB of available RAM
- Port 8042 available (default Orthanc port)

### Quick Start with Docker

#### 1. Pull and Run Orthanc

```bash
docker run -p 4242:4242 -p 8042:8042 --rm \
  -e ORTHANC__NAME="Dental PACS" \
  -e ORTHANC__DICOM_WEB_ENABLED=true \
  -e ORTHANC__AUTHENTICATION_ENABLED=false \
  orthancteam/orthanc
```

#### 2. Alternative: Docker Compose Setup

Create a `docker-compose.yml` file:

```yaml
version: '3'
services:
  orthanc:
    image: orthancteam/orthanc:latest
    container_name: dental-orthanc
    ports:
      - "4242:4242"  # DICOM protocol
      - "8042:8042"  # HTTP/DICOMweb
    environment:
      - ORTHANC__NAME=Dental PACS
      - ORTHANC__DICOM_WEB_ENABLED=true
      - ORTHANC__AUTHENTICATION_ENABLED=false
      - ORTHANC__REGISTERED_USERS={"dental":"dental123"}
    volumes:
      - orthanc-db:/var/lib/orthanc/db
    restart: unless-stopped

volumes:
  orthanc-db:
```

Run with:
```bash
docker-compose up -d
```

#### 3. Verify Orthanc is Running

Open your browser and navigate to:
```
http://localhost:8042
```

You should see the Orthanc web interface.

### Advanced Orthanc Configuration

#### Enable DICOMweb Plugin

Create an `orthanc.json` configuration file:

```json
{
  "Name": "Dental Orthanc PACS",
  "HttpPort": 8042,
  "DicomPort": 4242,
  "RemoteAccessAllowed": true,
  "AuthenticationEnabled": false,
  "DicomWeb": {
    "Enable": true,
    "Root": "/dicom-web/",
    "EnableWado": true,
    "WadoRoot": "/wado",
    "Ssl": false,
    "StowMaxInstances": 10,
    "StowMaxSize": 10
  },
  "Plugins": [
    "/usr/share/orthanc/plugins"
  ]
}
```

#### CORS Configuration for OHIF

Add CORS headers to your Orthanc configuration:

```json
{
  "HttpsCACertificates": "",
  "RemoteAccessAllowed": true,
  "HttpHeaders": {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  }
}
```

### Uploading Dental Images to Orthanc

#### Method 1: Web Interface

1. Navigate to http://localhost:8042
2. Click "Upload" button
3. Select DICOM files (.dcm)
4. Files will be automatically indexed

#### Method 2: DICOM C-STORE

Use a DICOM tool like `storescu`:

```bash
storescu -aec ORTHANC localhost 4242 /path/to/dental/images/*.dcm
```

#### Method 3: REST API

```bash
curl -X POST http://localhost:8042/instances \
  -H "Content-Type: application/dicom" \
  --data-binary @dental-image.dcm
```

### Connecting OHIF to Orthanc

#### 1. Update OHIF Configuration

Edit `platform/app/public/config/default.js`:

```javascript
window.config = {
  routerBasename: '/',
  extensions: [],
  modes: [],
  dataSources: [
    {
      friendlyName: 'Dental Orthanc',
      namespace: '@ohif/extension-default.dataSourcesModule.dicomweb',
      sourceName: 'dicomweb',
      configuration: {
        name: 'Orthanc',
        wadoUriRoot: 'http://localhost:8042/wado',
        qidoRoot: 'http://localhost:8042/dicom-web',
        wadoRoot: 'http://localhost:8042/dicom-web',
        qidoSupportsIncludeField: false,
        imageRendering: 'wadors',
        thumbnailRendering: 'wadors',
        enableStudyLazyLoad: true,
        supportsFuzzyMatching: false,
        supportsWildcard: true,
        staticWado: true,
        singlepart: 'bulkdata,video',
        bulkDataURI: {
          enabled: true,
          relativeResolution: 'studies',
        },
      },
    },
  ],
  defaultDataSourceName: 'dicomweb',
};
```

#### 2. Launch OHIF with Dental Mode

```bash
cd OHIF_GitRepo
npm run dev:orthanc
```

Or manually navigate to:
```
http://localhost:3000/?mode=dental
```

---

## Installation

### Prerequisites

- Node.js (v18+ recommended)
- Yarn or npm package manager
- OHIF Viewer platform (v3.12.0+)

### Install Dependencies

From the root of OHIF repository:

```bash
yarn install
```

### Build the Dental Mode

```bash
# Build all packages
yarn run build

# Or build specific mode
yarn workspace @ohif/mode-dental run build
```

### Development Mode

Run OHIF in development mode with dental mode enabled:

```bash
yarn run dev
```

Then navigate to:
```
http://localhost:3000/?mode=dental
```

---

## Usage

### Accessing Dental Mode

#### Automatic Activation

Dental mode automatically activates when opening studies that contain:

- Dental modalities: **DX**, **PX**, **IO**, **CR** (dental)
- Series descriptions containing keywords:
  - "dental"
  - "intraoral"
  - "panoramic"
  - "cephalometric"
  - "bitewing"
  - "periapical"

#### Manual Activation via URL

Force dental mode for any study:

```
http://localhost:3000/viewer?StudyInstanceUIDs=<study-uid>&mode=dental
```

#### With Hanging Protocol

Specify a custom hanging protocol:

```
http://localhost:3000/viewer?StudyInstanceUIDs=<study-uid>&mode=dental&hangingProtocolId=@ohif/dental-2x2
```

#### Prior Study Comparison

Compare current study with a prior:

```
http://localhost:3000/viewer?StudyInstanceUIDs=<current>&StudyInstanceUIDs=<prior>&mode=dental
```

---

## Dental-Specific Tools

### Measurement Tools

All measurements are automatically labeled and stored per viewport.

#### 1. PA Length (Periapical Length)
- **Icon**: Length ruler
- **Usage**: Measure root canal length or lesion size
- **Label**: "PA length"
- **Unit**: millimeters (mm)

#### 2. Canal Angle
- **Icon**: Angle protractor
- **Usage**: Measure root canal angles
- **Label**: "Canal angle"
- **Unit**: degrees (°)

#### 3. Crown Width
- **Icon**: Length ruler
- **Usage**: Measure crown dimensions
- **Label**: "Crown width"
- **Unit**: millimeters (mm)

#### 4. Root Length
- **Icon**: Length ruler
- **Usage**: Measure root length
- **Label**: "Root length"
- **Unit**: millimeters (mm)

### Using Measurement Tools

1. Click the desired measurement tool from the toolbar
2. Click to place measurement points on the image
3. The measurement is automatically labeled and saved
4. Measurements appear in the Measurement Panel
5. Measurements are isolated to the active viewport

### Clear Viewport

The **Clear Viewport** button removes all images and annotations from the currently active viewport.

**Usage:**
1. Select the viewport you want to clear
2. Click the "Clear" button in the toolbar
3. Confirmation: viewport content and annotations are removed

---

## Viewport Management

### 2x2 Grid Layout

Dental mode features a specialized 2x2 layout:

```
+------------------+------------------+
| Top-Left:        | Top-Right:       |
| Current Study    | Prior Study      |
| (Primary)        | (Comparison)     |
+------------------+------------------+
| Bottom-Left:     | Bottom-Right:    |
| Bitewing 1       | Bitewing 2       |
| (Additional)     | (Additional)     |
+------------------+------------------+
```

### Viewport Features

- **Independent Controls**: Each viewport has its own windowing, zoom, and pan
- **Active Viewport**: Click to activate (highlighted border)
- **Synchronized Scrolling**: Optional synchronization across viewports
- **Per-Viewport Annotations**: Annotations stay with their respective viewport

### Hanging Protocols

Dental mode uses smart hanging protocols that:
- Auto-populate viewports based on modality
- Match current and prior studies
- Identify bitewing images by series description
- Gracefully handle missing data

---

## Annotation System

### Viewport-Specific Annotations

Dental mode implements a custom annotation filtering system to ensure annotations created in one viewport only appear in that viewport, even when multiple viewports display images from the same series/study.

#### How It Works

1. **Annotation Tagging**: Each annotation is tagged with its viewport ID
2. **Filtering**: Only annotations belonging to a viewport are displayed in that viewport
3. **Isolation**: Prevents cross-contamination between viewports
4. **Backward Compatibility**: Legacy annotations without tags are shown everywhere

#### Key Functions

- `tagAnnotationWithViewport()`: Tags new annotations
- `filterAnnotationsForDentalViewport()`: Filters annotations per viewport
- `getAnnotationsForViewport()`: Retrieves all annotations for a viewport
- `removeAllAnnotationsForViewport()`: Clears viewport-specific annotations

#### Technical Details

**Location**: `modes/dental/src/utils/dentalAnnotationFilter.ts`

The annotation system uses a metadata key `dentalViewportId` to track annotation ownership:

```typescript
annotationObj.metadata['dentalViewportId'] = viewportId;
```

This is crucial for multi-viewport dental workflows where the same image might be displayed in multiple viewports but requires independent annotations.

---

## Keyboard Shortcuts

### Navigation

| Shortcut | Action |
|----------|--------|
| **Mouse Wheel** | Scroll through image stack |
| **Left Click + Drag** | Window/Level adjustment |
| **Middle Click + Drag** | Pan image |
| **Right Click + Drag** | Zoom |

### Tools

| Shortcut | Action |
|----------|--------|
| **W** | Window/Level tool |
| **P** | Pan tool |
| **Z** | Zoom tool |
| **L** | Length measurement |
| **A** | Angle measurement |
| **R** | Reset viewport |
| **H** | Flip Horizontal |

### Viewport

| Shortcut | Action |
|----------|--------|
| **1-4** | Activate viewport 1-4 |
| **Esc** | Deactivate active tool |

---

## Configuration

### Mode Configuration

The dental mode is configured in `modes/dental/src/index.ts`:

```typescript
export const extensionDependencies = {
  '@ohif/extension-default': '^3.0.0',
  '@ohif/extension-cornerstone': '^3.0.0',
  '@ohif/extension-dental-theme-toggle': '^3.0.0',
  '@ohif/extension-measurement-tracking': '^3.0.0',
};
```

### Custom Tool Groups

Dental mode creates separate tool groups for each viewport:
- `dental-current`
- `dental-prior`
- `dental-bitewing-left`
- `dental-bitewing-right`

### Theme Customization

The dental theme is automatically applied when entering dental mode. Theme variables are defined in:

```
extensions/dental-theme-toggle/src/dental-theme.css
```

#### Key Theme Variables

```css
--dental-primary: 207 71% 45%;      /* Teal blue */
--dental-secondary: 207 71% 60%;    /* Lighter teal */
--dental-accent: 32 91% 56%;        /* Orange accent */
--dental-highlight: 32 100% 70%;    /* Light orange */
```

### Toolbar Configuration

Customize toolbar buttons in `modes/dental/src/toolbarButtons.ts`:

```typescript
const dentalMeasurementButtons = [
  {
    id: 'PALength',
    label: 'PA length',
    tooltip: 'Periapical length (mm)',
    // ...
  },
  // Add more custom buttons here
];
```

---

## Troubleshooting

### Common Issues

#### 1. Dental Mode Not Activating

**Problem**: Viewer opens in a different mode

**Solutions**:
- Manually add `?mode=dental` to the URL
- Check that your study contains dental modalities (DX, PX, IO)
- Verify series descriptions contain dental keywords
- Check browser console for validation messages

#### 2. Orthanc Connection Failed

**Problem**: Cannot load studies from Orthanc

**Solutions**:
- Verify Orthanc is running: `http://localhost:8042`
- Check CORS configuration in Orthanc
- Ensure DICOMweb plugin is enabled
- Verify network connectivity
- Check browser console for CORS errors

#### 3. Images Not Displaying

**Problem**: Viewports show empty or loading state

**Solutions**:
- Verify images are uploaded to Orthanc
- Check image modality is supported
- Refresh the browser
- Check browser console for errors
- Verify DICOMweb endpoints in config

#### 4. Measurements Not Appearing

**Problem**: Annotations don't show or disappear

**Solutions**:
- Ensure you're in the correct viewport
- Check if annotations were cleared
- Verify annotation filtering is working
- Check measurement panel for saved measurements

#### 5. Theme Not Applied

**Problem**: Dental theme doesn't activate

**Solutions**:
- Clear browser cache and localStorage
- Verify dental-theme-toggle extension is loaded
- Check browser console for theme errors
- Manually toggle theme in settings

#### 6. Performance Issues

**Problem**: Slow loading or laggy viewport interactions

**Solutions**:
- Enable study lazy load in data source config
- Reduce number of series loaded simultaneously
- Close unused viewports
- Clear browser cache
- Increase Orthanc memory allocation

### Debug Mode

Enable verbose logging:

```javascript
// In browser console
localStorage.setItem('debug', 'ohif:*');
```

View dental mode specific logs:

```javascript
localStorage.setItem('debug', 'ohif:dental:*');
```

### Getting Help

- **OHIF Documentation**: https://docs.ohif.org
- **Orthanc Documentation**: https://www.orthanc-server.com/
- **GitHub Issues**: https://github.com/OHIF/Viewers/issues
- **Community Forum**: https://community.ohif.org

---

## Development

### Project Structure

```
modes/dental/
├── src/
│   ├── index.ts                    # Mode entry point
│   ├── id.ts                       # Mode identifier
│   ├── toolbarButtons.ts           # Custom toolbar buttons
│   ├── initToolGroups.ts           # Tool group initialization
│   ├── hangingProtocols/           # Hanging protocol definitions
│   │   ├── index.ts
│   │   ├── hp2x2Dental.ts
│   │   └── README.md
│   ├── tools/                      # Custom tools
│   │   └── DentalViewportAnnotationTool.ts
│   ├── utils/                      # Utility functions
│   │   └── dentalAnnotationFilter.ts
│   └── components/                 # Custom React components
├── package.json
└── README.md                       # This file
```

### Adding Custom Tools

1. Create tool definition in `src/toolbarButtons.ts`
2. Register tool in `initToolGroups.ts`
3. Add command handler in `src/index.ts`
4. Export from mode

Example:

```typescript
// In toolbarButtons.ts
{
  id: 'MyCustomTool',
  uiType: 'ohif.toolButton',
  props: {
    icon: 'tool-custom',
    label: 'Custom Tool',
    commands: {
      commandName: 'activateDentalMeasurement',
      commandOptions: { toolName: 'CustomTool', label: 'My Measurement' },
    },
  },
}
```

### Testing

Run tests for dental mode:

```bash
# Unit tests
yarn test modes/dental

# E2E tests
yarn test:e2e --mode=dental
```

### Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add/update tests
5. Submit a pull request

---

## License

MIT License - see LICENSE file for details

---

## Acknowledgments

- **OHIF Team** - For the excellent imaging platform
- **Cornerstone.js** - For powerful medical image rendering
- **Orthanc Team** - For the robust DICOM server

---

## Version History

### v3.12.0-beta.89 (Current)
- Initial dental mode implementation
- 2x2 hanging protocol
- Custom dental measurement tools
- Viewport-specific annotation system
- Dental theme integration
- Orthanc backend support

---

**For more information, visit the [OHIF Documentation](https://docs.ohif.org)**
