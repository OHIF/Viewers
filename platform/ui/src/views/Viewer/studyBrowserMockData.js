import Thumb1 from './thumb1.png';
import Thumb2 from './thumb2.png';
import Thumb3 from './thumb3.png';

const studyWithSR = {
  studyInstanceUid: '1',
  date: '07-Sept-2010',
  description: 'CHEST/ABD/PELVIS W/CONTRAST',
  numInstances: 902,
  modalities: 'CT,SR',
  displaySets: [
    {
      displaySetInstanceUid: 'f69f6asdasd48c-223e-db7f-c4af-b8906641a66e',
      description: 'Topogram 0.6 T80s',
      seriesNumber: 1,
      numInstances: 1,
      componentType: 'thumbnailTracked',
      viewportIdentificator: 'A',
      imageSrc: Thumb1,
    },
    {
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4asdasdaf-b8906641a66e',
      description: 'Topogram 0.6 T80s',
      seriesNumber: 2,
      numInstances: 1,
      componentType: 'thumbnailTracked',
      imageSrc: Thumb2,
    },
    {
      displaySetInstanceUid: 'f69f648c-223e-dasdasdb7f-c4af-b8906641a66e',
      description: 'CT WB 5.0 B35f',
      seriesNumber: 3,
      numInstances: 68,
      componentType: 'thumbnailTracked',
      imageSrc: Thumb3,
    },
    {
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4afas-b8906asd641a66e',
      description: 'Measurement Report 25-April-2020',
      modality: 'SR',
      componentType: 'thumbnailNoImage',
      seriesDate: '07-Sept-2010',
      viewportIdentificator: 'B',
    },
  ],
};

const studySimple = {
  studyInstanceUid: '2',
  date: '05-Sept-2011',
  description: 'CHEST/ABD/PELVIS W/CONTRAST',
  numInstances: 480,
  modalities: 'CT',
  displaySets: [
    {
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4af-b8906641a66e',
      description: 'SCOUT',
      seriesNumber: 1,
      numInstances: 1,
      componentType: 'thumbnailTracked',
      imageSrc: Thumb1,
    },
    {
      displaySetInstanceUid: 'f69f648c-223e-db7f-c4asdasdaf-b8906641a66e',
      description: 'Topogram 0.6 T80s',
      seriesNumber: 2,
      numInstances: 1,
      componentType: 'thumbnailTracked',
      imageSrc: Thumb2,
    },
    {
      displaySetInstanceUid: 'f69f648c-223e-dasdasdb7f-c4af-b8906641a66e',
      description: 'CT WB 5.0 B35f',
      seriesNumber: 3,
      numInstances: 68,
      componentType: 'thumbnailTracked',
      imageSrc: Thumb3,
      isTracked: true,
    },
  ],
};

const tabs = [
  {
    name: 'primary',
    label: 'Primary',
    studies: [studySimple],
  },
  {
    name: 'recent',
    label: 'Recent',
    studies: [studyWithSR, studySimple],
  },
  {
    name: 'all',
    label: 'All',
    studies: [studySimple, studyWithSR],
  },
];

export { tabs };
