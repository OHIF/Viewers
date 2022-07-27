import HangingProtocolServiceClass from "./HangingProtocolService";

const testProtocol = {
  id: 'test',
  locked: true,
  hasUpdatedPriorsInformation: false,
  name: 'Default',
  createdDate: '2021-02-23T19:22:08.894Z',
  modifiedDate: '2021-02-23T19:22:08.894Z',
  availableTo: {},
  editableBy: {},
  toolGroupIds: [
    'ctToolGroup',
    'ptToolGroup',
  ],
  imageLoadStrategy: 'interleaveTopToBottom', // "default" , "interleaveTopToBottom",  "interleaveCenter"
  protocolMatchingRules: [
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
  ],
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
      ],
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
              id: 'displaySet',
            },
          ],
        },
      ],
    },
  ],
  numberOfPriorsReferenced: -1,
};

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
}

const displaySet3 = {
  ...displaySet1,
  numImageFrames: 3,
  displaySetInstanceUID: 'displaySet3',
}

const studyMatchDisplaySets = [displaySet3, displaySet2, displaySet1];

describe("HangingProtocolService", () => {
  const commandsManager = {};
  const hps = new HangingProtocolServiceClass(commandsManager);
  let initialScaling;

  beforeAll(() => {
    hps.addProtocols([testProtocol]);
    hps.addCustomViewportOptions('initialScale', 'Set initial scaling', (id, value) => (initialScaling = value));
  })

  it('has one protocol', () => {
    expect(hps.getProtocols().length).toBe(1);
  })

  describe('run', () => {
    it('matches best image match', () => {
      hps.run({ studies: [studyMatch], displaySets: studyMatchDisplaySets })
      const state = hps.getState();
      const [matchDetails, alreadyApplied] = state;
      expect(alreadyApplied).toMatchObject([false]);
      expect(matchDetails.length).toBe(1);
      expect(matchDetails[0]).toMatchObject(
        {
          viewportOptions: {
            viewportId: 'ctAXIAL',
            viewportType: 'volume',
            orientation: 'axial',
            toolGroupId: 'ctToolGroup',
          },
          // Matches ds1 because it matches 2 rules, a required and an optional
          // ds2 fails to match required and ds3 fails to match an optional.
          displaySetsInfo: [{
            SeriesInstanceUID: 'ds1',
            displaySetInstanceUID: 'displaySet1',
            displaySetOptions: {}
          }]
        }
      )
    })
  })
  describe('applyCustomViewportSettings', () => {
    it('Calls custom apply method', () => {
      hps.run({ studies: [studyMatch], displaySets: studyMatchDisplaySets })
      const state = hps.getState();
      const [matchDetails, alreadyApplied] = state;
      const { viewportOptions } = matchDetails[0]
      initialScaling = undefined;
      hps.applyCustomViewportOptions(viewportOptions, {});
      expect(initialScaling).toBe(2.5);
    })
  })
});
