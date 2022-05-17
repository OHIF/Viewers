const defaultProtocol = {
  id: 'default',
  locked: true,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2021-02-23T19:22:08.894Z',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [],
  toolGroupIds: ['default'],
  stages: [
    {
      id: 'hYbmMy3b7pz7GLiaT',
      name: 'default',
      viewportStructure: {
        type: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      displaySets: [
        {
          id: 'displaySet',
          imageMatchingRules: [],
          seriesMatchingRules: [],
          studyMatchingRules: [],
        },
      ],
      viewports: [
        {
          viewportOptions: {
            toolGroupId: 'default',
          },
          displaySets: [
            {
              options: [],
              id: 'displaySet',
            },
          ],
        },
      ],
      createdDate: '2021-02-23T18:32:42.850Z',
    },
  ],
  numberOfPriorsReferenced: -1,
};

const testProtocol = {
  id: 'test',
  locked: true,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2021-02-23T19:22:08.894Z',
  availableTo: {},
  editableBy: {},
  protocolMatchingRules: [
    {
      id: 'wauZK2QNEfDPwcAQo',
      weight: 1,
      attribute: 'StudyInstanceUID',
      constraint: {
        contains: {
          value: '1.3.6.1.4.',
        },
      },
      required: false,
    },
    {
      id: 'wauZK2QNEfDPwcAQo',
      weight: 1,
      attribute: 'StudyDescription',
      constraint: {
        contains: {
          value: 'PETCT',
        },
      },
      required: false,
    },
    {
      id: 'wauZK2QNEfDPwcAQo',
      weight: 1,
      attribute: 'StudyDescription',
      constraint: {
        contains: {
          value: 'PET/CT',
        },
      },
      required: false,
    },
  ],
  toolGroupIds: ['default'],
  stages: [
    {
      id: 'hYbmMy3b7pz7GLiaT',
      name: 'default',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 2,
          columns: 2,
          viewportOptions: [
            // {
            //   x: 0,
            //   y: 0,
            //   width: 1 / 3,
            //   height: 1 / 3,
            // },
            // {
            //   x: 1 / 3,
            //   y: 0,
            //   width: 1 / 3,
            //   height: 1 / 3,
            // },
            // {
            //   x: 0,
            //   y: 1 / 3,
            //   width: 2 / 3,
            //   height: 2 / 3,
            // },
            // {
            //   x: 2 / 3,
            //   y: 0,
            //   width: 1 / 3,
            //   height: 1,
            // },
          ],
        },
      },
      displaySets: [
        {
          id: 'ctDisplaySet',
          imageMatchingRules: [],
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'Modality',
              constraint: {
                equals: {
                  value: 'CT',
                },
              },
              required: true,
            },
            {
              id: 'vSjk7NCYjtdS3XZAw',
              weight: 1,
              attribute: 'SeriesNumber',
              constraint: {
                equals: {
                  value: '4',
                },
              },
              required: false,
            },
            {
              id: 'vSjk7NCYjtdS3XZAw',
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: {
                contains: {
                  value: 'CT',
                },
              },
              required: false,
            },
            {
              id: 'vSjk7NCYjtdS3XZAw',
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: {
                contains: {
                  value: 'CT WB',
                },
              },
              required: false,
            },
          ],
          studyMatchingRules: [],
        },
        {
          id: 'ptDisplaySet',
          imageMatchingRules: [],
          seriesMatchingRules: [
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'Modality',
              constraint: {
                equals: {
                  value: 'PT',
                },
              },
              required: true,
            },
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: {
                contains: {
                  value: 'Corrected',
                },
              },
              required: false,
            },
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 2,
              attribute: 'SeriesDescription',
              constraint: {
                doesNotContain: {
                  value: 'Uncorrected',
                },
              },
              required: false,
            },
          ],
          studyMatchingRules: [],
        },
      ],
      viewports: [
        {
          viewportOptions: {
            viewportId: 'ctSagittal',
            viewportType: 'volume',
            orientation: 'AXIAL',
            toolGroupId: 'default',
            // initialImageIndex: {
            //   index: 100,
            //   preset: 'first', // 'middle', 'last',
            // }
          },
          displaySets: [
            {
              id: 'ctDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'ptSagittal',
            viewportType: 'volume',
            background: [1, 1, 1],
            orientation: 'SAGITTAL',
            toolGroupId: 'default',
          },
          displaySets: [
            {
              options: {
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
                voiInverted: true,
              },
              id: 'ptDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'fusionSagittal',
            viewportType: 'volume',
            orientation: 'SAGITTAL',
            toolGroupId: 'default',
          },
          displaySets: [
            {
              id: 'ctDisplaySet',
            },
            {
              options: {
                colormap: 'hsv',
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
              },
              id: 'ptDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'mipSagittal',
            viewportType: 'volume',
            orientation: 'SAGITTAL',
            background: [1, 1, 1],
            toolGroupId: 'default',
          },
          displaySets: [
            {
              options: {
                blendMode: 'MIP',
                voi: {
                  windowWidth: 5,
                  windowCenter: 2.5,
                },
                voiInverted: true,
              },
              id: 'ptDisplaySet',
            },
          ],
        },
      ],
      createdDate: '2021-02-23T18:32:42.850Z',
    },
  ],
  numberOfPriorsReferenced: -1,
};

function getHangingProtocolModule() {
  return [
    {
      name: 'default',
      // protocols: [defaultProtocol, testProtocol],
      protocols: [defaultProtocol, testProtocol],
    },
  ];
}

export default getHangingProtocolModule;
