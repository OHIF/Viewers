const studyWithSR = {
  studyInstanceUid: '1',
  studyDate: '07-Sept-2010',
  studyDescription: 'CHEST/ABD/PELVIS W/CONTRAST',
  instances: 902,
  modalities: 'CT,SR',
  trackedSeries: 0,
  thumbnails: [
    {
      imageId:
        'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.826.0.13854362241694438965858641723883466450351448/series/1.2.826.0.13251432571622157432418024103657242430176808/instances/1.2.826.0.15850417012072555929373700124625600151309139/frames/1',
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e',
      seriesDescription: 'Multiple line image series description lorem sit',
      seriesNumber: 1,
      instanceNumber: 2,
      viewportIdentificator: 'A',
      numImageFrames: 36,
    },
    {
      imageId:
        'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.826.0.13854362241694438965858641723883466450351448/series/1.2.826.0.13251432571622157432418024103657242430176808/instances/1.2.826.0.15850417012072555929373700124625600151309139/frames/1',
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e2',
      seriesDescription: 'Multiple line image series description lorem sit',
      seriesNumber: 1,
      instanceNumber: 2,
      numImageFrames: 36,
    },
    {
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b890asdasd66e2',
      seriesDescription: 'Multiple line description lorem ipsum dolor sit amet',
      modality: 'SR',
      seriesDate: '07-Sept-2010',
    },
  ],
};

const studySimple = {
  studyInstanceUid: '2',
  studyDate: '07-Sept-2010',
  studyDescription: 'CHEST/ABD/PELVIS W/CONTRAST',
  instances: 902,
  modalities: 'CT',
  trackedSeries: 0,
  thumbnails: [
    {
      imageId:
        'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.826.0.13854362241694438965858641723883466450351448/series/1.2.826.0.13251432571622157432418024103657242430176808/instances/1.2.826.0.15850417012072555929373700124625600151309139/frames/1',
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e',
      seriesDescription: 'Multiple line image series description lorem sit',
      seriesNumber: 1,
      instanceNumber: 2,
      numImageFrames: 36,
    },
  ],
};

const studyTracked = {
  studyInstanceUid: '3',
  studyDate: '07-Sept-2010',
  studyDescription: 'CHEST/ABD/PELVIS W/CONTRAST',
  instances: 902,
  modalities: 'CT',
  trackedSeries: 4,
  thumbnails: [
    {
      imageId:
        'wadors:https://server.dcmjs.org/dcm4chee-arc/aets/DCM4CHEE/rs/studies/1.2.826.0.13854362241694438965858641723883466450351448/series/1.2.826.0.13251432571622157432418024103657242430176808/instances/1.2.826.0.15850417012072555929373700124625600151309139/frames/1',
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e',
      seriesDescription: 'Multiple line image series description lorem sit',
      seriesNumber: 1,
      instanceNumber: 2,
      numImageFrames: 36,
    },
  ],
};

export { studyWithSR, studySimple, studyTracked };
