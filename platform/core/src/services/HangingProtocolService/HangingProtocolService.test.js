import HangingProtocolServiceClass from './HangingProtocolService';

const testProtocol = {
  id: 'test',
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  protocolMatchingRules: [
    {
      attribute: 'StudyDescription',
      constraint: {
        contains: 'PETCT',
      },
    },
  ],
  displaySetSelectors: {
    displaySetSelector: {
      seriesMatchingRules: [
        {
          weight: 1,
          attribute: 'Modality',
          constraint: {
            equals: 'CT',
          },
          required: true,
        },
        {
          weight: 1,
          attribute: 'numImageFrames',
          constraint: {
            greaterThan: 10,
          },
        },
      ],
      studyMatchingRules: [],
    },
  },
  stages: [
    {
      name: 'default',
      viewportStructure: {
        layoutType: 'grid',
        properties: {
          rows: 1,
          columns: 1,
        },
      },
      viewports: [
        {
          viewportOptions: {
            viewportId: 'ctAXIAL',
            viewportType: 'volume',
            orientation: 'axial',
            toolGroupId: 'ctToolGroup',
            customViewportOptions: {
              initialScale: 2.5,
            },
            initialImageOptions: {
              // index: 5,
              preset: 'first', // 'first', 'last', 'middle'
            },
            syncGroups: [
              {
                type: 'cameraPosition',
                id: 'axialSync',
                source: true,
                target: true,
              },
            ],
          },
          displaySets: [
            {
              id: 'displaySetSelector',
            },
          ],
        },
      ],
    },
  ],
  numberOfPriorsReferenced: -1,
};

function testProtocolGenerator({ servicesManager }) {
  servicesManager.services.TestService.toCall();

  return {
    protocol: testProtocol,
  };
}

const studyMatch = {
  StudyInstanceUID: 'studyMatch',
  StudyDescription: 'A PETCT study type',
};

const displaySet1 = {
  ...studyMatch,
  SeriesInstanceUID: 'ds1',
  displaySetInstanceUID: 'displaySet1',
  numImageFrames: 11,
  Modality: 'CT',
};

const displaySet2 = {
  ...displaySet1,
  SeriesInstanceUID: 'ds2',
  displaySetInstanceUID: 'displaySet2',
  Modality: 'PT',
};

const displaySet3 = {
  ...displaySet1,
  numImageFrames: 3,
  displaySetInstanceUID: 'displaySet3',
};

const studyMatchDisplaySets = [displaySet3, displaySet2, displaySet1];

function checkHpsBestMatch(hps) {
  hps.run({ studies: [studyMatch], displaySets: studyMatchDisplaySets });
  const { hpAlreadyApplied, viewportMatchDetails } = hps.getMatchDetails();
  expect(hpAlreadyApplied).toMatchObject(new Map([[0, false]]));
  expect(viewportMatchDetails.size).toBe(1);
  expect(viewportMatchDetails.get(0)).toMatchObject({
    viewportOptions: {
      viewportId: 'ctAXIAL',
      viewportType: 'volume',
      orientation: 'axial',
      toolGroupId: 'ctToolGroup',
    },
    // Matches ds1 because it matches 2 rules, a required and an optional
    // ds2 fails to match required and ds3 fails to match an optional.
    displaySetsInfo: [
      {
        SeriesInstanceUID: 'ds1',
        displaySetInstanceUID: 'displaySet1',
        displaySetOptions: {},
      },
    ],
  });
}

describe('HangingProtocolService', () => {
  const mockedFunction = jest.fn();
  const commandsManager = {};
  const servicesManager = {
    services: {
      TestService: {
        toCall: mockedFunction,
      },
    },
  };
  const hps = new HangingProtocolServiceClass(commandsManager, servicesManager);
  let initialScaling;

  afterEach(() => {
    mockedFunction.mockClear();
  });

  describe('with a static protocol', () => {
    beforeAll(() => {
      hps.addProtocol(testProtocol.id, testProtocol);
    });

    it('has one protocol', () => {
      expect(hps.getProtocols().length).toBe(1);
    });

    describe('run', () => {
      it('matches best image match', () => {
        checkHpsBestMatch(hps);
      });
    });
  });

  describe('with protocol generator', () => {
    beforeAll(() => {
      hps.addProtocol(testProtocol.id, testProtocolGenerator);
    });

    it('has one protocol', () => {
      expect(hps.getProtocols().length).toBe(1);
    });

    describe('run', () => {
      it('matches best image match', () => {
        checkHpsBestMatch(hps);
      });

      it('uses services manager', () => {
        hps.run({ studies: [studyMatch], displaySets: studyMatchDisplaySets });
        expect(mockedFunction).toHaveBeenCalledTimes(1);
      });
    });
  });
});
