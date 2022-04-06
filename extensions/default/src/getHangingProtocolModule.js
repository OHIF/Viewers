import ConfigPoint from 'config-point';

const hangingProtocolName = 'default';

/**
 * Define some hanging protocols that can be activated by setting the priority
 * See hangingProtocols.json5 for examples.
 */
const hangingProtocolConfig = ConfigPoint.createConfiguration("hangingProtocolConfig", {
  protocols: {
    configOperation: 'sort',
    sortKey: 'priority',
    value: [
      {
        id: '1x2',
        // Note the priority is null, so this will get excluded unless the priority is set
        priority: null,
        locked: true,
        hasUpdatedPriorsInformation: false,
        name: '1x2',
        createdDate: '2021-11-01T18:32:42.849Z',
        modifiedDate: '2021-11-01T18:32:42.849Z',
        availableTo: {},
        editableBy: {},
        protocolMatchingRules: [
          {
            id: 'NumberOfStudyRelatedSeries>1',
            weight: 10,
            attribute: 'NumberOfStudyRelatedSeries',
            constraint: {
              greaterThan: {
                value: 1,
              },
            },
            required: true,
          },
        ],
        stages: [
          {
            name: 'OneByTwo',
            viewportStructure: {
              type: 'grid',
              properties: {
                rows: 1,
                columns: 2,
              },
            },
            viewport: {},
          },
        ],
        numberOfPriorsReferenced: 0,
      },
      {
        id: '2x2',
        priority: null,
        locked: true,
        hasUpdatedPriorsInformation: false,
        name: '2x2',
        createdDate: '2021-11-01T18:32:42.849Z',
        modifiedDate: '2021-11-01T18:32:42.849Z',
        availableTo: {},
        editableBy: {},
        protocolMatchingRules: [
          {
            id: 'NumberOfStudyRelatedSeries>2',
            weight: 20,
            attribute: 'NumberOfStudyRelatedSeries',
            constraint: {
              greaterThan: {
                value: 2,
              },
            },
            required: true,
          },
        ],
        stages: [
          {
            name: 'TwoByTwo',
            viewportStructure: {
              type: 'grid',
              properties: {
                rows: 2,
                columns: 2,
              },
            },
          },
        ],
        numberOfPriorsReferenced: 0,
      },
      {
        id: '2x3',
        priority: null,
        locked: true,
        hasUpdatedPriorsInformation: false,
        protocolMatchingRules: [
          {
            id: 'NumberOfStudyRelatedSeries>4',
            weight: 20,
            attribute: 'NumberOfStudyRelatedSeries',
            constraint: {
              greaterThan: {
                value: 4,
              },
            },
            required: true,
          },
        ],
        stages: [
          {
            name: 'TwoByThree',
            viewportStructure: {
              type: 'grid',
              properties: {
                rows: 2,
                columns: 3,
              },
            },
          },
        ],
        numberOfPriorsReferenced: 0,
      },
      {
        id: 'PET/CT',
        priority: null,
        locked: true,
        hasUpdatedPriorsInformation: false,
        name: 'PET/CT',
        createdDate: '2021-02-23T18:32:42.849Z',
        modifiedDate: '2021-02-23T18:32:42.849Z',
        availableTo: {},
        editableBy: {},
        protocolMatchingRules: [
          {
            id: 'wauZK2QNEfDPwcAQo',
            weight: 1,
            attribute: 'StudyInstanceUID',
            constraint: {
              equals: {
                value: '1.3.6.1.4.1.25403.345050719074.3824.20170125112931.11',
              },
            },
            required: true,
          },
        ],
        stages: [
          {
            id: 'hYbmMy3b7pz7GLiaT',
            name: 'oneByTwo',
            viewportStructure: {
              type: 'grid',
              properties: {
                rows: 2,
                columns: 2,
              },
            },
            viewports: [
              {
                viewportSettings: [
                  {
                    options: {
                      voi: {
                        windowWidth: 500,
                        windowCenter: 500,
                      },
                    },
                    commandName: '',
                    // Type can be viewport or prop
                    // viewport:  It is most suited for settings that
                    // should be applied before the first render
                    // prop: It is the type of command that can be applied
                    // after the image render, such as tool activations.
                    type: 'viewport',
                  },
                ],
                imageMatchingRules: [],
                seriesMatchingRules: [
                  {
                    id: 'vSjk7NCYjtdS3XZAw',
                    weight: 1,
                    attribute: 'SeriesNumber',
                    constraint: {
                      equals: {
                        value: "4",
                      },
                    },
                    required: false,
                  },
                ],
                studyMatchingRules: [],
              },
              {
                viewportSettings: [
                  {
                    options: {
                      invert: true,
                    },
                    commandName: '',
                    type: 'viewport',
                  },
                ],
                imageMatchingRules: [

                ],
                seriesMatchingRules: [
                  {
                    id: 'GPEYqFLv2dwzCM322',
                    weight: 1,
                    attribute: 'SeriesNumber',
                    constraint: {
                      equals: {
                        value: "1",
                      },
                    },
                    required: false,
                  },
                ],
                studyMatchingRules: [

                ],
              },
              {
                viewportSettings: [
                  {
                    options: {
                      invert: true,
                    },
                    commandName: '',
                    type: 'viewport',
                  },
                ],
                imageMatchingRules: [

                ],
                seriesMatchingRules: [
                  {
                    id: 'GPEYqFLv2dwzCM322',
                    weight: 1,
                    attribute: 'SeriesNumber',
                    constraint: {
                      equals: {
                        value: "6",
                      },
                    },
                    required: false,
                  },
                ],
                studyMatchingRules: [

                ],
              },
              {
                viewportSettings: [
                  {
                    options: {
                      invert: true,
                    },
                    commandName: '',
                    type: 'viewport',
                  },
                ],
                imageMatchingRules: [

                ],
                seriesMatchingRules: [
                  {
                    id: 'GPEYqFLv2dwzCM322',
                    weight: 1,
                    attribute: 'SeriesDescription',
                    constraint: {
                      contains: {
                        value: "Corrected",
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
                        value: "Uncorrected",
                      },
                    },
                    required: false,
                  },
                ],
                studyMatchingRules: [

                ],
              },
            ],
            createdDate: '2021-02-23T18:32:42.850Z',
          },
        ],
        numberOfPriorsReferenced: 0,
      },
    ],
  },
});

function getHangingProtocolModule() {
  return [
    {
      name: hangingProtocolName,
      protocols: hangingProtocolConfig.protocols,
    },
  ];
}

export default getHangingProtocolModule;

export { hangingProtocolConfig, getHangingProtocolModule };
