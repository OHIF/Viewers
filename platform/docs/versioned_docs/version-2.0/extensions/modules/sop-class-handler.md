---
sidebar_position: 3
sidebar_label: SOP Class Handler
---
# Module: SOP Class Handler

An extension can register a [SOP Class][sop-class-link] Handler Module by
defining a `getSopClassHandlerModule` method. The [SOP Class][sop-class-link]
Handler is a bit different from the other modules, as it doesn't provide a `1:1`
schema for UI or provide it's own components. It instead defines:

- `sopClassUIDs`: an array of string SOP Class UIDs that the
  `getDisplaySetFromSeries` method should be applied to.
- `getDisplaySetFromSeries`: a method that maps series and study metadata to a
  display set

A `displaySet` has the following shape:

```js
return {
  plugin: 'html',
  Modality: 'SR',
  displaySetInstanceUID: 0,
  wadoRoot: study.getData().wadoRoot,
  wadoUri: instance.getData().wadouri,
  SOPInstanceUID: instance.getSOPInstanceUID(),
  SeriesInstanceUID: series.getSeriesInstanceUID(),
  StudyInstanceUID: study.getStudyInstanceUID(),
  authorizationHeaders,
};
```

Where the `plugin` key is used to influence the default `ViewportComponent` for
rendering the `displaySet`. Additional properties are passed to the
`ViewportComponent` and used by the default `StudyBrowser` to render
"thumbnails" for each `displaySet`

## Example SOP Class Handler Module

```js
const SOP_CLASS_UIDS = {
  BASIC_TEXT_SR: '1.2.840.10008.5.1.4.1.1.88.11',
  ENHANCED_SR: '1.2.840.10008.5.1.4.1.1.88.22',
};

export default {
  id: 'example-sop-class-handler-module',

/**
 * @param {object} params
 * @param {ServicesManager} params.servicesManager
 * @param {CommandsManager} params.commandsManager
 */
getSopClassHandlerModule({ servicesManager, commandsManager }) {
  return {
    id: 'OHIFDicomHtmlSopClassHandler',
    sopClassUIDs: Object.values(SOP_CLASS_UIDS),

    /**
     * @param {object} series -
     * @param {object} study -
     * @param {object} dicomWebClient -
     * @param {object} authorizationHeaders -
     */
    getDisplaySetFromSeries(series, study, dicomWebClient, authorizationHeaders) {
      const instance = series.getFirstInstance();

      return {
        plugin: 'html',
        displaySetInstanceUID: 0,
        wadoRoot: study.getData().wadoRoot,
        wadoUri: instance.getData().wadouri,
        SOPInstanceUID: instance.getSOPInstanceUID(),
        SeriesInstanceUID: series.getSeriesInstanceUID(),
        StudyInstanceUID: study.getStudyInstanceUID(),
        authorizationHeaders,
      };
    },
  }
};
```

### More examples :

- [Dicom-HTML SOP][dicom-html-sop]
- [Dicom-PDF SOP][dicom-pdf-sop]
- [Dicom-Microscopy SOP][dicom-micro-sop]
- [Dicom-Segmentation SOP][dicom-seg-sop]

## `@ohif/viewer` usage

We use the `sopClassHandlerModule`s in three different places:

- `ViewerLocalFileData.js`
- `ViewerRetrieveStudyData.js`
- `StandaloneRouting.js`

Each time, it is used to map study and series data to `displaySets`. It does
this by working alongside the `StudyMetadataManager` in `@ohif/core`. That
manager has the method `createDisplaySets` that takes an array of
`sopClassHandlerModules`.

<!-- prettier-ignore-start -->
[sop-class-link]: http://dicom.nema.org/dicom/2013/output/chtml/part04/sect_B.5.html
[dicom-html-sop]: https://github.com/OHIF/Viewers/blob/master/extensions/dicom-html/src/OHIFDicomHtmlSopClassHandler.js#L4-L12
[dicom-pdf-sop]: https://github.com/OHIF/Viewers/blob/master/extensions/dicom-pdf/src/OHIFDicomPDFSopClassHandler.js#L4-L6
[dicom-micro-sop]: https://github.com/OHIF/Viewers/blob/master/extensions/dicom-microscopy/src/DicomMicroscopySopClassHandler.js#L5-L7
[dicom-seg-sop]: https://github.com/OHIF/Viewers/blob/master/extensions/dicom-segmentation/src/OHIFDicomSegSopClassHandler.js#L5-L7
<!-- prettier-ignore-end -->
