const mockCalculateCachedStats = jest.fn();
const mockDrawPath = jest.fn();

jest.mock('@cornerstonejs/tools', () => ({
  ProbeTool: class {
    configuration = {};
    toolGroupId = 'group';
    getToolName() {
      return 'SRPoint';
    }
    filterInteractableAnnotationsForElement(_element, annotations) {
      return annotations;
    }
    getTargetId() {
      return 'imageId:1';
    }
    getAnnotationStyle() {
      return { color: 'red', lineWidth: 1, lineDash: '4,4' };
    }
    getLinkedTextBoxStyle() {
      return { visibility: false };
    }
    _calculateCachedStats(annotation) {
      mockCalculateCachedStats(JSON.parse(JSON.stringify(annotation.data.cachedStats)));
    }
  },
  drawing: { drawTextBox: jest.fn(), drawPath: (...args) => mockDrawPath(...args) },
  annotation: {
    state: { getAnnotations: () => mockAnnotations },
    visibility: { isAnnotationVisible: () => true },
  },
}));
jest.mock('../utils/srToolGetTextLines', () => ({ getSRPointTextLines: () => [] }));

let mockAnnotations = [];

import SRPointTool from './SRPointTool';

describe('SRPointTool', () => {
  const enabledElement = {
    renderingEngine: {},
    viewport: { element: {}, id: 'vp', worldToCanvas: () => [5, 5] },
  };

  const render = () =>
    new SRPointTool({}, { configuration: {} }).renderAnnotation(
      enabledElement as never,
      {} as never
    );

  beforeEach(() => {
    mockCalculateCachedStats.mockReset();
    mockDrawPath.mockReset();
  });

  it('calculates the statistics of a new point for the current target', () => {
    mockAnnotations = [{ annotationUID: 'a', data: { handles: { points: [[0, 0, 0]] } } }];
    render();

    expect(mockCalculateCachedStats).toHaveBeenCalledWith({
      'imageId:1': { Modality: null, index: null, value: null },
    });
  });

  it('updates the statistics of a moved point', () => {
    mockAnnotations = [
      {
        annotationUID: 'a',
        invalidated: true,
        data: { handles: { points: [[0, 0, 0]] }, cachedStats: { 'imageId:1': { value: 1 } } },
      },
    ];
    render();

    expect(mockCalculateCachedStats).toHaveBeenCalledTimes(1);
  });

  it('does not recalculate an unchanged point', () => {
    mockAnnotations = [
      {
        annotationUID: 'a',
        data: { handles: { points: [[0, 0, 0]] }, cachedStats: { 'imageId:1': { value: 1 } } },
      },
    ];
    render();

    expect(mockCalculateCachedStats).not.toHaveBeenCalled();
  });

  it('calculates again while the image of the target is not available', () => {
    mockAnnotations = [
      {
        annotationUID: 'a',
        data: { handles: { points: [[0, 0, 0]] }, cachedStats: { 'imageId:1': { value: null } } },
      },
    ];
    render();

    expect(mockCalculateCachedStats).toHaveBeenCalledWith({ 'imageId:1': { value: null } });
  });

  it('draws a dashed cross centred on the point', () => {
    mockAnnotations = [{ annotationUID: 'a', data: { handles: { points: [[0, 0, 0]] } } }];
    render();

    expect(mockDrawPath).toHaveBeenCalledWith(
      {},
      'a',
      'cross',
      [
        [
          [5, -1],
          [5, 11],
        ],
        [
          [-1, 5],
          [11, 5],
        ],
      ],
      { color: 'red', lineWidth: 1, lineDash: '4,4' }
    );
  });
});
