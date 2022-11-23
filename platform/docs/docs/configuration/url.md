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
/?dataSourcename=orthanc
```

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

You can ues this feature to open a current and prior study in the Viewer.
Read more in the [Hanging Protocol Module](../platform/extensions/modules/hpModule.md#matching-on-prior-study-with-uid) section

:::


### SeriesInstanceUIDs

Sometimes you need to only open a specific series in a study, you can do that by

```js
/viewer?StudyInstanceUIDs=1.3.6.1.4.1.25403.345050719074.3824.20170125095722.1&SeriesInstanceUID=1.3.6.1.4.1.25403.345050719074.3824.20170125095748.1
```

This will only open the viewer with one series (one displaySet).
