const mockData = {
  studies: [
    {
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
      thumbnails: [
        {
          imageId:
            'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.826.0.13854362241694438965858641723883466450351448/series/1.2.826.0.13251432571622157432418024103657242430176808/instances/1.2.826.0.15850417012072555929373700124625600151309139/frames/1',
          displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e',
          seriesDescription: 'FLAIR',
          seriesNumber: 1,
          instanceNumber: 2,
          numImageFrames: 36,
        },
        {
          imageId:
            'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.826.0.13854362241694438965858641723883466450351448/series/1.2.826.0.13251432571622157432418024103657242430176808/instances/1.2.826.0.15850417012072555929373700124625600151309139/frames/1',
          displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e2',
          seriesDescription: 'FLAIR',
          seriesNumber: 1,
          instanceNumber: 2,
          numImageFrames: 36,
        },
        {
          imageId:
            'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.826.0.13854362241694438965858641723883466450351448/series/1.2.826.0.13251432571622157432418024103657242430176808/instances/1.2.826.0.15850417012072555929373700124625600151309139/frames/1',
          displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e3',
          seriesDescription: 'FLAIR',
          seriesNumber: 1,
          instanceNumber: 2,
          numImageFrames: 36,
        },
        {
          imageId:
            'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.826.0.13854362241694438965858641723883466450351448/series/1.2.826.0.13251432571622157432418024103657242430176808/instances/1.2.826.0.15850417012072555929373700124625600151309139/frames/1',
          displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e4',
          seriesDescription: 'FLAIR',
          seriesNumber: 1,
          instanceNumber: 2,
          numImageFrames: 36,
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
    {
      seriesList: [
        {
          seriesInstanceUid: '1.2.840.113619.2.1.2411.1031152382.365.736169244',
          modality: 'CT',
          seriesNumber: 365,
          seriesDate: '1993.04.30',
          seriesTime: '11:27:24',
        },
      ],
      thumbnails: [
        {
          imageId:
            'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.826.0.13854362241694438965858641723883466450351448/series/1.2.826.0.13251432571622157432418024103657242430176808/instances/1.2.826.0.15850417012072555929373700124625600151309139/frames/1',
          displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e',
          seriesDescription: 'FLAIR',
          seriesNumber: 1,
          instanceNumber: 2,
          numImageFrames: 36,
        },
      ],
      seriesMap: {
        '1.2.840.113619.2.1.2411.1031152382.365.736169244': {
          seriesInstanceUid: '1.2.840.113619.2.1.2411.1031152382.365.736169244',
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
    {
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
      thumbnails: [
        {
          imageId:
            'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.826.0.13854362241694438965858641723883466450351448/series/1.2.826.0.13251432571622157432418024103657242430176808/instances/1.2.826.0.15850417012072555929373700124625600151309139/frames/1',
          displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e',
          seriesDescription: 'FLAIR',
          seriesNumber: 1,
          instanceNumber: 2,
          numImageFrames: 36,
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
  ],
};

export default mockData;
