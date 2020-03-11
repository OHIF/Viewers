export default [
  {
    StudyInstanceUID: '10001',
    StudyDescription: 'Anti-PD-1',
    modalities: 'CT',
    StudyDate: '18-nov-2018',
    active: false,
    thumbnails: [
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_Lung.jpg',
        SeriesDescription: 'Anti-PD-1_Lung',
        SeriesNumber: '2',
        numImageFrames: 512,
        displaySetInstanceUID: '10001-1',
        stackPercentComplete: 30,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_MELANOMA.jpg',
        SeriesDescription: 'Anti-PD-1_MELANOMA',
        SeriesNumber: '2',
        InstanceNumber: '1',
        numImageFrames: 256,
        displaySetInstanceUID: '10001-2',
        stackPercentComplete: 70,
      },
    ],
  },
  {
    StudyInstanceUID: '10002',
    StudyDescription: 'CPTAC',
    modalities: 'CT',
    StudyDate: '16-aug-2017',
    active: true,
    thumbnails: [
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-GBM.jpg',
        SeriesDescription: 'CPTAC-GBM',
        active: true,
        SeriesNumber: '2',
        numImageFrames: 512,
        displaySetInstanceUID: '10002-1',
        stackPercentComplete: 100,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-CM.jpg',
        SeriesDescription: 'CPTAC-CM',
        SeriesNumber: '2',
        InstanceNumber: '1',
        displaySetInstanceUID: '10002-2',
        numImageFrames: 256,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-HNSCC.jpg',
        SeriesDescription: 'CPTAC-HNSCC',
        SeriesNumber: '2',
        InstanceNumber: '1',
        displaySetInstanceUID: '10002-3',
        numImageFrames: 256,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-LSCC.jpg',
        SeriesDescription: 'CPTAC-LSCC',
        SeriesNumber: '2',
        InstanceNumber: '1',
        displaySetInstanceUID: '10002-4',
        numImageFrames: 256,
      },
    ],
  },
];
