import { Types as cstTypes, utilities as cstUtilities } from '@cornerstonejs/tools';
import {
  updateSegmentationStats,
  updateSegmentBidirectionalStats,
} from './updateSegmentationStats';

jest.mock('@cornerstonejs/tools', () => ({
  utilities: {
    segmentation: {
      getStatistics: jest.fn(),
    },
  },
}));

describe('updateSegmentationStats', () => {
  const mockSegmentation = {
    segments: {
      '1': {
        segmentIndex: 1,
        label: 'Segment 1',
      },
      '2': {
        segmentIndex: 2,
        label: 'Segment 2',
      },
    },
  };

  const mockReadableText = {
    mean: 'Mean',
    stdDev: 'Standard Deviation',
    volume: 'Volume',
    max: 'Maximum',
  };

  const mockStats = {
    '1': {
      array: [
        {
          name: 'mean',
          value: 100.5,
          unit: 'HU',
        },
      ],
    } as cstTypes.NamedStatistics,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null if no segmentation is provided', async () => {
    const result = await updateSegmentationStats({
      segmentation: null,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result).toBe(null);
    expect(cstUtilities.segmentation.getStatistics).not.toHaveBeenCalled();
  });

  it('should return null if segmentation is undefined', async () => {
    const result = await updateSegmentationStats({
      segmentation: undefined,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result).toBe(null);
  });

  it('should return null if no segments found (empty segments)', async () => {
    const segmentationWithEmptySegments = {
      segments: {},
    };

    const result = await updateSegmentationStats({
      segmentation: segmentationWithEmptySegments,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result).toBe(null);
    expect(cstUtilities.segmentation.getStatistics).not.toHaveBeenCalled();
  });

  it('should return null if no segments found (only segment 0)', async () => {
    const segmentationWithOnlyBackground = {
      segments: {
        '0': {
          segmentIndex: 0,
          label: 'Background',
        },
      },
    };

    const result = await updateSegmentationStats({
      segmentation: segmentationWithOnlyBackground,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result).toBe(null);
    expect(cstUtilities.segmentation.getStatistics).not.toHaveBeenCalled();
  });

  it('should return null if getStatistics returns null', async () => {
    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(null);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(cstUtilities.segmentation.getStatistics).toHaveBeenCalledWith({
      segmentationId: 'test-id',
      segmentIndices: [1, 2],
      mode: 'individual',
    });
    expect(result).toBe(null);
  });

  it('should return null if getStatistics returns undefined', async () => {
    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(undefined);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result).toBe(null);
  });

  it('should initialize cachedStats if not present', async () => {
    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(mockStats);

    const segmentationWithoutCachedStats = {
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Segment 1',
        },
      },
    };

    const result = await updateSegmentationStats({
      segmentation: segmentationWithoutCachedStats,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats).toBeDefined();
    expect(result.segments['1'].cachedStats.namedStats).toBeDefined();
    expect(result.segments['1'].cachedStats.namedStats.mean).toEqual({
      name: mockStats['1'].array[0].name,
      label: mockReadableText.mean,
      value: mockStats['1'].array[0].value,
      unit: mockStats['1'].array[0].unit,
      order: 0,
    });
  });

  it('should preserve existing cachedStats and add namedStats', async () => {
    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(mockStats);

    const segmentationWithExistingCachedStats = {
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Segment 1',
          cachedStats: {
            existingData: 'test',
          },
        },
      },
    };

    const result = await updateSegmentationStats({
      segmentation: segmentationWithExistingCachedStats,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats.existingData).toBe('test');
    expect(result.segments['1'].cachedStats.namedStats.mean).toEqual({
      name: mockStats['1'].array[0].name,
      label: mockReadableText.mean,
      value: mockStats['1'].array[0].value,
      unit: mockStats['1'].array[0].unit,
      order: 0,
    });
  });

  it('should preserve existing namedStats and merge with new stats', async () => {
    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(mockStats);

    const segmentationWithExistingNamedStats = {
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Segment 1',
          cachedStats: {
            namedStats: {
              existingStat: {
                name: 'existingStat',
                value: 'existing',
              },
            },
          },
        },
      },
    };

    const result = await updateSegmentationStats({
      segmentation: segmentationWithExistingNamedStats,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats.namedStats.existingStat).toEqual({
      name: 'existingStat',
      value: 'existing',
    });
    expect(result.segments['1'].cachedStats.namedStats.mean).toEqual({
      name: mockStats['1'].array[0].name,
      label: mockReadableText.mean,
      value: mockStats['1'].array[0].value,
      unit: mockStats['1'].array[0].unit,
      order: 0,
    });
  });

  it('should skip stats not in readableText', async () => {
    const mockStatsWithUnknownStat = {
      '1': {
        array: [
          ...mockStats['1'].array,
          {
            name: 'unknownStat',
            value: 50,
            unit: 'mm',
          },
        ],
      } as cstTypes.NamedStatistics,
    };

    jest
      .spyOn(cstUtilities.segmentation, 'getStatistics')
      .mockResolvedValue(mockStatsWithUnknownStat);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats.namedStats.mean).toBeDefined();
    expect(result.segments['1'].cachedStats.namedStats.unknownStat).toBeUndefined();
  });

  it('should skip stats with invalid name', async () => {
    const mockStatsWithInvalidName = {
      '1': {
        array: [
          ...mockStats['1'].array,
          {
            name: null,
            value: 50,
            unit: 'mm',
          },
          {
            value: 25,
            unit: 'cm',
          },
        ],
      } as cstTypes.NamedStatistics,
    };

    jest
      .spyOn(cstUtilities.segmentation, 'getStatistics')
      .mockResolvedValue(mockStatsWithInvalidName);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats.namedStats.mean).toBeDefined();
    expect(Object.keys(result.segments['1'].cachedStats.namedStats)).toHaveLength(1);
  });

  it('should add volume stat when volume exists in segmentStats and readableText', async () => {
    console.log('mockSegmentation', mockSegmentation);

    const mockStatsWithVolume = {
      '1': {
        array: [...mockStats['1'].array],
        volume: {
          value: 250.75,
          unit: 'mm³',
        },
      } as cstTypes.NamedStatistics,
    };

    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(mockStatsWithVolume);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats.namedStats.volume).toEqual({
      name: 'volume',
      label: mockReadableText.volume,
      value: mockStatsWithVolume['1'].volume.value,
      unit: mockStatsWithVolume['1'].volume.unit,
      order: 2,
    });
  });

  it('should not add volume stat when volume not in readableText', async () => {
    console.log('mockSegmentation', mockSegmentation);

    const mockStatsWithVolume = {
      '1': {
        array: [...mockStats['1'].array],
        volume: {
          value: 250.75,
          unit: 'mm³',
        },
      } as cstTypes.NamedStatistics,
    };

    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(mockStatsWithVolume);

    const readableTextWithoutVolume = {
      mean: 'Mean',
      stdDev: 'Standard Deviation',
    };

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: readableTextWithoutVolume,
    });

    expect(result.segments['1'].cachedStats.namedStats.volume).toBeUndefined();
  });

  it('should not add volume stat when volume already exists in namedStats', async () => {
    const mockStatsWithVolume = {
      '1': {
        array: [
          {
            name: 'volume',
            value: 200.5,
            unit: 'mm³',
          },
        ],
        volume: {
          value: 250.75,
          unit: 'mm³',
        },
      } as cstTypes.NamedStatistics,
    };

    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(mockStatsWithVolume);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats.namedStats.volume).toEqual({
      name: 'volume',
      label: mockReadableText.volume,
      value: mockStatsWithVolume['1'].array[0].value,
      unit: mockStatsWithVolume['1'].volume.unit,
      order: 2,
    });
  });

  it('should not add volume stat when segmentStats.volume is missing', async () => {
    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(mockStats);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats.namedStats.volume).toBeUndefined();
  });

  it('should handle multiple segments with different stats', async () => {
    const mockStatsWithMax = {
      '1': {
        array: [
          ...mockStats['1'].array,
          {
            name: 'max',
            value: 200,
            unit: 'HU',
          },
        ],
      } as cstTypes.NamedStatistics,
      '2': {
        array: [
          {
            name: 'stdDev',
            value: 15.2,
            unit: 'HU',
          },
        ],
        volume: {
          value: 150.25,
          unit: 'mm³',
        },
      } as cstTypes.NamedStatistics,
    };

    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(mockStatsWithMax);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats.namedStats.mean).toEqual({
      name: mockStatsWithMax['1'].array[0].name,
      label: mockReadableText.mean,
      value: mockStatsWithMax['1'].array[0].value,
      unit: mockStatsWithMax['1'].array[0].unit,
      order: 0,
    });
    expect(result.segments['1'].cachedStats.namedStats.max).toEqual({
      name: mockStatsWithMax['1'].array[1].name,
      label: mockReadableText.max,
      value: mockStatsWithMax['1'].array[1].value,
      unit: mockStatsWithMax['1'].array[1].unit,
      order: 3,
    });
    expect(result.segments['2'].cachedStats.namedStats.stdDev).toEqual({
      name: mockStatsWithMax['2'].array[0].name,
      label: mockReadableText.stdDev,
      value: mockStatsWithMax['2'].array[0].value,
      unit: mockStatsWithMax['2'].array[0].unit,
      order: 1,
    });
    expect(result.segments['2'].cachedStats.namedStats.volume).toEqual({
      name: 'volume',
      label: mockReadableText.volume,
      value: mockStatsWithMax['2'].volume.value,
      unit: mockStatsWithMax['2'].volume.unit,
      order: 2,
    });
  });

  it('should add empty namedStats when no stats are returned(empty array)', async () => {
    const mockStatsWithEmptyArray = {
      '1': {
        array: [],
      } as cstTypes.NamedStatistics,
    };

    jest
      .spyOn(cstUtilities.segmentation, 'getStatistics')
      .mockResolvedValue(mockStatsWithEmptyArray);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats.namedStats).toEqual({});
  });

  it('should only initialize namedStats when no matching stats are found', async () => {
    const mockStatsWithUnknownStat = {
      '1': {
        array: [
          {
            name: 'unknownStat',
            value: 100,
            unit: 'unit',
          },
        ],
      } as cstTypes.NamedStatistics,
    };

    jest
      .spyOn(cstUtilities.segmentation, 'getStatistics')
      .mockResolvedValue(mockStatsWithUnknownStat);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats.namedStats).toEqual({});
  });

  it('should handle segments without array property by initializing cachedStats', async () => {
    const mockStatsWithNoArray = {
      '1': {} as cstTypes.NamedStatistics,
    };

    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(mockStatsWithNoArray);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentation,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result.segments['1'].cachedStats).toEqual({});
  });

  it('should not update segment if cachedStats is already initialized and no matching stats are found', async () => {
    const mockSegmentationWithCachedStats = {
      segments: {
        '1': {
          segmentIndex: 1,
          label: 'Segment 1',
          cachedStats: {
            namedStats: {
              existingStat: {
                name: 'existing',
                value: 'test',
              },
            },
          },
        },
      },
    };

    const mockStatsWithNoArray = {
      '1': {} as cstTypes.NamedStatistics,
    };

    jest.spyOn(cstUtilities.segmentation, 'getStatistics').mockResolvedValue(mockStatsWithNoArray);

    const result = await updateSegmentationStats({
      segmentation: mockSegmentationWithCachedStats,
      segmentationId: 'test-id',
      readableText: mockReadableText,
    });

    expect(result).toBe(null);
  });
});

describe('updateSegmentBidirectionalStats', () => {
  const mockSegmentationService = {
    getSegmentation: jest.fn(),
  };

  const mockAnnotation = {
    annotationUID: 'test-annotation-uid',
  };

  const mockBidirectionalData = {
    majorAxis: { length: 20.5 },
    minorAxis: { length: 15.3 },
    maxMajor: 20.5,
    maxMinor: 15.3,
  };

  const defaultParameters = {
    segmentationId: 'test-id',
    segmentIndex: 1,
    bidirectionalData: mockBidirectionalData,
    // @ts-expect-error - only part of the SegmentationService is needed
    segmentationService: mockSegmentationService as AppTypes.SegmentationService,
    annotation: mockAnnotation,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when segmentationId is missing', () => {
    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
      segmentationId: '',
    });

    expect(result).toBe(null);
    expect(mockSegmentationService.getSegmentation).not.toHaveBeenCalled();
  });

  it('should return null when segmentationId is null', () => {
    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
      segmentationId: null,
    });

    expect(result).toBe(null);
  });

  it('should return null when segmentIndex is undefined', () => {
    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
      segmentIndex: undefined,
    });

    expect(result).toBe(null);
  });

  it('should return null when bidirectionalData is missing', () => {
    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
      bidirectionalData: null,
    });

    expect(result).toBe(null);
  });

  it('should return null when segmentation is not found', () => {
    mockSegmentationService.getSegmentation.mockReturnValue(null);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
    });

    expect(mockSegmentationService.getSegmentation).toHaveBeenCalledWith('test-id');
    expect(result).toBe(null);
  });

  it('should return null when segment is not found', () => {
    const mockSegmentation = {
      segments: {},
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
    });

    expect(result).toBe(null);
  });

  it('should return null when majorAxis is missing', () => {
    const mockSegmentation = {
      segments: {
        1: {
          segmentIndex: 1,
          label: 'Segment 1',
        },
      },
    };

    const bidirectionalDataWithoutMajorAxis = {
      majorAxis: null,
      minorAxis: { length: 15.3 },
      maxMajor: 20.5,
      maxMinor: 15.3,
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
      bidirectionalData: bidirectionalDataWithoutMajorAxis,
    });

    expect(result).toBe(null);
  });

  it('should return null when minorAxis is missing', () => {
    const mockSegmentation = {
      segments: {
        1: {
          segmentIndex: 1,
          label: 'Segment 1',
        },
      },
    };

    const bidirectionalDataWithoutMinorAxis = {
      majorAxis: { length: 20.5 },
      minorAxis: null,
      maxMajor: 20.5,
      maxMinor: 15.3,
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
      bidirectionalData: bidirectionalDataWithoutMinorAxis,
    });

    expect(result).toBe(null);
  });

  it('should return null when maxMajor is zero', () => {
    const mockSegmentation = {
      segments: {
        1: {
          segmentIndex: 1,
          label: 'Segment 1',
        },
      },
    };

    const bidirectionalDataWithZeroMajor = {
      majorAxis: { length: 20.5 },
      minorAxis: { length: 15.3 },
      maxMajor: 0,
      maxMinor: 15.3,
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
      bidirectionalData: bidirectionalDataWithZeroMajor,
    });

    expect(result).toBe(null);
  });

  it('should return null when maxMinor is zero', () => {
    const mockSegmentation = {
      segments: {
        1: {
          segmentIndex: 1,
          label: 'Segment 1',
        },
      },
    };

    const bidirectionalDataWithZeroMinor = {
      majorAxis: { length: 20.5 },
      minorAxis: { length: 15.3 },
      maxMajor: 20.5,
      maxMinor: 0,
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
      bidirectionalData: bidirectionalDataWithZeroMinor,
    });

    expect(result).toBe(null);
  });

  it('should return null when maxMajor is negative', () => {
    const mockSegmentation = {
      segments: {
        1: {
          segmentIndex: 1,
          label: 'Segment 1',
        },
      },
    };

    const bidirectionalDataWithNegativeMajor = {
      majorAxis: { length: 20.5 },
      minorAxis: { length: 15.3 },
      maxMajor: -5,
      maxMinor: 15.3,
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
      bidirectionalData: bidirectionalDataWithNegativeMajor,
    });

    expect(result).toBe(null);
  });

  it('should initialize cachedStats when segment has no cachedStats', () => {
    const mockSegmentation = {
      segments: {
        1: {
          segmentIndex: 1,
          label: 'Segment 1',
        },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
    });

    expect(result.segments[1].cachedStats).toEqual({
      namedStats: {
        bidirectional: {
          name: 'bidirectional',
          label: 'Bidirectional',
          annotationUID: 'test-annotation-uid',
          value: {
            ...mockBidirectionalData,
          },
          unit: 'mm',
        },
      },
    });
  });

  it('should initialize namedStats when segment has cachedStats but no namedStats', () => {
    const mockSegmentation = {
      segments: {
        1: {
          segmentIndex: 1,
          label: 'Segment 1',
          cachedStats: {
            existingData: 'test',
          },
        },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
    });

    expect(result.segments[1].cachedStats.existingData).toBe('test');
    expect(result.segments[1].cachedStats.namedStats).toEqual({
      bidirectional: {
        name: 'bidirectional',
        label: 'Bidirectional',
        annotationUID: 'test-annotation-uid',
        value: {
          ...mockBidirectionalData,
        },
        unit: 'mm',
      },
    });
  });

  it('should add bidirectional stats to existing namedStats', () => {
    const mockSegmentation = {
      segments: {
        1: {
          segmentIndex: 1,
          label: 'Segment 1',
          cachedStats: {
            namedStats: {
              existingStat: {
                name: 'existing',
                value: 'test',
              },
            },
          },
        },
      },
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
    });

    expect(
      (result.segments[1].cachedStats.namedStats as { existingStat: cstTypes.NamedStatistics })
        .existingStat
    ).toEqual({
      name: 'existing',
      value: 'test',
    });
    expect(
      (result.segments[1].cachedStats.namedStats as { bidirectional: cstTypes.NamedStatistics })
        .bidirectional
    ).toEqual({
      name: 'bidirectional',
      label: 'Bidirectional',
      annotationUID: 'test-annotation-uid',
      value: {
        ...mockBidirectionalData,
      },
      unit: 'mm',
    });
  });

  it('should update bidirectional stats with correct data structure', () => {
    const mockSegmentation = {
      segments: {
        1: {
          segmentIndex: 1,
          label: 'Segment 1',
          cachedStats: {
            namedStats: {},
          },
        },
      },
    };

    const customBidirectionalData = {
      majorAxis: { length: 25.7 },
      minorAxis: { length: 18.9 },
      maxMajor: 25.7,
      maxMinor: 18.9,
    };

    const customAnnotation = {
      annotationUID: 'custom-annotation-uid',
    };

    mockSegmentationService.getSegmentation.mockReturnValue(mockSegmentation);

    const result = updateSegmentBidirectionalStats({
      ...defaultParameters,
      bidirectionalData: customBidirectionalData,
      annotation: customAnnotation,
    });

    expect(
      (result.segments[1].cachedStats.namedStats as { bidirectional: cstTypes.NamedStatistics })
        .bidirectional
    ).toEqual({
      name: 'bidirectional',
      label: 'Bidirectional',
      annotationUID: 'custom-annotation-uid',
      value: {
        ...customBidirectionalData,
      },
      unit: 'mm',
    });
  });
});
