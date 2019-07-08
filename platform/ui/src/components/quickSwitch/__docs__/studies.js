export default [
  {
    studyInstanceUid: '10001',
    studyDescription: 'Anti-PD-1',
    modalities: 'CT',
    studyDate: '18-nov-2018',
    active: false,
    thumbnails: [
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_Lung.jpg',
        seriesDescription: 'Anti-PD-1_Lung',
        seriesNumber: '2',
        numImageFrames: 512,
        displaySetInstanceUid: '10001-1',
        stackPercentComplete: 30,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_MELANOMA.jpg',
        seriesDescription: 'Anti-PD-1_MELANOMA',
        seriesNumber: '2',
        instanceNumber: '1',
        numImageFrames: 256,
        displaySetInstanceUid: '10001-2',
        stackPercentComplete: 70,
      },
    ],
  },
  {
    studyInstanceUid: '10002',
    studyDescription: 'CPTAC',
    modalities: 'CT',
    studyDate: '16-aug-2017',
    active: true,
    thumbnails: [
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-GBM.jpg',
        seriesDescription: 'CPTAC-GBM',
        active: true,
        seriesNumber: '2',
        numImageFrames: 512,
        displaySetInstanceUid: '10002-1',
        stackPercentComplete: 100,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-CM.jpg',
        seriesDescription: 'CPTAC-CM',
        seriesNumber: '2',
        instanceNumber: '1',
        displaySetInstanceUid: '10002-2',
        numImageFrames: 256,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-HNSCC.jpg',
        seriesDescription: 'CPTAC-HNSCC',
        seriesNumber: '2',
        instanceNumber: '1',
        displaySetInstanceUid: '10002-3',
        numImageFrames: 256,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-LSCC.jpg',
        seriesDescription: 'CPTAC-LSCC',
        seriesNumber: '2',
        instanceNumber: '1',
        displaySetInstanceUid: '10002-4',
        numImageFrames: 256,
      },
    ],
  },
];
