import ConfigPoint from 'config-point';

const { ThemeProtocols } = ConfigPoint.register({
  ThemeProtocols: {
    configBase: {
      protocols: [
        {
          id: '1x2',
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
      ],
    },
  },
});

export default ThemeProtocols;
