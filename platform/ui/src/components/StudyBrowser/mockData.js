const studyWithSR = {
  studyInstanceUid: '1',
  studyDate: '07-Sept-2010',
  studyDescription: 'CHEST/ABD/PELVIS W/CONTRAST',
  instances: 902,
  modalities: 'CT,SR',
  trackedSeries: 1,
  thumbnails: [
    {
      displaySetInstanceUid: 'f69f6asdasd48c-223e-db7f-c4af-b8906641a66e',
      seriesDescription: 'Multiple line image series description lorem sit',
      seriesNumber: 1,
      instanceNumber: 68,
      viewportIdentificator: 'A',
      isTracked: true,
    },
    {
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4asdasdaf-b8906641a66e',
      seriesDescription: 'Multiple line image series description lorem sit',
      seriesNumber: 1,
      instanceNumber: 68,
      viewportIdentificator: 'B',
    },
    {
      displaySetInstanceUid: 'f69f648c-223e-dasdasdb7f-c4af-b8906641a66e',
      seriesDescription: 'Multiple line image series description lorem sit',
      seriesNumber: 1,
      instanceNumber: 68,
    },
    {
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4afas-b8906asd641a66e',
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
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e',
      seriesDescription: 'Multiple line image series description lorem sit',
      seriesNumber: 1,
      instanceNumber: 68,
    },
  ],
};

const studyTracked = {
  studyInstanceUid: '3',
  studyDate: '07-Sept-2010',
  studyDescription: 'CHEST/ABD/PELVIS W/CONTRAST',
  instances: 902,
  modalities: 'CT',
  trackedSeries: 0,
  thumbnails: [
    {
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e',
      seriesDescription: 'Multiple line image series description lorem sit',
      seriesNumber: 1,
      instanceNumber: 68,
    },
  ],
};

export { studyWithSR, studySimple, studyTracked };
