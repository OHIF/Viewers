# Meteor Packages

### Commands (*ohif-commands*)
### Core (*ohif-core*)

## Cornerstone Package (*ohif-cornerstone*)

This package contains a number of front-end libraries that help us build web-based medical imaging applications.

These are:
- [dicomParser](https://github.com/cornerstonejs/dicomParser):
A lightweight JavaScript library for parsing DICOM P10 byte streams in modern web browsers (IE10+), Node.js, and Meteor.

- [Cornerstone Core](https://github.com/cornerstonejs/cornerstone):
A lightweight JavaScript library for displaying medical images in modern web browsers that support the HTML5 canvas element.

- [Cornerstone Tools](https://github.com/cornerstonejs/cornerstoneTools):
A library built on top of cornerstone that provides a set of common tools needed in medical imaging to work with images and stacks of images

- [Cornerstone Math](https://github.com/cornerstonejs/cornerstoneMath):
Math and computational geometry functionality for Cornerstone

- [Cornerstone WADO Image Loader](https://github.com/cornerstonejs/cornerstoneWADOImageLoader):
A Cornerstone Image Loader for DICOM P10 instances over HTTP. This can be used to integrate cornerstone with WADO-URI servers or any other HTTP based server that returns DICOM P10 instances (e.g. Orthanc or custom servers).

- [Hammer.js](https://github.com/hammerjs/hammer.js):
A JavaScript library for multi-touch gestures

### Design (*ohif-design*)
### DICOM Services (*ohif-dicom-services*)
It contains a number of helper functions for retrieving common value types (e.g. JSON, patient name, image frame) from a DICOM image. This package is for server-side usage.

### Hanging Protocols (*ohif-hanging-protocols*)
### Header (*ohif-header*)
### Hotkeys (*ohif-hotkeys*)

### Lesion Tracker (*ohif-lesiontracker*)
This package stores all of the oncology-specific tools and functions developed for the Lesion Tracker application. Here we store, for example, the Target measurement and Non-target pointer tools that are used to monitor tumour burden over time.

This package also stores Meteor components for the interactive lesion table used in the Lesion Tracker, and dialog boxes for the callbacks attached to the Target and Non-target tools.

### Logging (*ohif-log*)
### Logging (*ohif-measurements*)
### Metadata (*ohif-metadata*)
### Polyfilling Functionality (*ohif-polyfill*)

### Select Tree UI (*ohif-select-tree*)
### Server Settings UI (*ohif-servers*)
### Studies (*ohif-studies*)
### Study List UI (*ohif-study-list*)
### Common Themes (*ohif-themes-common*)
### Theming (*ohif-themes*)
### User Management (*ohif-user-management*)
### User (*ohif-user*)

### Basic Viewer Components (*ohif-viewerbase*)
This is the largest package in the repository. It holds a large number of re-usable Meteor components that are used to build both the OHIF Viewer and Lesion Tracker.

### WADO Proxy (*ohif-wadoproxy*)
Proxy for CORS
