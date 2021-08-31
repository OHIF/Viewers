export const studies = [
  {
    thumbnails: [
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_Lung.jpg',
        SeriesDescription: 'Anti-PD-1_Lung',
        active: true,
        SeriesNumber: '2',
        numImageFrames: 512,
        stackPercentComplete: 30,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/Anti-PD-1_MELANOMA.jpg',
        SeriesDescription: 'Anti-PD-1_MELANOMA',
        SeriesNumber: '2',
        InstanceNumber: '1',
        numImageFrames: 256,
        stackPercentComplete: 70,
      },
      {
        altImageText: 'SR',
        SeriesDescription: 'Imaging Measurement Report',
        SeriesNumber: '3',
        stackPercentComplete: 100,
      },
    ],
  },
  {
    thumbnails: [
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-GBM.jpg',
        SeriesDescription: 'CPTAC-GBM',
        active: true,
        SeriesNumber: '2',
        numImageFrames: 512,
        stackPercentComplete: 100,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-CM.jpg',
        SeriesDescription: 'CPTAC-CM',
        SeriesNumber: '2',
        InstanceNumber: '1',
        numImageFrames: 256,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-HNSCC.jpg',
        SeriesDescription: 'CPTAC-HNSCC',
        SeriesNumber: '2',
        InstanceNumber: '1',
        numImageFrames: 256,
      },
      {
        imageSrc:
          'https://raw.githubusercontent.com/crowds-cure/cancer/master/public/screenshots/CPTAC-LSCC.jpg',
        SeriesDescription: 'CPTAC-LSCC',
        SeriesNumber: '2',
        InstanceNumber: '1',
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
