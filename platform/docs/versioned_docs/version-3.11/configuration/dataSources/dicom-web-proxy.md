---
sidebar_position: 4
sidebar_label: DICOMweb Proxy
title: DICOMweb Proxy
summary: Documents the DICOMweb Proxy data source which constructs a dynamic DICOMweb datasource from a configuration JSON file, allowing OHIF to delegate subsequent requests for metadata and images to the configured server.
---

# DICOMweb Proxy

You can launch the OHIF Viewer with a url that returns a JSON file which
contains a DICOMWeb configuration. The DICOMweb Proxy constructs a DICOMweb
datasource and delegates subsequent requests for metadata and images to that.

Usage is similar to that of the [DICOM JSON](./dicom-json.md) datasource and
might look like

`https://viewer.ohif.org/viewer/dicomwebproxy?url=https://ohif-dicom-json-example.s3.amazonaws.com/dicomweb.json`

The url to the location of the JSON file is passed in the query
after the `dicomwebproxy` string, which is
`https://ohif-dicom-json-example.s3.amazonaws.com/dicomweb.json` (this json file
does not exist at the moment of this writing).

## DICOMweb JSON configuration sample

The json returned by the url in this example contains a dicomweb configuration
(see [DICOMweb](dicom-web.md)), in a "servers" object, which is then used to
construct a dynamic DICOMweb datasource to delegate requests to. Here is an
example configuration that might be returned using the url parameter.

```json
{
  "servers": {
    "dicomWeb": [
      {
        "name": "DCM4CHEE",
        "wadoUriRoot": "https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado",
        "qidoRoot": "https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs",
        "wadoRoot": "https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs",
        "qidoSupportsIncludeField": true,
        "supportsReject": true,
        "imageRendering": "wadors",
        "thumbnailRendering": "wadors",
        "enableStudyLazyLoad": true,
        "supportsFuzzyMatching": true,
        "supportsWildcard": true
      }
    ]
  }
}
```

The DICOMweb Proxy expects the json returned by the url parameter it is invoked
with to include a servers object which contains a "dicomWeb" configuration array
as above. It will only consider the first array item in the dicomWeb
configuration.
