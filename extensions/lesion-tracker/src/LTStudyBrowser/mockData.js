const mockData = {
  currentStudy: '1.3.6.1.4.1.5962.99.1.5128099.2103784727.1533308485539.4.0',
  comparisonStudy: '1.2.840.113619.2.1.1.322987881.621.736170080.681',
  studies: [
    {
      studyInstanceUid:
        '1.3.6.1.4.1.5962.99.1.5128099.2103784727.1533308485539.4.0',
      _data: {
        seriesList: [
          {
            seriesInstanceUid:
              '1.3.6.1.4.1.5962.99.1.5128099.2103784727.1533308485539.5.0',
            modality: 'CT',
            seriesNumber: 1,
            seriesDate: '20000101',
            seriesTime: '000000.000',
          },
        ],
        seriesMap: {
          '1.3.6.1.4.1.5962.99.1.5128099.2103784727.1533308485539.5.0': {
            seriesInstanceUid:
              '1.3.6.1.4.1.5962.99.1.5128099.2103784727.1533308485539.5.0',
            modality: 'CT',
            seriesNumber: 1,
            seriesDate: '20000101',
            seriesTime: '000000.000',
          },
        },
        seriesLoader: null,
        wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        patientName: 'NAME^NONE',
        patientId: 'NOID',
        studyDate: '20000101',
        studyInstanceUid:
          '1.3.6.1.4.1.5962.99.1.5128099.2103784727.1533308485539.4.0',
      },
    },
    {
      studyInstanceUid: '1.2.840.113619.2.1.1.322987881.621.736170080.681',
      _data: {
        seriesList: [
          {
            seriesInstanceUid:
              '1.2.840.113619.2.1.2411.1031152382.365.736169244',
            modality: 'CT',
            seriesNumber: 365,
            seriesDate: '1993.04.30',
            seriesTime: '11:27:24',
          },
        ],
        seriesMap: {
          '1.2.840.113619.2.1.2411.1031152382.365.736169244': {
            seriesInstanceUid:
              '1.2.840.113619.2.1.2411.1031152382.365.736169244',
            modality: 'CT',
            seriesNumber: 365,
            seriesDate: '1993.04.30',
            seriesTime: '11:27:24',
          },
        },
        seriesLoader: null,
        wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        patientName: 'Anonymized',
        patientId: 'P-00000003',
        studyDate: '1993.04.30',
        studyDescription: 'RT ANKLE',
        studyInstanceUid: '1.2.840.113619.2.1.1.322987881.621.736170080.681',
        institutionName: 'JFK IMAGING CENTER',
      },
    },
    {
      studyInstanceUid: '2.16.840.1.113662.2.1.1519.11582.1990505.1105152',
      _data: {
        seriesList: [
          {
            seriesInstanceUid:
              '2.16.840.1.113662.2.1.2519.21582.2990505.2105152.2381633.20',
            modality: 'CT',
            seriesNumber: 3513,
            seriesDate: '1999.05.05',
            seriesTime: '10:52:34.530000',
          },
        ],
        seriesMap: {
          '2.16.840.1.113662.2.1.2519.21582.2990505.2105152.2381633.20': {
            seriesInstanceUid:
              '2.16.840.1.113662.2.1.2519.21582.2990505.2105152.2381633.20',
            modality: 'CT',
            seriesNumber: 3513,
            seriesDate: '1999.05.05',
            seriesTime: '10:52:34.530000',
          },
        },
        seriesLoader: null,
        wadoUriRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/wado',
        wadoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        qidoRoot: 'https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs',
        patientName: 'Anonymized',
        patientId: 'P-00000004',
        studyDate: '1999.05.05',
        studyInstanceUid: '2.16.840.1.113662.2.1.1519.11582.1990505.1105152',
        institutionName: '105 HOSPITAL',
      },
    },
  ],
};

export default mockData;
