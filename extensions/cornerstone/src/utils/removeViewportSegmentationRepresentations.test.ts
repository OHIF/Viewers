import { segmentation } from '@cornerstonejs/tools';
import removeViewportSegmentationRepresentations from './removeViewportSegmentationRepresentations';

jest.mock('@cornerstonejs/tools', () => ({
  segmentation: {
    state: {
      getSegmentationRepresentations: jest.fn(),
      removeSegmentationRepresentation: jest.fn(),
    },
  },
}));

describe('removeViewportSegmentationRepresentations', () => {
  const viewportId = 'viewport-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return early when no representations are found', () => {
    (segmentation.state.getSegmentationRepresentations as jest.Mock).mockReturnValue(null);

    removeViewportSegmentationRepresentations(viewportId);

    expect(segmentation.state.getSegmentationRepresentations).toHaveBeenCalledWith(viewportId);
    expect(segmentation.state.removeSegmentationRepresentation).not.toHaveBeenCalled();
  });

  it('should return early when representations array is empty', () => {
    (segmentation.state.getSegmentationRepresentations as jest.Mock).mockReturnValue([]);

    removeViewportSegmentationRepresentations(viewportId);

    expect(segmentation.state.removeSegmentationRepresentation).not.toHaveBeenCalled();
  });

  it('should remove single segmentation representation', () => {
    const representations = [
      {
        segmentationRepresentationUID: 'representation-1',
      },
    ];

    (segmentation.state.getSegmentationRepresentations as jest.Mock).mockReturnValue(
      representations
    );

    removeViewportSegmentationRepresentations(viewportId);

    expect(segmentation.state.removeSegmentationRepresentation).toHaveBeenCalledTimes(1);
    expect(segmentation.state.removeSegmentationRepresentation).toHaveBeenCalledWith(
      'representation-1'
    );
  });

  it('should remove multiple segmentation representations', () => {
    const representations = [
      {
        segmentationRepresentationUID: 'representation-1',
      },
      {
        segmentationRepresentationUID: 'representation-2',
      },
      {
        segmentationRepresentationUID: 'representation-3',
      },
    ];

    (segmentation.state.getSegmentationRepresentations as jest.Mock).mockReturnValue(
      representations
    );

    removeViewportSegmentationRepresentations(viewportId);

    expect(segmentation.state.removeSegmentationRepresentation).toHaveBeenCalledTimes(3);
    expect(segmentation.state.removeSegmentationRepresentation).toHaveBeenNthCalledWith(
      1,
      'representation-1'
    );
    expect(segmentation.state.removeSegmentationRepresentation).toHaveBeenNthCalledWith(
      2,
      'representation-2'
    );
    expect(segmentation.state.removeSegmentationRepresentation).toHaveBeenNthCalledWith(
      3,
      'representation-3'
    );
  });

  it('should handle representations with additional properties', () => {
    const representations = [
      {
        segmentationRepresentationUID: 'representation-1',
        type: 'LABELMAP',
        active: true,
      },
      {
        segmentationRepresentationUID: 'representation-2',
        type: 'CONTOUR',
        active: false,
        visible: true,
      },
    ];

    (segmentation.state.getSegmentationRepresentations as jest.Mock).mockReturnValue(
      representations
    );

    removeViewportSegmentationRepresentations(viewportId);

    expect(segmentation.state.removeSegmentationRepresentation).toHaveBeenCalledTimes(2);
    expect(segmentation.state.removeSegmentationRepresentation).toHaveBeenNthCalledWith(
      1,
      'representation-1'
    );
    expect(segmentation.state.removeSegmentationRepresentation).toHaveBeenNthCalledWith(
      2,
      'representation-2'
    );
  });

  it('should handle undefined representations', () => {
    (segmentation.state.getSegmentationRepresentations as jest.Mock).mockReturnValue(undefined);

    removeViewportSegmentationRepresentations(viewportId);

    expect(segmentation.state.removeSegmentationRepresentation).not.toHaveBeenCalled();
  });
});
