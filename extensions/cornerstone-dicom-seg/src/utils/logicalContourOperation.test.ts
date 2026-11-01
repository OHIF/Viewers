import { hasOperandSegments } from './logicalContourOperation';

describe('hasOperandSegments', () => {
  const segmentIndices = [1, 2];

  it('requires both segments to be selected', () => {
    expect(hasOperandSegments('1', '2', segmentIndices)).toBe(true);
    expect(hasOperandSegments('1', '', segmentIndices)).toBe(false);
    expect(hasOperandSegments('', '2', segmentIndices)).toBe(false);
    expect(hasOperandSegments(null, '2', segmentIndices)).toBe(false);
    expect(hasOperandSegments('0', '2', segmentIndices)).toBe(false);
  });

  it('rejects a selected segment that is no longer in the segmentation', () => {
    expect(hasOperandSegments('1', '3', segmentIndices)).toBe(false);
  });
});
