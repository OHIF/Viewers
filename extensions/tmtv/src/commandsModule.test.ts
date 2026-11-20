/**
 * Command-level cover for #5476: what a run writes, where, and that one undo memo
 * records it. The region geometry has its own tests in roiThresholdRegions.test.ts.
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
  utilities: { HistoryMemo: { DefaultHistoryMemo: { push: jest.fn() } } },
}));

jest.mock('@cornerstonejs/tools', () => ({
  Enums: { SegmentationRepresentations: { Labelmap: 'Labelmap' } },
  segmentation: { state: { getSegmentation: jest.fn() } },
  annotation: {
    selection: { getAnnotationsSelectedByToolName: jest.fn() },
    state: { getAnnotation: jest.fn() },
  },
  utilities: {
    segmentation: {
      getOrCreateSegmentationVolume: jest.fn(),
      LabelmapMemo: { createLabelmapMemo: jest.fn() },
      // Every voxel that the region offers passes the threshold.
      thresholdVolumeByRange: jest.fn(
        (_volume, _info, { segmentIndex, forEachVoxel, writeVoxelManager }) =>
          forEachVoxel(({ index }) => writeVoxelManager.setAtIndex(index, segmentIndex))
      ),
    },
  },
}));

// The regions hold labelmap indices 1, 2 and 3.
jest.mock('./utils/roiThresholdRegions', () => ({
  getROIThresholdRegions: jest.fn(() => [{}]),
  forEachVoxelInRegions: (_regions, _volume, callback) =>
    [1, 2, 3].forEach(index => callback(index, [index, 0, 0], [index, 0, 0])),
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
import { getROIThresholdRegions } from './utils/roiThresholdRegions';

const mockGetAnnotationsSelected = csTools.annotation.selection
  .getAnnotationsSelectedByToolName as unknown as jest.Mock;
const mockHistoryPush = cs.utilities.HistoryMemo.DefaultHistoryMemo.push as jest.Mock;

/**
 * Segment 1 at indices 0, 1 and 4, segment 2 at index 3. The labelmap has no
 * `setAtIndex`: every write must go through the memo, or undo misses it.
 */
function setup() {
  const data = [1, 1, 0, 2, 1];
  const labelmap = {
    modified: jest.fn(),
    voxelManager: {
      getScalarDataLength: () => data.length,
      getAtIndex: (i: number) => data[i],
    },
  };
  const memo = {
    voxelManager: { setAtIndex: (i: number, v: number) => (data[i] = v) },
    commitMemo: () => true,
  };

  (csTools.utilities.segmentation.LabelmapMemo.createLabelmapMemo as jest.Mock).mockReturnValue(
    memo
  );
  (csTools.utilities.segmentation.getOrCreateSegmentationVolume as jest.Mock).mockReturnValue(
    labelmap
  );
  (cs.cache.getVolumeContainingImageId as jest.Mock).mockReturnValue({ volume: { id: 'v' } });
  mockGetAnnotationsSelected.mockImplementation(toolName =>
    toolName === 'RectangleROIStartEndThreshold' ? ['annotation-1'] : []
  );

  const displaySet = { displaySetInstanceUID: 'ds', imageIds: ['image-1'] };
  const uiNotificationService = { show: jest.fn() };
  const servicesManager = {
    services: {
      viewportGridService: { getState: () => ({ activeViewportId: 'v1' }) },
      uiNotificationService,
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

  const run = () =>
    actions.thresholdSegmentationByRectangleROITool({
      segmentationId: 'seg',
      config: {},
      segmentIndex: 1,
    });

  return { run, data, uiNotificationService };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('thresholdSegmentationByRectangleROITool', () => {
  it('replaces the target segment with the result, and keeps other segments', () => {
    const { run, data } = setup();

    run();

    // Segment 1 outside the region (0, 4) is cleared, the region voxels 1 and 2 hold
    // the result, and segment 2 at index 3 stays, although it is in the region.
    expect(data).toEqual([0, 1, 1, 2, 0]);
  });

  it('records the clear and the result as one undo step', () => {
    const { run } = setup();

    run();

    expect(mockHistoryPush).toHaveBeenCalledTimes(1);
  });

  it('reports an unsupported annotation and changes nothing', () => {
    const { run, data, uiNotificationService } = setup();
    (getROIThresholdRegions as jest.Mock).mockImplementationOnce(() => {
      throw new Error('ROI threshold does not support Length annotations');
    });

    run();

    expect(uiNotificationService.show).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'ROI threshold does not support Length annotations',
        type: 'error',
      })
    );
    expect(data).toEqual([1, 1, 0, 2, 1]);
    expect(mockHistoryPush).not.toHaveBeenCalled();
  });

  it('reports and returns early when no ROI annotation is selected', () => {
    const { run, data } = setup();
    mockGetAnnotationsSelected.mockReturnValue([]);

    run();

    expect(data).toEqual([1, 1, 0, 2, 1]);
  });
});
