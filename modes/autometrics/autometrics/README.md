# Autometrics Mode

This mode provides a specialized viewer for automated measurements with the Autometrics panel prominently displayed.

## Features

- **Autometrics Panel**: Right panel with automated measurement tools organized in groups:
  - Angular Measurements: M1M2, TMT-DOR, TMT-LAT, CP, HA
  - Foot Ankle Offset: TALAS
- **Standard Viewer Tools**: All standard OHIF viewer tools and measurements
- **Multiple Viewport Support**: Supports various DICOM modalities and viewport types

## Usage

1. Select the "Autometrics" mode from the study list
2. The Autometrics panel will be open by default in the right sidebar
3. Use the automated measurement buttons for quick measurements
4. Standard measurement tools are still available in the toolbar

## Route

The mode is accessible via the `/autometrics` route.

## Configuration

The mode includes:
- Left panel: Series list with measurement tracking
- Right panel: Autometrics panel (open by default)
- Viewports: Support for various DICOM modalities including:
  - Standard DICOM images
  - DICOM SR (Structured Reports)
  - DICOM SEG (Segmentation)
  - DICOM PMAP (Parametric Maps)
  - DICOM RT (Radiation Therapy)
  - DICOM Video
  - DICOM PDF

## Dependencies

This mode requires the `@ohif/extension-autometrics` extension to be installed and configured.
