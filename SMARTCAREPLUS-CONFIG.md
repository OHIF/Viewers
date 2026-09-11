# SmartCarePlus OHIF Viewer Configuration Guide

This document describes the customizations and configuration options implemented for the SmartCarePlus embedded viewer integration.

## ✨ Implemented Changes
- **Study Browser Customizations**: Restricted to primary study, hidden header, and action icons.
- **Branding & SEO**: Updated meta tags, page title, and application manifest.

---

## 🎨 Branding & SEO

The viewer has been white-labeled to match the SmartCarePlus ecosystem.

### Meta Tags & Title
Updated in [index.html](file:///srv/smartcareplus/imaging/viewer-lts/platform/app/public/html-templates/index.html):
- **Page Title**: `SmartCarePlus Imaging`
- **Application Name**: `SmartCarePlus Imaging`
- **Meta Description**: `SmartCarePlus Advanced Medical Imaging Viewer`
- **Apple Mobile App Title**: `SmartCarePlus`

### Web App Manifest
Updated in [manifest.json](file:///srv/smartcareplus/imaging/viewer-lts/platform/app/public/manifest.json):
- **Name**: `SmartCarePlus Imaging`
- **Short Name**: `SC+ Imaging`
- **Icons**: Restored structure using `assets/sc-logo-[SIZE].png`.

### Favicons & App Icons
The metadata structure has been restored to support multiple resolutions for different devices. Please provide the following assets in `platform/app/public/assets/`:

| Filename | Purpose | Recommended Size |
| :--- | :--- | :--- |
| `sc-favicon.ico` | Standard Browser Favicon | 32x32 (or multi-res ICO) |
| `sc-logo-16x16.png` | Small Favicon | 16x16 |
| `sc-logo-32x32.png` | Regular Favicon | 32x32 |
| `sc-logo-180x180.png` | Apple Touch Icon (Primary) | 180x180 |
| `sc-logo-192x192.png` | Android/PWA Icon | 192x192 |
| `sc-logo-512x512.png` | Android/PWA Icon (Large) | 512x512 |
| `sc-logo-1024x1024.png`| High-Res Apple Store | 1024x1024 |

> [!NOTE]
> I have also pre-configured links for intermediate sizes (57, 60, 72, 76, 96, 114, 120, 144, 152, 167, 256, 384). If you provide them with the `sc-logo-[WIDTH]x[HEIGHT].png` naming convention in the `assets/` folder, they will be picked up automatically.

---

## 🛠️ Configuration (smartcareplus.js)
The primary configuration file is located at:
`platform/app/public/config/smartcareplus.js`

To run the viewer with this configuration:
```bash
APP_CONFIG=config/smartcareplus.js yarn dev
```

---

## 1. Customization Service Elements
These keys are defined in the `customizationService` block of the configuration.

| Key | Type | Description |
| :--- | :--- | :--- |
| `studyBrowser.studyMode` | `'primary'` \| `'all'` | **Set to `'primary'`**. Restricts the series browser to thumbnails from the current study only. |
| `studyBrowser.hideHeader` | `boolean` | **Custom Key**. When `true`, hides the entire top bar of the sidebar (containing thumbnail/list toggle and settings). |
| `studyBrowser.actionIcons` | `array` | **Custom Key (Enabled)**. Controls icons in the sidebar header. Set to `[]` to hide the Settings icon. |

## 2. Global UI Configuration

| Key | Value | Description |
| :--- | :--- | :--- |
| `showStudyList` | `false` | Disables the main OHIF study list page. The viewer expects a direct study load via URL. |
| `whiteLabeling.logoComponent` | Configured | Sets the SmartCarePlus logo (`smartcareplus-logo.png`) in the header. |

## 3. Mode Overrides (`modesConfiguration`)
We override internal mode properties to ensure the interface remains clean when switching between viewer modes.

- **`leftPanels`**: Hardcoded to `@ohif/extension-default.panelModule.seriesList` but initialized to be visible/closed based on `leftPanelClosed`.
- **`leftPanelClosed`**: Set to `false` to ensure the series list is visible upon entry.

## 4. Security & Data Management
- **DICOM Upload (STOW-RS)**: Disabled by setting `supportsStow: false` and `dicomUploadEnabled: false` in the data source config. This prevents unauthorized uploads from the embedded client.

---

## 5. Implementation Details (Code Changes)
To support these features, the following core files were modified:

### `PanelStudyBrowser.tsx`
*Added support for:*
- **Filtering Tabs**: Automatically hides "Recent" and "All" tabs if `studyMode` is `'primary'`.
- **Custom Header Visibility**: Added check for `studyBrowser.hideHeader`.
- **Custom Action Icons**: Allows overriding the sidebar settings icons via config.

---

## Troubleshooting & Maintenance
- **Logo Changes**: Updates to the logo should be placed in `platform/app/public/` and the path updated in `smartcareplus.js`.
- **Restoring Features**: To show all patient studies again, change `studyBrowser.studyMode` back to `'all'` and set `studyBrowser.hideHeader` to `false`.
