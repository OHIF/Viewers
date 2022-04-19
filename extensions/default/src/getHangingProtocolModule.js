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
        layoutType: 'grid',
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
        type: 'grid',
        properties: {
          rows: 1,
          columns: 2,
          viewportOptions: [],
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
          id: 'ptACDisplaySet',
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
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: {
                contains: {
                  value: 'AC',
                },
              },
              required: false,
            },
          ],
          studyMatchingRules: [],
        },
        {
          id: 'ptNACDisplaySet',
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
                  value: 'Uncorrected',
                },
              },
              required: false,
            },
            {
              id: 'GPEYqFLv2dwzCM322',
              weight: 1,
              attribute: 'SeriesDescription',
              constraint: {
                contains: {
                  value: 'NAC',
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
            viewportId: 'ctAxial',
            viewportType: 'stack',
            background: [0, 0, 0],
            orientation: 'AXIAL',
            toolGroupId: 'default',
          },
          displaySets: [
            {
              options: { voi: 'default', voiInverted: false },
              id: 'ctDisplaySet',
            },
          ],
        },
        {
          viewportOptions: {
            viewportId: 'ptAxial',
            viewportType: 'stack',
            background: [1, 1, 1],
            orientation: 'AXIAL',
            toolGroupId: 'default',
          },
          displaySets: [
            {
              options: { voi: [5, 2.5], voiInverted: true },
              id: 'ptACDisplaySet',
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
      protocols: [defaultProtocol, testProtocol],
    },
  ];
}

export default getHangingProtocolModule;
