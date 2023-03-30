## Installation
- Download the dicom-ecg extension, download OHIF-Viwer (https://github.com/OHIF/Viewers), inside OHIF-Viewer, in /extensions/ copy the dicom-ecg folder
- In the path of the OHIF-Viewer project, (ohif/platform/viewer/src/index.js) import the extension and add it to the file:
```js
  import OHIFDicomECGExtension from '@ohif/extension-dicom-ecg'
  ...
  const appProps = {
      config,
      defaultExtensions: [
          ...
          OHIFDicomECGExtension, //Add
      ],
 ```
- Add the extension in OHIF-Viewer (platform/viewer/package.json) add the extension:
```js
  "dependencies": { 
      ...
      "@ohif/extension-dicom-ecg": "^X.X.X", //Add
  }
```
- Finally update whit yarn install (OHIF-Viewer).


