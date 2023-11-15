---
sidebar_position: 3
sidebar_label: URL
---

# URL

You can modify the URL at any state of the app to get the desired result. Here
are different part of the APP that you can modify:


## WorkList

The WorkList can be modified by adding the following query parameters:

### PatientName

The patient name can be modified by adding the `PatientName` query parameter.

```js
/?patientName=myQuery
```

### MRN

The MRN can be modified by adding the `MRN` query parameter.

```js
/?mrn=myQuery
```

### Description

The description can be modified by adding the `Description` query parameter.

```js
/?description=myQuery
```

### Modality

The modality can be modified by adding the `modalities` query parameter.

```js
/?modalities=MG
```

### Accession Number

The accession number can be modified by adding the `accession` query parameter.

```js
/?accession=myQuery
```

### DataSources

If you happen to have multiple data sources configured, you can filter the
WorkList by adding the `dataSources` query parameter.

```js
/?dataSources=orthanc
```

Note1: You should pass the `sourceName` of the data source in the configuration file (not the friendly name nor the name)
Note2: Make sure that the configuration file you are using actually includes that data source. You cannot use a data source from another configuration file.


:::tip

You can add `sortBy` and `sortDirection` query parameters to sort the WorkList

```js
/?patientName=myquery&sortBy=studyDate&sortDirection=ascending
```

:::


## Viewer

The Viewer can be modified by adding the following query parameters:


### Mode

As you have seen before, the Viewer can be configured to be in different modes.
Each mode registers their `id` in the URL.

For instance

```js
/viewer?StudyInstanceUIDs=1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339
```

will open the viewer in the basic (longitudinal) mode with the StudyInstanceUID
1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339.

And if configured, the same study can be opened in the `tmtv` mode

```js
/tmtv?StudyInstanceUIDs=1.3.6.1.4.1.14519.5.2.1.7009.2403.871108593056125491804754960339
```

### StudyInstanceUIDs

You can open more than one study in the Viewer by adding the `StudyInstanceUIDs`


```js
/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125095722.1&StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125095258.1
```

:::tip

You can use this feature to open a current and prior study in the Viewer.
Read more in the [Hanging Protocol Module](../platform/extensions/modules/hpModule.md#matching-on-prior-study-with-uid) section.  You can also use commas to separate
values.

:::


### SeriesInstanceUID, SeriesInstanceUIDs and initialSeriesInstanceUID

Sometimes you need to only retrieve a specific series in a study, you can do
that by providing series level QIDO query parameters in the URL such as
SeriesInstanceUID or SeriesNumber.  This does NOT work with instance or study
level parameters.  For example:

```js
http://localhost:3000/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1&SeriesInstanceUID=1.3.6.1.4.1.25403.345050719074.3824.20170125113545.4
```

This will only open the viewer with one series (one displaySet) loaded, and no
queries made for any other series.

Sometimes you need to only retrieve a subset of series in a study, you can do
that by providing study level wado query parameters in the URL such as
SeriesInstanceUIDs. For example:

```js
http://localhost:3000/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1&SeriesInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113545.4,1.3.6.1.4.1.25403.345050719074.3824.20170125113545.5
```

This will only open the viewer with two series (two displaySets) loaded, and no
queries made for any other series.

Alternatively, sometimes you want to just open the study on a specified series
and/or display a particular sop instance, which you can accomplish using:
`initialSeriesInstanceUID` and/or `initialSOPInstanceUID`
to select the series to open on, but allowing other
series to be present in the study browser panel.  This is the same behaviour
as in OHIF 2.0, albeit on different URL parameters.  For example:

```js
http://localhost:3000/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1&initialSeriesInstanceUID=1.3.6.1.4.1.25403.345050719074.3824.20170125113545.4
```

Note that you can combine these, if you want to load a specific set of series
plus show an initial one as the first one selected, for example:

```js
http://localhost:3000/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1&SeriesInstanceUID=1.3.6.1.4.1.25403.345050719074.3824.20170125113545.4&initialSopInstanceUID=1.3.6.1.4.1.25403.345050719074.3824.20170125113546.1
```

### hangingProtocolId

You can select the initial hanging protocol to apply by using the
hangingProtocolId parameter.  The selected parameter must be available in a
hangingProtocolModule registration, but does not have to be active.


### token

Although not recommended, you can use the token param in the URL which will inject
the token into the Authorization header of the request.
