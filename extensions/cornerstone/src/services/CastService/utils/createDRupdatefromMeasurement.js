export default function createDRupdatefromMeasurement(measurement,studyMeta) {

const seriesNumberDisplayed = measurement.displayText.secondary[0];
const seriesNumber = seriesNumberDisplayed.substring(
    seriesNumberDisplayed.indexOf(':') + 1,
    seriesNumberDisplayed.indexOf('I') - 1
);

const accessionNumber=studyMeta.series[0].instances[0].AccessionNumber ?? '';

const fhirContext={
        id: '',
        timestamp: '',
        event: {
          'hub.topic': '{topic}',
          'hub.event': 'DiagnosticReport-update',
          context: [
            {
              key: 'updates',
              resource: {
                resourceType: 'Bundle',
                type: 'transaction',
                entry: [
                  {
                    request: {
                      method: 'POST',
                    },
  
                    resource: {
                      resourceType: 'ImagingStudy',
                      id: measurement.uid,
                      status: 'available',
                      identifier: [
                        {
                          system: 'https://example.com',
                          value: accessionNumber,
                        },
                      ],
                 //     started: '2024-01-01T00:00:00.000Z',
                    },
  
                  },
                  {
                    request: {
                      method: 'POST',
                    },
                    resource: {
                      resourceType: 'Observation',
                      id: measurement.uid,
                      partOf: {
                        reference: 'ImagingStudy/'+measurement.uid,
                      },
                      status: 'preliminary',
                      category: {
                        system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                        code: 'imaging',
                        display: 'Imaging',
                      },
                      valueQuantity: {
                        value: Number(measurement.displayText.primary[0].substring(0, measurement.displayText.primary[0].indexOf('m') - 1)),
                        unit: 'mm',
                        system: 'http://unitsofmeasure.org',
                        code: 'mm',
                      },
                //      started: '2024-01-01T00:00:00.000Z',
                    },
                  },
                  {
                    request: {
                      method: 'POST',
                    },
                    resource: {
                      resourceType: 'ImagingSelection',
                      id: measurement.uid,
                      status: 'available',
                      studyUid:measurement.referenceStudyUID,
                      derivedFrom: [
                        {
                          type: 'ImagingStudy',
                          identifier: {
                            system: 'urn:dicom:uid',
                            value:
                              'urn:oid:1.2.840.113747.20080222.35738358372924306270412538783781',
                          },
                        },
                      ],
                      seriesUid:measurement.referenceSeriesUID,
                      seriesNumber: Number(seriesNumber),
                      instance: [
                        {
                          uid: measurement.SOPInstanceUID,
                          number: measurement.frameNumber,
                          sopClass: {
                            system: 'urn:ietf:rfc:3986',
                            code: 'urn:oid:1.2.840.10008.5.1.4.1.1.2',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      };

  

    return  fhirContext;



  }

/*
measurement:
{
    "uid": "8d4991ae-d445-4492-8b3d-df8fe059b03e",
    "SOPInstanceUID": "1.2.276.0.75.2.2.70.0.3.190409145806255.9210272032710.206255",
    "points": [
        [
            0,
            2441.6929608151645,
            -1243.8181294323226
        ],
        [
            0,
            2882.4785808947304,
            -2060.8841568968833
        ]
    ],
    "textBox": {
        "hasMoved": false,
        "worldPosition": [
            0,
            2882.4785808947304,
            -1652.351143164603
        ],
        "worldBoundingBox": {
            "topLeft": [
                0,
                3151.250300455441,
                -1921.1228627253138
            ],
            "topRight": [
                0,
                4002.667565009682,
                -1921.1228627253138
            ],
            "bottomLeft": [
                0,
                3151.250300455441,
                -2366.6211949362296
            ],
            "bottomRight": [
                0,
                4002.667565009682,
                -2366.6211949362296
            ]
        }
    },
    "isLocked": false,
    "isVisible": true,
    "metadata": {
        "cameraFocalPoint": [
            0,
            3284,
            -2192
        ],
        "viewPlaneNormal": [
            1,
            0,
            0
        ],
        "viewUp": [
            0,
            0,
            1
        ],
        "sliceIndex": 0,
        "referencedImageId": "wadors:https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.25.269859997690759739055099378767846712697/series/1.2.276.0.75.2.2.70.0.2.190321143715248.9210271859845.1300050/instances/1.2.276.0.75.2.2.70.0.3.190409145806255.9210272032710.206255/frames/1",
        "toolName": "Length",
        "cameraPosition": [
            4342.429486474133,
            3284,
            -2192
        ]
    },
    "referenceSeriesUID": "1.2.276.0.75.2.2.70.0.2.190321143715248.9210271859845.1300050",
    "referenceStudyUID": "2.25.269859997690759739055099378767846712697",
    "referencedImageId": "wadors:https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.25.269859997690759739055099378767846712697/series/1.2.276.0.75.2.2.70.0.2.190321143715248.9210271859845.1300050/instances/1.2.276.0.75.2.2.70.0.3.190409145806255.9210272032710.206255/frames/1",
    "frameNumber": 1,
    "toolName": "Length",
    "displaySetInstanceUID": "d25ce7b2-dc31-191b-8e1e-7f91b64df899",
    "label": "",
    "displayText": {
        "primary": [
            "928 mm"
        ],
        "secondary": [
            "S: 910373994 I: 25714907"
        ]
    },
    "data": {
        "imageId:wadors:https://d14fa38qiwhyfd.cloudfront.net/dicomweb/studies/2.25.269859997690759739055099378767846712697/series/1.2.276.0.75.2.2.70.0.2.190321143715248.9210271859845.1300050/instances/1.2.276.0.75.2.2.70.0.3.190409145806255.9210272032710.206255/frames/1": {
            "length": 928.3796939322001,
            "unit": "mm"
        }
    },
    "type": "value_type::polyline",
    "source": {
        "uid": "22d52e6c-844d-6c47-e07d-4ef46cd5f332",
        "name": "Cornerstone3DTools",
        "version": "0.1"
    },
    "modifiedTimestamp": 1738402338,
    "isSelected": true
}


  */
  