import { hasOperandSegments } from './logicalContourOperation';

describe('hasOperandSegments', () => {
  it('requires both segments to be selected', () => {
    expect(hasOperandSegments('1', '2')).toBe(true);
    expect(hasOperandSegments('1', '')).toBe(false);
    expect(hasOperandSegments('', '2')).toBe(false);
    expect(hasOperandSegments(null, '2')).toBe(false);
    expect(hasOperandSegments('0', '2')).toBe(false);
  });
});
