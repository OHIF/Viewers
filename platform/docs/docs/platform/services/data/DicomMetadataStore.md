---
sidebar_position: 2
sidebar_label: DICOM Metadata Store
---
# DICOM Metadata Store


## Overview
`DicomMetaDataStore` is the central location that stores the metadata in `OHIF-v3`. There
are several APIs to add study/series/instance metadata and also for getting from the store.
DataSource utilize the `DicomMetaDataStore` to add the retrieved metadata to `OHIF Viewer`.

> In `OHIF-v3` we have significantly changed the architecture of the metadata storage to
> provide a much cleaner way of handling metadata-related tasks and services. Classes such as
> `OHIFInstanceMetadata`, `OHIFSeriesMetadata` and `OHIFStudyMetadata` has been removed and
> replaced with `DicomMetaDataStore`.
>


## Events
There are two events that get publish in `DicomMetaDataStore`:


| Event           | Description                                                                                    |
|-----------------|------------------------------------------------------------------------------------------------|
| SERIES_ADDED    | Fires when all series of one study have added their summary metadata to the `DicomMetaDataStore` |
| INSTANCES_ADDED | Fires when all instances of one series have added their metadata to the `DicomMetaDataStore`     |


## API
Let's find out about the public API for `DicomMetaDataStore` service.

- `EVENTS`: Object including the events mentioned above. You can subscribe to these events
  by calling DicomMetaDataStore.subscribe(EVENTS.SERIES_ADDED, myFunction). [Read more about pub/sub pattern here](../pubsub.md)

- `addInstances(instances, madeInClient = false)`: adds the instances' metadata to the store. madeInClient is explained in detail below. After
  adding to the store it fires the EVENTS.INSTANCES_ADDED.

- `addSeriesMetadata(seriesSummaryMetadata, madeInClient = false)`: adds series summary metadata. After adding it fires EVENTS.SERIES_ADDED

- `addStudy(study)`: creates and add study-level metadata to the store.

- `getStudy(StudyInstanceUID)`: returns the study metadata from the store. It includes all the series and instance metadata in the requested study

- `getSeries(StudyInstanceUID, SeriesInstanceUID`: returns the series-level metadata for the requested study and series UIDs.

- `getInstance(StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID)`: returns the instance metadata based on the study, series and sop instanceUIDs.

- `geteInstanceFromImageId`: returns the instance metadata based on the requested imageId. It searches the store for the instance that has the same imageId.



### madeInClient

Since upon adding the metadata to the store, the relevant events are fired, and there are
other services that are subscribed to these events (`HangingProtocolService` or `DisplaySetService`), sometimes
we want to add instance metadata but don't want the events to get fired. For instance, when
you are caching the data for the next study in advance, you probably don't want to trigger hanging protocol
logic, so you set `madeInClient=true` to not fire events.


## Storage
As discussed before, there are several API that enables getting metadata from the store and adding to the store.
However, it is good to have an understanding of where they get
stored and in what format and hierarchy. `_model` is a private variable in the store
which holds all the metadata for all studies, series, and instances, and it looks like:


```js title="platform/core/src/services/DicomMetadataStore/DicomMetadataStore.js"
const _model = {
  studies: [
    {
      /** Study Metadata **/
      seriesLists: [
        {
          // Series in study from dicom web server 1 (or different backend 1)
          series: [
            {
              // Series 1 Metadata
              instances: [
                {
                  // Instance 1 metadata of Series 1
                },
                {
                  // Instance 2 metadata of Series 1
                },
                /** Other instances metadata **/
              ],
            },
            {
              // Series 2 Metadata
              instances: [
                {
                  // Instance 1 metadata of Series 2
                },
                {
                  // Instance 2 metadata of Series 1
                },
                /** Other instances metadata **/
              ],
            },
          ],
        },
        {
          // Series in study from dicom web server 2 (or different backend 2)
          /** ... **/
        },
      ],
    },
  ],
}
```
