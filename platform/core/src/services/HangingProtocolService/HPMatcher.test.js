import { HPMatcher } from './HPMatcher';

const passes = (metadataInstance, constraint) =>
  HPMatcher.match(metadataInstance, [{ attribute: 'n', constraint }], {}, {}).details.passed
    .length === 1;

describe('HPMatcher', () => {
  it('runs a validator whose operand is falsy', () => {
    expect(passes({ n: 0 }, { greaterThan: 0 })).toBe(false);
    expect(passes({ n: 1 }, { greaterThan: 0 })).toBe(true);
    expect(passes({ n: 1 }, { equals: 0 })).toBe(false);
    expect(passes({ n: true }, { equals: false })).toBe(false);
  });

  it('gives notNull: false the meaning "has no value"', () => {
    expect(passes({ n: null }, { notNull: false })).toBe(true);
    expect(passes({ n: 1 }, { notNull: false })).toBe(false);
    expect(passes({ n: null }, { notNull: true })).toBe(false);
  });
});
