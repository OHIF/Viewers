import HangingProtocolService from './HangingProtocolService';

/**
 * Tests for the choice between protocols, and for an unknown protocol id,
 * as requested in https://github.com/OHIF/Viewers/issues/6443.
 *
 * These tests complement `HangingProtocolService.test.js`, which covers the
 * comparisons of the hanging protocol rules but not the selection between
 * protocols nor the handling of an unknown protocol id.
 */

const matchingStudy = {
  StudyInstanceUID: 'matchingStudy',
  StudyDescription: 'A PETCT study type',
  PatientName: 'Test^Patient',
};

const matchingStudyDisplaySets = [
  {
    ...matchingStudy,
    SeriesInstanceUID: 'ds1',
    displaySetInstanceUID: 'displaySet1',
    numImageFrames: 11,
    Modality: 'CT',
  },
];

const nonMatchingStudy = {
  StudyInstanceUID: 'nonMatchingStudy',
  StudyDescription: 'An MR study type',
  PatientName: 'Test^Patient',
};

const nonMatchingStudyDisplaySets = [
  {
    ...nonMatchingStudy,
    SeriesInstanceUID: 'ds2',
    displaySetInstanceUID: 'displaySet2',
    numImageFrames: 11,
    Modality: 'MR',
  },
];

/**
 * Creates a minimal single viewport protocol for the given matching rules,
 * so that the tests can focus on the protocol selection itself.
 */
function createProtocol(id, protocolMatchingRules) {
  return {
    id,
    name: id,
    protocolMatchingRules,
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
}

const petCtMatchingRules = [
  {
    attribute: 'StudyDescription',
    constraint: {
      contains: 'PETCT',
    },
  },
];

/** Creates a service instance with the minimal mocked dependencies it needs. */
function createService() {
  const commandsManager = {
    run: jest.fn(),
  };
  const servicesManager = {
    services: {
      customizationService: {
        hasCustomization: () => false,
        getCustomization: () => undefined,
      },
    },
  };
  return new HangingProtocolService(commandsManager, servicesManager);
}

describe('HangingProtocolService protocol selection', () => {
  describe('run without a protocol id', () => {
    it('applies the protocol with the higher score', () => {
      const hangingProtocolService = createService();
      hangingProtocolService.addProtocol(
        'lowScore',
        createProtocol('lowScore', [{ ...petCtMatchingRules[0], weight: 1 }])
      );
      hangingProtocolService.addProtocol(
        'highScore',
        createProtocol('highScore', [{ ...petCtMatchingRules[0], weight: 2 }])
      );

      hangingProtocolService.run({
        studies: [matchingStudy],
        displaySets: matchingStudyDisplaySets,
      });

      expect(hangingProtocolService.getActiveProtocol().protocol.id).toBe('highScore');
    });

    it('applies the default protocol when no protocol matches the study', () => {
      const hangingProtocolService = createService();
      hangingProtocolService.addProtocol('petCt', createProtocol('petCt', petCtMatchingRules));
      hangingProtocolService.addProtocol('default', createProtocol('default', petCtMatchingRules));

      hangingProtocolService.run({
        studies: [nonMatchingStudy],
        displaySets: nonMatchingStudyDisplaySets,
      });

      expect(hangingProtocolService.getActiveProtocol().protocol.id).toBe('default');
    });
  });

  describe('run and getProtocolById with an unknown protocol id', () => {
    it('getProtocolById throws', () => {
      const hangingProtocolService = createService();
      hangingProtocolService.addProtocol('petCt', createProtocol('petCt', petCtMatchingRules));

      expect(() => hangingProtocolService.getProtocolById('unknownProtocol')).toThrow(
        'No protocol unknownProtocol found'
      );
    });

    it('run throws', () => {
      const hangingProtocolService = createService();
      hangingProtocolService.addProtocol('petCt', createProtocol('petCt', petCtMatchingRules));

      expect(() =>
        hangingProtocolService.run(
          {
            studies: [matchingStudy],
            displaySets: matchingStudyDisplaySets,
          },
          'unknownProtocol'
        )
      ).toThrow('No protocol unknownProtocol found');
    });
  });
});
