export default [
  {
    maxMeasurements: 5,
    groupName: 'Targets',
    measurements: [
      {
        measurementId: '123',
        measurementNumber: '123',
        itemNumber: 1,
        label: 'Chest Wall Posterior',
        hasWarnings: true,
        warningTitle: 'Criteria nonconformities',
        isSplitLesion: false,
        warningList: [
          'All measurements should have a location',
          'Nodal lesions must be >= 15mm short axis AND >= double the acquisition slice thickness by CT and MR',
        ],
        data: [
          {
            displayText: '25.7 x 12.9',
          },
          {
            displayText: '24.7 x 11.5',
          },
          {},
        ],
      },
      {
        measurementId: '124',
        measurementNumber: '124',
        itemNumber: 2,
        label: 'Bone Extremity',
        data: [
          {
            displayText: '24.7 x 11.1',
          },
          {
            displayText: '21.2 x 10.9',
          },
          {},
        ],
      },
    ],
  },
  {
    maxMeasurements: 3,
    groupName: 'NonTargets',
    measurements: [
      {
        measurementId: '125',
        measurementNumber: '125',
        itemNumber: 1,
        label: 'Chest Wall Single Site',
        data: [
          {
            displayText: 'MD',
          },
          {
            displayText: 'NM',
          },
          {},
        ],
      },
      {
        measurementId: '126',
        measurementNumber: '126',
        itemNumber: 2,
        label: 'Extremity Multiple Sites',
        data: [
          {
            displayText: 'CR',
          },
          {},
          {},
        ],
      },
      {
        measurementId: '127',
        measurementNumber: '127',
        label: 'Extremity Site',
        data: [
          {
            displayText: 'CR',
          },
          {},
          {
            displayText: 'NM',
          },
        ],
      },
    ],
  },
];
