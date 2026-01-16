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

