export const studies = [
  {
    thumbnails: [
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_Lung.jpg',
        seriesDescription: 'Anti-PD-1_Lung',
        active: true,
        seriesNumber: '2',
        numImageFrames: 512,
        stackPercentComplete: 30,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_MELANOMA.jpg',
        seriesDescription: 'Anti-PD-1_MELANOMA',
        seriesNumber: '2',
        instanceNumber: '1',
        numImageFrames: 256,
        stackPercentComplete: 70,
      },
      {
        altImageText: 'SR',
        seriesDescription: 'Imaging Measurement Report',
        seriesNumber: '3',
        stackPercentComplete: 100,
      },
    ],
  },
  {
    thumbnails: [
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-GBM.jpg',
        seriesDescription: 'CPTAC-GBM',
        active: true,
        seriesNumber: '2',
        numImageFrames: 512,
        stackPercentComplete: 100,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-CM.jpg',
        seriesDescription: 'CPTAC-CM',
        seriesNumber: '2',
        instanceNumber: '1',
        numImageFrames: 256,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-HNSCC.jpg',
        seriesDescription: 'CPTAC-HNSCC',
        seriesNumber: '2',
        instanceNumber: '1',
        numImageFrames: 256,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-LSCC.jpg',
        seriesDescription: 'CPTAC-LSCC',
        seriesNumber: '2',
        instanceNumber: '1',
        numImageFrames: 256,
      },
    ],
  },
];

export function onThumbnailClick() {
  console.warn('onThumbnailClick');
}

export function onThumbnailDoubleClick() {
  console.warn('onThumbnailDoubleClick');
}
