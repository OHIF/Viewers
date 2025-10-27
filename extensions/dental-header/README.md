# Dental Header Theme Extension for OHIF Viewer

This extension provides a specialized dental theme and components for the OHIF medical imaging viewer, designed specifically for dental practices and dental imaging workflows.

## Features

### 🦷 Dental Theme
- **Custom Color Palette**: Teal and blue color scheme optimized for dental imaging
- **Dental-Specific Colors**: Enamel white, dentin cream, gum tissue green, and crown materials
- **Typography**: Clean, professional fonts suitable for dental practice interfaces
- **Responsive Design**: Optimized for various screen sizes and devices

### 🏥 Practice Header
- **Practice Branding**: Customizable practice name and logo
- **Patient Information**: Display patient name, ID, date of birth, and gender
- **Professional Layout**: Clean, medical-grade interface design

### 🦷 Tooth Selector
- **Dual Numbering Systems**: Support for both FDI and Universal tooth numbering
- **Interactive Dental Chart**: Visual tooth selection with hover effects
- **Quadrant Organization**: Organized by upper/lower and left/right quadrants
- **Real-time Selection**: Immediate feedback on tooth selection

### 📐 2x2 Hanging Protocol
- **Current Image**: Top-left viewport for current dental images
- **Prior Exam**: Top-right viewport
- **Bitewing Placeholders**: Bottom viewports


### Tooth Numbering Systems

#### FDI (Fédération Dentaire Internationale)
- **Permanent Teeth**: 11-18 (upper right), 21-28 (upper left), 31-38 (lower left), 41-48 (lower right)
- **Primary Teeth**: 51-55 (upper right), 61-65 (upper left), 71-75 (lower left), 81-85 (lower right)

#### Universal Numbering
- **Permanent Teeth**: 1-32 (1-16 upper jaw, 17-32 lower jaw)
- **Primary Teeth**: A-T (A-E upper jaw, F-J lower jaw)

### Hanging Protocol

## Development

### Building the Extension

```bash
yarn install
yarn build
yarn start
```

### Testing

```bash
yarn test
```

### v1.0.1
- Initial release
- Dental theme implementation
- Practice header component
- Tooth selector with FDI/Universal numbering
- 2x2 hanging protocol for dental imaging
