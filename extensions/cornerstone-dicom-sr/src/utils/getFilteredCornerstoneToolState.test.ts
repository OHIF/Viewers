import { annotation } from '@cornerstonejs/tools';
import getFilteredCornerstoneToolState from './getFilteredCornerstoneToolState';

const imageId = 'wadors:/studies/1/series/2/instances/3/frames/1';

describe('getFilteredCornerstoneToolState', () => {
  afterEach(() => jest.restoreAllMocks());

  it('exports the SR sub-types under the tool type of their SR adapter', () => {
    const point = { annotationUID: 'p', metadata: { referencedImageId: imageId } };
    const rect = { annotationUID: 'r', metadata: { referencedImageId: imageId } };
    jest.spyOn(annotation.state, 'getAnnotationManager').mockReturnValue({
      getFramesOfReference: () => ['for'],
      getAnnotations: () => ({ SRPoint: [point], SRRectangleROI: [rect] }),
    } as never);

    const state = getFilteredCornerstoneToolState([{ uid: 'p' }, { uid: 'r' }], []);

    expect(Object.keys(state[imageId]).sort()).toEqual(['Probe', 'RectangleROI']);
  });
});
