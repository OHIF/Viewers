/**
 * Command-level cover for #5476.
 *
 * The helper tests alone would still pass if this command cleared the wrong volume or
 * kept sending `overwrite: true`, so assert the wiring: which segment gets cleared,
 * what reaches cornerstone, and that a throw does not leave the segment erased.
 */

jest.mock('@ohif/core', () => ({
  __esModule: true,
  default: {},
  classes: { MetadataProvider: { get: jest.fn() } },
  utils: { formatPN: (v: string) => v },
}));

jest.mock('@ohif/i18n', () => ({ __esModule: true, default: { t: (k: string) => k } }));

jest.mock('@ohif/extension-cornerstone', () => ({
  getViewportFocalPoint: jest.fn(),
}));

jest.mock('@cornerstonejs/core', () => ({
  cache: {
    getVolume: jest.fn(),
    getVolumeContainingImageId: jest.fn(),
  },
  getEnabledElement: jest.fn(),
}));

jest.mock('@cornerstonejs/tools', () => ({
  Enums: { SegmentationRepresentations: { Labelmap: 'Labelmap' } },
  segmentation: { state: { getSegmentation: jest.fn() } },
  annotation: { selection: { getAnnotationsSelectedByToolName: jest.fn() } },
  utilities: { segmentation: { rectangleROIThresholdVolumeByRange: jest.fn() } },
}));

jest.mock('./utils/getThresholdValue', () => ({
  __esModule: true,
  default: () => ({ ptLower: 1, ptUpper: 2, ctLower: 3, ctUpper: 4 }),
}));

jest.mock('./utils/createAndDownloadTMTVReport', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('./utils/dicomRTAnnotationExport/RTStructureSet', () => ({
  __esModule: true,
  default: jest.fn(),
}));

import * as cs from '@cornerstonejs/core';
import * as csTools from '@cornerstonejs/tools';
import commandsModule from './commandsModule';

// jest.mock is hoisted above const declarations, so reach the mocks through the
// mocked module rather than closing over variables that are not initialised yet.
const mockRectangleROIThreshold = csTools.utilities.segmentation
  .rectangleROIThresholdVolumeByRange as unknown as jest.Mock;
const mockGetAnnotationsSelected = csTools.annotation.selection
  .getAnnotationsSelectedByToolName as unknown as jest.Mock;

const SEG_VOLUME_ID = 'seg-volume';

/** Labelmap holding segment 1 at indices 0-1 and segment 2 at index 3. */
const makeLabelmap = () => {
  const data = [1, 1, 0, 2];
  return {
    data,
    voxelManager: {
      getScalarDataLength: () => data.length,
      getAtIndex: (i: number) => data[i],
      setAtIndex: (i: number, v: number) => {
        data[i] = v;
      },
    },
  };
};

function setup() {
  const labelmap = makeLabelmap();

  (csTools.segmentation.state.getSegmentation as jest.Mock).mockReturnValue({
    representationData: { Labelmap: { volumeId: SEG_VOLUME_ID } },
  });
  (cs.cache.getVolume as jest.Mock).mockReturnValue(labelmap);
  (cs.cache.getVolumeContainingImageId as jest.Mock).mockReturnValue({ volume: { id: 'v' } });
  mockGetAnnotationsSelected.mockImplementation(toolName =>
    toolName === 'RectangleROIThreshold' ? ['annotation-1'] : []
  );

  const displaySet = { displaySetInstanceUID: 'ds', imageIds: ['image-1'] };
  const servicesManager = {
    services: {
      viewportGridService: { getState: () => ({ activeViewportId: 'v1' }) },
      uiNotificationService: { show: jest.fn(), error: jest.fn() },
      displaySetService: { getDisplaySetByUID: () => displaySet },
      hangingProtocolService: {
        getMatchDetails: () => ({
          displaySetMatchDetails: new Map([
            ['ctDisplaySet', { displaySetInstanceUID: 'ds' }],
            ['ptDisplaySet', { displaySetInstanceUID: 'ds' }],
          ]),
        }),
      },
      toolGroupService: {},
      cornerstoneViewportService: {},
      segmentationService: {},
    },
  };
  const extensionManager = {
    getModuleEntry: () => ({ exports: { getEnabledElement: jest.fn() } }),
    getDataSources: () => [{ getImageIdsForDisplaySet: () => ['image-1'] }],
  };

  const { actions } = commandsModule({
    servicesManager,
    commandsManager: { run: jest.fn() },
    extensionManager,
  } as never) as never as { actions: Record<string, (args) => unknown> };

  return { actions, labelmap };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockRectangleROIThreshold.mockReturnValue({ modified: jest.fn() });
});

describe('thresholdSegmentationByRectangleROITool', () => {
  it('clears only the target segment, leaving other segments in the labelmap', () => {
    const { actions, labelmap } = setup();

    actions.thresholdSegmentationByRectangleROITool({
      segmentationId: 'seg',
      config: {},
      segmentIndex: 1,
    });

    // segment 1 cleared, segment 2 at index 3 untouched
    expect(labelmap.data).toEqual([0, 0, 0, 2]);
  });

  it('never asks cornerstone to overwrite the whole labelmap', () => {
    const { actions } = setup();

    actions.thresholdSegmentationByRectangleROITool({
      segmentationId: 'seg',
      config: {},
      segmentIndex: 2,
    });

    expect(mockRectangleROIThreshold).toHaveBeenCalledTimes(1);
    const options = mockRectangleROIThreshold.mock.calls[0][3];
    expect(options).toMatchObject({
      overwrite: false,
      segmentIndex: 2,
      segmentationId: 'seg',
    });
  });

  it('defaults to segment 1 when no segmentIndex is supplied', () => {
    const { actions, labelmap } = setup();

    actions.thresholdSegmentationByRectangleROITool({ segmentationId: 'seg', config: {} });

    expect(mockRectangleROIThreshold.mock.calls[0][3].segmentIndex).toBe(1);
    expect(labelmap.data).toEqual([0, 0, 0, 2]);
  });

  it('clears segment 1 when given segment 0, matching where cornerstone writes', () => {
    const { actions, labelmap } = setup();

    actions.thresholdSegmentationByRectangleROITool({
      segmentationId: 'seg',
      config: {},
      segmentIndex: 0,
    });

    // cornerstone resolves `0 || 1` to 1, so segment 1 is the one that must be cleared
    expect(mockRectangleROIThreshold.mock.calls[0][3].segmentIndex).toBe(1);
    expect(labelmap.data).toEqual([0, 0, 0, 2]);
  });

  it('restores the segment when the threshold computation throws', () => {
    const { actions, labelmap } = setup();
    mockRectangleROIThreshold.mockImplementation(() => {
      throw new Error('only supports RectangleROIThreshold annotations');
    });

    expect(() =>
      actions.thresholdSegmentationByRectangleROITool({
        segmentationId: 'seg',
        config: {},
        segmentIndex: 1,
      })
    ).toThrow('only supports RectangleROIThreshold');

    // the user's segment survives a failed run
    expect(labelmap.data).toEqual([1, 1, 0, 2]);
  });

  it('reports and returns early when no ROI annotation is selected', () => {
    mockGetAnnotationsSelected.mockReturnValue([]);
    const { actions, labelmap } = setup();
    mockGetAnnotationsSelected.mockReturnValue([]);

    actions.thresholdSegmentationByRectangleROITool({
      segmentationId: 'seg',
      config: {},
      segmentIndex: 1,
    });

    expect(mockRectangleROIThreshold).not.toHaveBeenCalled();
    // nothing cleared, because nothing was computed
    expect(labelmap.data).toEqual([1, 1, 0, 2]);
  });
});
