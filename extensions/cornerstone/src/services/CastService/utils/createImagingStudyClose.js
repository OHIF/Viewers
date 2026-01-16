import { DicomMetadataStore } from '@ohif/core';

/**
 * Creates an imagingstudy-close fhircast message from a StudyInstanceUID
 * @param {string} studyInstanceUID - The DICOM Study Instance UID
 * @returns {object|null} The fhircast message object or null if study not found
 */
export default function createImagingStudyClose(studyInstanceUID) {
  const study = DicomMetadataStore.getStudy(studyInstanceUID);

  if (!study) {
    console.warn('createImagingStudyClose: Study not found in metadata store:', studyInstanceUID);
    return null;
  }

  // Get patient information from the first instance of the first series
  let patientId = '';
  let patientName = '';
  let accessionNumber = '';

  if (study.series && study.series.length > 0) {
    const firstSeries = study.series[0];
    if (firstSeries.instances && firstSeries.instances.length > 0) {
      const firstInstance = firstSeries.instances[0];
      patientId = firstInstance.PatientID || '';
      patientName = firstInstance.PatientName || '';
      accessionNumber = firstInstance.AccessionNumber || study.AccessionNumber || '';
    }
  }

  // Use PatientID as the identifier value, or generate a placeholder if not available
  const patientIdentifierValue = patientId || 'unknown';

  const message = {
    timestamp: '',
    id: '',
    event: {
      'hub.topic': '',
      'hub.event': 'imagingstudy-close',
      context: [
        {
          key: 'patient',
          resource: {
            resourceType: 'Patient',
            id: patientIdentifierValue,
            identifier: [
              {
                system: 'urn:oid:2.16.840.1.113883.4.2',
                value: patientIdentifierValue,
              },
            ],
            name: patientName ? [{ text: patientName }] : undefined,
          },
        },
        {
          key: 'study',
          resource: {
            resourceType: 'ImagingStudy',
            id: studyInstanceUID,
            uid: 'urn:oid:' + studyInstanceUID,
            identifier: accessionNumber
              ? [
                  {
                    system: 'urn:oid:2.16.840.1.113883.4.2',
                    value: accessionNumber,
                  },
                ]
              : [],
            patient: {
              reference: 'Patient/' + patientIdentifierValue,
            },
            status: 'available',
          },
        },
      ],
    },
  };

  return message;
}

