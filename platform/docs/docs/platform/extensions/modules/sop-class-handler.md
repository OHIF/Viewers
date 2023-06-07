---
sidebar_position: 4
sidebar_label: SOP Class Handler
---
# Module: SOP Class Handler

## Overview
This module defines how a specific DICOM SOP class should be processed to make a list of `DisplaySet`, things which can be hung in a viewport. An extension can register a [SOP Class][sop-class-link] Handler Module by defining a `getSopClassHandlerModule` method. The [SOP Class][sop-class-link].

The mode chooses what SOPClassHandlers to use, so you could process a series in a different way depending on mode within the same application.

SOPClassHandler is a bit different from the other modules, as it doesn't provide a `1:1`
schema for UI or provide its own components. It instead defines:

- `sopClassUIDs`: an array of string SOP Class UIDs that the
  `getDisplaySetFromSeries` method should be applied to.
- `getDisplaySetFromSeries`: a method that maps series and study metadata to a
  display set

A `displaySet` has the following shape:

```js
return {
  Modality: 'MR',
  displaySetInstanceUIDD
  SeriesDate,
  SeriesTime,
  SeriesInstanceUID,
  StudyInstanceUID,
  SeriesNumber,
  FrameRate,
  SeriesDescription,
  isMultiFrame,
  numImageFrames,
  SOPClassHandlerId,
  madeInClient,
}
```

## Example SOP Class Handler Module

```js
import ImageSet from '@ohif/core/src/classes/ImageSet';


const sopClassDictionary = {
  CTImageStorage: "1.2.840.10008.5.1.4.1.1.2",
  MRImageStorage: "1.2.840.10008.5.1.4.1.1.4",
};


// It is important to note that the used SOPClassUIDs in the modes are in the order that is specified in the array.
const sopClassUids = [
  sopClassDictionary.CTImageStorage,
  sopClassDictionary.MRImageStorage,
];

function addInstances(instances)  {
   // Add instances to this display set, and return the display set updated.
}

const makeDisplaySet = (instances) => {
  const instance = instances[0];
  const imageSet = new ImageSet(instances);

  imageSet.setAttributes({
    displaySetInstanceUID: imageSet.uid,
    SeriesDate: instance.SeriesDate,
    SeriesTime: instance.SeriesTime,
    SeriesInstanceUID: instance.SeriesInstanceUID,
    StudyInstanceUID: instance.StudyInstanceUID,
    SeriesNumber: instance.SeriesNumber,
    FrameRate: instance.FrameTime,
    SeriesDescription: instance.SeriesDescription,
    Modality: instance.Modality,
    isMultiFrame: isMultiFrame(instance),
    numImageFrames: instances.length,
    SOPClassHandlerId: `${id}.sopClassHandlerModule.${sopClassHandlerName}`,
    addInstances,
  });

  // Note returns an array now
  return [imageSet];
};

getSopClassHandlerModule = () => {
  return [
    {
      name: 'stack,
      sopClassUids,
      getDisplaySetsFromSeries: makeDisplaySet,
    },
  ];
};

```

### addInstances
In order to allow new SOP instances to be received and added to an existing display
set, the addInstances method can be added to a display set.  It is called
on the display set to be updated, and returns it when it has added at least one
of the instances to the display set.

### More examples :
You can find another example for this mapping between raw metadata and displaySet for
`DICOM-SR` extension.

## `@ohif/app` usage

We use the `sopClassHandlerModule`s in `DisplaySetService` where we
transform instances from the raw metadata format to a OHIF displaySet format.
You can read more about DisplaySetService here.

<!-- prettier-ignore-start -->
[sop-class-link]: http://dicom.nema.org/dicom/2013/output/chtml/part04/sect_B.5.html
[dicom-html-sop]: https://github.com/OHIF/Viewers/blob/master/extensions/dicom-html/src/OHIFDicomHtmlSopClassHandler.js#L4-L12
[dicom-pdf-sop]: https://github.com/OHIF/Viewers/blob/master/extensions/dicom-pdf/src/OHIFDicomPDFSopClassHandler.js#L4-L6
[dicom-micro-sop]: https://github.com/OHIF/Viewers/blob/master/extensions/dicom-microscopy/src/DicomMicroscopySopClassHandler.js#L5-L7
[dicom-seg-sop]: https://github.com/OHIF/Viewers/blob/master/extensions/dicom-segmentation/src/OHIFDicomSegSopClassHandler.js#L5-L7
<!-- prettier-ignore-end -->
