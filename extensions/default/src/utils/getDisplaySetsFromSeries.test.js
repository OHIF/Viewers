import { classes } from '@ohif/core';
import getDisplaySetsFromSeries from './getDisplaySetsFromSeries';
import getDisplaySetMessages from '../getDisplaySetMessages';

const { ImageSet } = classes;

jest.mock('../getDisplaySetMessages');

describe('getDisplaySetsFromSeries', () => {
  let appContext;
  let instances;
  let customizationService;
  let extensionManager;

  const isDisplaySetReconstructable = jest.fn();

  beforeEach(() => {
    extensionManager = {
      getModuleEntry: jest.fn().mockReturnValue({
        exports: {
          getDynamicVolumeInfo: jest.fn().mockReturnValue({
            isDynamicVolume: false,
            timePoints: [],
          }),
        },
      }),
    };

    customizationService = {
      get: jest.fn().mockReturnValue([
        {
          ruleSelector: jest.fn().mockReturnValue(true),
          splitKey: ['SeriesInstanceUID'],
        },
      ]),
    };

    appContext = {
      extensionManager,
      servicesManager: {
        services: {
          customizationService,
        },
      },
      appConfig: {},
    };

    instances = [
      {
        imageId: 'image1',
        SeriesDate: '20210101',
        SeriesTime: '120000',
        SeriesInstanceUID: '1.2.3',
        StudyInstanceUID: '1.2.3.4',
        SeriesNumber: 1,
        FrameTime: 30,
        SOPClassUID: '1.2.840.10008.5.1.4.1.1.2',
        SeriesDescription: 'Test Series',
        Modality: 'CT',
        NumberOfFrames: 1,
        AcquisitionDateTime: '20210101120000',
        InstanceNumber: 1,
      },
    ];

    isDisplaySetReconstructable.mockReturnValue({ value: true });
    getDisplaySetMessages.mockReturnValue([]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should throw an error if no instances are provided', () => {
    expect(() => getDisplaySetsFromSeries('key', [], appContext, [])).toThrow(
      'No instances were provided'
    );
  });

  it('should create display sets from instances', () => {
    const displaySets = getDisplaySetsFromSeries('key', [], appContext, instances);

    expect(displaySets).toHaveLength(1);
    const displaySet = displaySets[0];
    expect(displaySet).toBeInstanceOf(ImageSet);
    expect(displaySet.getAttribute('SeriesDate')).toBe('20210101');
    expect(displaySet.getAttribute('SeriesTime')).toBe('120000');
    expect(displaySet.getAttribute('SeriesInstanceUID')).toBe('1.2.3');
    expect(displaySet.getAttribute('StudyInstanceUID')).toBe('1.2.3.4');
    expect(displaySet.getAttribute('SeriesNumber')).toBe(1);
    expect(displaySet.getAttribute('FrameRate')).toBe(30);
    expect(displaySet.getAttribute('SOPClassUID')).toBe('1.2.840.10008.5.1.4.1.1.2');
    expect(displaySet.getAttribute('SeriesDescription')).toBe('Test Series');
    expect(displaySet.getAttribute('Modality')).toBe('CT');
    expect(displaySet.getAttribute('isMultiFrame')).toBe(false);
    expect(displaySet.getAttribute('numImageFrames')).toBe(1);
    expect(displaySet.getAttribute('isReconstructable')).toBe(false);
    expect(displaySet.getAttribute('messages')).toEqual([]);
    expect(displaySet.getAttribute('averageSpacingBetweenFrames')).toBe(null);
    expect(displaySet.getAttribute('isDynamicVolume')).toBe(false);
    expect(displaySet.getAttribute('dynamicVolumeInfo')).toEqual({
      isDynamicVolume: false,
      timePoints: [],
    });
  });
});
