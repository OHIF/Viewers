---
sidebar_position: 8
sidebar_label: FAQ
---


- [General FAQ](#general-faq)
  - [How do I report a bug?](#how-do-i-report-a-bug)
  - [How can I request a new feature?](#how-can-i-request-a-new-feature)
  - [Who should I contact about Academic Collaborations?](#who-should-i-contact-about-academic-collaborations)
  - [Does OHIF offer support?](#does-ohif-offer-support)
  - [Does The OHIF Viewer have 510(k) Clearance from the U.S. F.D.A or CE Marking from the European Commission?](#does-the-ohif-viewer-have-510k-clearance-from-the-us-fda-or-ce-marking-from-the-european-commission)
  - [Is The OHIF Viewer HIPAA Compliant?](#is-the-ohif-viewer-hipaa-compliant)
- [Technical FAQ](#technical-faq)
  - [Why do I keep seeing a Cross Origin Isolation warning](#why-do-i-keep-seeing-a-cross-origin-isolation-warning)
  - [What if my setup does not support the Shared Array Buffers API?](#what-if-my-setup-does-not-support-the-shared-array-buffers-api)
  - [Viewer opens but does not show any thumbnails](#viewer-opens-but-does-not-show-any-thumbnails)
  - [What are the list of required metadata for the OHIF Viewer to work?](#what-are-the-list-of-required-metadata-for-the-ohif-viewer-to-work)
    - [Mandatory](#mandatory)
    - [Optional](#optional)
  - [How do I handle large volumes for MPR and Volume Rendering](#how-do-i-handle-large-volumes-for-mpr-and-volume-rendering)
    - [`useNorm16Texture`](#usenorm16texture)
    - [`preferSizeOverAccuracy`](#prefersizeoveraccuracy)


# General FAQ


## How do I report a bug?

Navigate to our [GitHub Repository][new-issue], and submit a new bug report.
Follow the steps outlined in the [Bug Report Template][bug-report-template].

## How can I request a new feature?

At the moment we are in the process of defining our roadmap and will do our best
to communicate this to the community. If your requested feature is on the
roadmap, then it will most likely be built at some point. If it is not, you are
welcome to build it yourself and [contribute it](development/contributing.md).
If you have resources and would like to fund the development of a feature,
please [contact us](https://ohif.org/get-support).


## Who should I contact about Academic Collaborations?

[Gordon J. Harris](https://www.dfhcc.harvard.edu/insider/member-detail/member/gordon-j-harris-phd/)
at Massachusetts General Hospital is the primary contact for any academic
collaborators. We are always happy to hear about new groups interested in using
the OHIF framework, and may be able to provide development support if the
proposed collaboration has an impact on cancer research.

## Does OHIF offer support?

yes, you can contact us for more information [here](https://ohif.org/get-support)


## Does The OHIF Viewer have [510(k) Clearance][501k-clearance] from the U.S. F.D.A or [CE Marking][ce-marking] from the European Commission?

**NO.** The OHIF Viewer is **NOT** F.D.A. cleared or CE Marked. It is the users'
responsibility to ensure compliance with applicable rules and regulations. The
[License](https://github.com/OHIF/Viewers/blob/master/LICENSE) for the OHIF
Platform does not prevent your company or group from seeking F.D.A. clearance
for a product built using the platform.

If you have gone this route (or are going there), please let us know because we
would be interested to hear about your experience.

## Is The OHIF Viewer [HIPAA][hipaa-def] Compliant?

**NO.** The OHIF Viewer **DOES NOT** fulfill all of the criteria to become HIPAA
Compliant. It is the users' responsibility to ensure compliance with applicable
rules and regulations.

# Technical FAQ

## Why do I keep seeing a Cross Origin Isolation warning
If you encounter a warning while running OHIF indicating that your application is not cross-origin isolated, it implies that volume rendering, such as MPR, will not function properly since they depend on Shared Array Buffers. To resolve this issue, we recommend referring to our comprehensive guide on Cross Origin Isolation available at [our dedicated cors page](./deployment/cors.md).

## What if my setup does not support the Shared Array Buffers API?
You can simply disable that by adding the `useSharedArrayBuffer: 'FALSE'` (notice the string FALSE), and the volumes will only use a regular
array buffer which is a bit slower but will work on all browsers.


## Viewer opens but does not show any thumbnails

Thumbnails may not appear in your DICOMWeb application for various reasons. This guide focuses on one primary scenario, which is you are using
the `supportsWildcard: true` in your configuration file while your sever does not support it.
One

For instance for the following filtering in the worklist tab we send this request

![](assets/img/filtering-worklist.png)

`https://d33do7qe4w26qo.cloudfront.net/dicomweb/studies?PatientName=*Head*&limit=101&offset=0&fuzzymatching=false&includefield=00081030%2C00080060`

Which our server can respond properly. If your server does not support this type of filtering, you can disable it by setting `supportsWildcard: false` in your configuration file,
or edit your server code to support it for instance something like

```js
Pseudocode:
For each filter in filters:
    if filter.value contains "*":
        Convert "*" to SQL LIKE wildcard ("%")
        Add "metadataField LIKE ?" to query
    else:
        Add "metadataField = ?" to query
```



## What are the list of required metadata for the OHIF Viewer to work?


### Mandatory

**All Modalities**

- `StudyInstanceUID`, `SeriesInstanceUID`, `SOPInstanceUID`: Unique identifiers for the study, series, and object.
- `PhotometricInterpretation`: Describes the color space of the image.
- `Rows`, `Columns`: Image dimensions.
- `PixelRepresentation`: Indicates how pixel data should be interpreted.
- `Modality`: Type of modality (e.g., CT, MR, etc.).
- `PixelSpacing`: Spacing between pixels.
- `BitsAllocated`: Number of bits allocated for each pixel sample.
- `SOPClassUID`: Specifies the DICOM service class of the object (though you might be able to render without it for most regular images datasets, but it is pretty normal to have it)

**Rendering**

You need to have the following tags for the viewer to render the image properly, otherwise you should
use the windowing tools to adjust the image to your liking:

- `RescaleIntercept`, `RescaleSlope`: Values used for rescaling pixel values for visualization.
- `WindowCenter`, `WindowWidth`: Windowing parameters for display.

**Some Datasets**

- `InstanceNumber`: Useful for sorting instances (without it the instances might be out of order)

**For MPR (Multi-Planar Reformatting) rendering and tools**

- `ImagePositionPatient`, `ImageOrientationPatient`: Position and orientation of the image in the patient.

**SEG (Segmentation)**

- `FrameOfReferenceUID` for handling segmentation layers.
- sequences
  - `ReferencedSeriesSequence`
  - `SharedFunctionalGroupsSequence`
  - `PerFrameFunctionalGroupsSequence`

**RTSTRUCT (Radiotherapy Structure)**

- `FrameOfReferenceUID` for handling segmentation layers.
- sequences
  - `ROIContourSequence`
  - `StructureSetROISequence`
  - `ReferencedFrameOfReferenceSequence`

**US (Ultrasound)**

- `NumberOfFrames`: Number of frames in a multi-frame image.
- `SequenceOfUltrasoundRegions`: For measurements.
- `FrameTime`: Time between frames if specified.

**SR (Structured Reporting)**

- Various sequences for encoding the report content and template.
  - `ConceptNameCodeSequence`
  - `ContentSequence`
  - `ContentTemplateSequence`
  - `CurrentRequestedProcedureEvidenceSequence`
  - `ContentTemplateSequence`
  - `CodingSchemeIdentificationSequence`

**PT with SUV Correction (Positron Tomography Standardized Uptake Value)**

- Sequences and tags related to radiopharmaceuticals, units, corrections, and timing.
  - `RadiopharmaceuticalInformationSequence`
  - `SeriesDate`
  - `SeriesTime`
  - `CorrectedImage`
  - `Units`
  - `DecayCorrection`
  - `AcquisitionDate`
  - `AcquisitionTime`
  - `PatientWeight`

**PDF**

- `EncapsulatedDocument`: Contains the PDF document.

**Video**

- `NumberOfFrames`: Video frame count .


### Optional
There are various other optional tags that will add to the viewer experience, but are not required for basic functionality. These include:
Patient Information, Study Information, Series Information, Instance Information, and Frame Information.


## How do I handle large volumes for MPR and Volume Rendering

Currently there are two ways to handle large volumes for MPR and Volume Rendering if that does not
fit in the memory of the client machine.

### `useNorm16Texture`

WebGL officially supports only 8-bit and 32-bit data types. For most images, 8 bits are not enough, and 32 bits are too much. However, we have to use the 32-bit data type for volume rendering and MPR, which results in suboptimal memory consumption for the application.

Through [EXT_texture_norm16](https://registry.khronos.org/webgl/extensions/EXT_texture_norm16/) , WebGL can support 16 bit data type which is ideal
for most images. You can look into the [webgl report](https://webglreport.com/?v=2) to check if you have that extension enabled.

![](assets/img/webgl-report-norm16.png)


This is a flag that you can set in your [configuration file](./configuration/configurationFiles.md) to force usage of 16 bit data type for the volume rendering and MPR. This will reduce the memory usage by half.


For instance for a large pt/ct study

![](assets/img/large-pt-ct.png)

Before (without the flag) the app shows 399 MB of memory usage

![](assets/img/memory-profiling-regular.png)


After (with flag, running locally) the app shows 249 MB of memory usage


![](assets/img/webgl-int16.png)

:::note
Using the 16 bit texture (if supported) will not have any effect in the rendering what so ever, and pixelData
would be exactly shown as it is. For datasets that cannot be represented with 16 bit data type, the flag will be ignored
and the 32 bit data type will be used.


Read more about these discussions in our PRs
- https://github.com/Kitware/vtk-js/pull/2058
:::


:::warning
Although the support for 16 bit data type is available in WebGL, in some settings (e.g., Intel-based Macos) there seems
to be still some issues with it. You can read and track bugs below.

- https://bugs.chromium.org/p/chromium/issues/detail?id=1246379
- https://bugs.chromium.org/p/chromium/issues/detail?id=1408247
:::

### `preferSizeOverAccuracy`

This is another flag that you can set in your [configuration file](./configuration/configurationFiles.md) to force the usage of the `half_float` data type for volume rendering and MPR. The main reason to choose this option over `useNorm16Texture` is its broader support across hardware and browsers. However, it is less accurate than the 16-bit data type and may lead to some rendering artifacts.

```js
Integers between 0 and 2048 can be exactly represented (and also between −2048 and 0)
Integers between 2048 and 4096 round to a multiple of 2 (even number)
Integers between 4096 and 8192 round to a multiple of 4
Integers between 8192 and 16384 round to a multiple of 8
Integers between 16384 and 32768 round to a multiple of 16
Integers between 32768 and 65519 round to a multiple of 32
```

As you see in the ranges above 2048 there will be inaccuracies in the rendering.

Memory snapshot after enabling `preferSizeOverAccuracy` for the same study as above

![](assets/img/preferSizeOverAccuracy.png)




<!--
  Links
  -->
[general]: #general
[technical]: #technical
[report-bug]: #how-do-i-report-a-bug
[new-feature]: #how-can-i-request-a-new-feature
[commercial-support]: #does-ohif-offer-commercial-support
[academic]: #who-should-i-contact-about-academic-collaborations
[fda-clearance]: #does-the-ohif-viewer-have-510k-clearance-from-the-us-fda-or-ce-marking-from-the-european-commission
[hipaa]: #is-the-ohif-viewer-hipaa-compliant
[501k-clearance]: https://www.fda.gov/MedicalDevices/DeviceRegulationandGuidance/HowtoMarketYourDevice/PremarketSubmissions/PremarketNotification510k/
[ce-marking]: https://ec.europa.eu/growth/single-market/ce-marking_en
[hipaa-def]: https://en.wikipedia.org/wiki/Health_Insurance_Portability_and_Accountability_Act
[new-issue]: https://github.com/OHIF/Viewers/issues/new/choose
[bug-report-template]: https://github.com/OHIF/Viewers/issues/new?assignees=&labels=Bug+Report+%3Abug%3A&template=---bug-report.md&title=
