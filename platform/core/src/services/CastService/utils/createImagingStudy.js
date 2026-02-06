public createImagingStudyClose(StudyUID: string) {
    const message = {
      timestamp: '',
      id: '',
      event: {
        'hub.topic': '',
        'hub.event': 'imagingstudy-close',
        context: [],
      },
    };
    return message;
  }

  public createImagingStudyOpen(StudyUID: string) {
    const message = {
      timestamp: '',
      id: '',
      event: {
        'hub.topic': '',
        'hub.event': 'imagingstudy-open',
        context: [
          {
            key: 'patient',
            resource: {
              resourceType: 'Patient',
              id: 'ewUbXT9RWEbSj5wPEdgRaBw3',
              identifier: [
                {
                  system: 'urn:oid:1.2.840.114350',
                  value: '185444',
                },
                {
                  system: 'urn:oid:1.2.840.114350.1.13.861.1.7.5.737384.27000',
                  value: '2667',
                },
              ],
            },
          },
          {
            key: 'study',
            resource: {
              resourceType: 'ImagingStudy',
              id: '', // FHIR id
              uid: 'urn:oid:' + StudyUID,
              identifier: [
                {
                  system: '7678',
                  value: '', // acc nbr
                },
              ],
              patient: {
                reference: 'Patient/ewUbXT9RWEbSj5wPEdgRaBw3',
              },
            },
          },
        ],
      },
    };
    return message;
  }
