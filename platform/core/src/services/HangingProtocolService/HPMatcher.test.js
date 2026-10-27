import { HPMatcher } from './HPMatcher';
import validate from './lib/validator';

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

  it('skips a validator whose operand is null or undefined', () => {
    expect(passes({ n: 5 }, { equals: null })).toBe(true);
    expect(passes({ n: 5 }, { equals: undefined })).toBe(true);
  });

  it('reads a null attribute as missing, so equals: { value: null } does not hold', () => {
    expect(passes({ n: null }, { equals: { value: null } })).toBe(false);
    expect(passes({}, { equals: { value: null } })).toBe(false);
    expect(passes({ n: null }, { notNull: false })).toBe(true);
  });

  it('runs a string validator whose operand is an empty string', () => {
    expect(passes({ n: 'abc' }, { doesNotContain: '' })).toBe(false);
  });

  it('keeps a built-in or an application validator off when its option is false', () => {
    expect(passes({}, { presence: false })).toBe(true);
    validate.validators.alwaysFails = () => 'fails';
    try {
      expect(passes({ n: 1 }, { alwaysFails: false })).toBe(true);
      expect(passes({ n: 1 }, { alwaysFails: true })).toBe(false);
    } finally {
      delete validate.validators.alwaysFails;
    }
  });

  it('runs an { attribute } operand that resolves to 0', () => {
    expect(passes({ n: 0, m: 0 }, { equals: { attribute: 'm' } })).toBe(true);
    expect(passes({ n: 1, m: 0 }, { equals: { attribute: 'm' } })).toBe(false);
  });

  it('matches a display set with 0 image frames with greaterThanOrEqual: { value: 0 }', () => {
    expect(passes({ n: 0 }, { greaterThanOrEqual: { value: 0 } })).toBe(true);
    expect(passes({ n: 0 }, { greaterThan: { value: 0 } })).toBe(false);
  });
});
