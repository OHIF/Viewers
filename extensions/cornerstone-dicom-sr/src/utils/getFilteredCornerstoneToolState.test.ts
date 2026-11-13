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

  it('does not write a label taken from the coded finding as a free-text finding site', () => {
    const lesion = { CodeValue: '52988006', CodingSchemeDesignator: 'SCT', CodeMeaning: 'Lesion' };
    const length = { annotationUID: 'l', metadata: { referencedImageId: imageId } };
    jest.spyOn(annotation.state, 'getAnnotationManager').mockReturnValue({
      getFramesOfReference: () => ['for'],
      getAnnotations: () => ({ Length: [length] }),
    } as never);

    const state = getFilteredCornerstoneToolState(
      [{ uid: 'l', label: 'Lesion', finding: lesion }],
      []
    );

    const [exported] = state[imageId].Length.data;
    expect(exported.finding).toBe(lesion);
    expect(exported.findingSites).toEqual([]);
  });

  it('writes a label that differs from the finding as a free-text finding site', () => {
    const lesion = { CodeValue: '52988006', CodingSchemeDesignator: 'SCT', CodeMeaning: 'Lesion' };
    const length = { annotationUID: 'l', metadata: { referencedImageId: imageId } };
    jest.spyOn(annotation.state, 'getAnnotationManager').mockReturnValue({
      getFramesOfReference: () => ['for'],
      getAnnotations: () => ({ Length: [length] }),
    } as never);

    const state = getFilteredCornerstoneToolState(
      [{ uid: 'l', label: 'Target A', finding: lesion }],
      []
    );

    expect(state[imageId].Length.data[0].findingSites).toEqual([
      expect.objectContaining({ CodeValue: 'CORNERSTONEFREETEXT', CodeMeaning: 'Target A' }),
    ]);
  });

  it('drops an older free-text finding site when the label is the coded finding', () => {
    const lesion = { CodeValue: '52988006', CodingSchemeDesignator: 'SCT', CodeMeaning: 'Lesion' };
    const lung = { CodeValue: '39607008', CodingSchemeDesignator: 'SCT', CodeMeaning: 'Lung' };
    const oldText = {
      CodeValue: 'CORNERSTONEFREETEXT',
      CodingSchemeDesignator: 'CST4',
      CodeMeaning: 'Target A',
    };
    const length = { annotationUID: 'l', metadata: { referencedImageId: imageId } };
    jest.spyOn(annotation.state, 'getAnnotationManager').mockReturnValue({
      getFramesOfReference: () => ['for'],
      getAnnotations: () => ({ Length: [length] }),
    } as never);

    const state = getFilteredCornerstoneToolState(
      [{ uid: 'l', label: 'Lesion', finding: lesion, findingSites: [oldText, lung] }],
      []
    );

    expect(state[imageId].Length.data[0].findingSites).toEqual([lung]);
  });
});
