import { SegmentationRepresentations } from '@cornerstonejs/tools/enums';
import { createSegmentationForViewport } from './createSegmentationForViewport';
import { promptTimePointScope } from './promptTimePointScope';

jest.mock('./promptTimePointScope', () => ({
  promptTimePointScope: jest.fn(),
}));

function createServicesManager(isDynamicVolume: boolean) {
  const segmentationService = {
    getSegmentations: jest.fn(() => []),
    createLabelmapForDisplaySet: jest.fn(async (_ds, { segmentationId }) => segmentationId),
    createContourForDisplaySet: jest.fn(async (_ds, { segmentationId }) => segmentationId),
    addSegmentationRepresentation: jest.fn(),
  };
  const servicesManager = {
    services: {
      viewportGridService: {
        getState: () => ({
          viewports: new Map([['vp', { displaySetInstanceUIDs: ['ds'] }]]),
        }),
      },
      displaySetService: {
        getDisplaySetByUID: () => ({ displaySetInstanceUID: 'ds', isDynamicVolume }),
      },
      segmentationService,
      uiDialogService: {},
      cornerstoneViewportService: { getCornerstoneViewport: () => undefined },
    },
  };
  return { servicesManager: servicesManager as never, segmentationService };
}

describe('createSegmentationForViewport on a 4D display set', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates no segmentation when the user cancels the dialog', async () => {
    (promptTimePointScope as jest.Mock).mockResolvedValue(undefined);
    const { servicesManager, segmentationService } = createServicesManager(true);

    const result = await createSegmentationForViewport(servicesManager, {
      viewportId: 'vp',
      segmentationType: SegmentationRepresentations.Labelmap,
    });

    expect(result).toBeUndefined();
    expect(segmentationService.createLabelmapForDisplaySet).not.toHaveBeenCalled();
  });

  it('skips the dialog when the caller gives timePointScope', async () => {
    const { servicesManager, segmentationService } = createServicesManager(true);

    await createSegmentationForViewport(servicesManager, {
      viewportId: 'vp',
      options: { timePointScope: 'each', segmentationId: 'seg' },
      segmentationType: SegmentationRepresentations.Labelmap,
    });

    expect(promptTimePointScope).not.toHaveBeenCalled();
    expect(segmentationService.createLabelmapForDisplaySet).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ timePointScope: 'each' })
    );
  });

  it('shows no dialog for a contour', async () => {
    const { servicesManager, segmentationService } = createServicesManager(true);

    await createSegmentationForViewport(servicesManager, {
      viewportId: 'vp',
      options: { segmentationId: 'seg' },
      segmentationType: SegmentationRepresentations.Contour,
    });

    expect(promptTimePointScope).not.toHaveBeenCalled();
    expect(segmentationService.createContourForDisplaySet).toHaveBeenCalled();
  });
});
