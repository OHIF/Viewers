import { groupInstancesBySplitRules } from '@cornerstonejs/metadata';
import { compileSplitRules } from './compileSplitRules';

const makeInstance = (overrides: Record<string, unknown> = {}) => ({
  SOPInstanceUID: 'sop-1',
  SeriesInstanceUID: 'series-1',
  Modality: 'CT',
  Rows: 256,
  ...overrides,
});

describe('compileSplitRules', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('compiles raw selector data with the metadata compiler', () => {
    const rules = compileSplitRules({
      ctOnly: {
        priority: 1,
        matches: { expression: "Modality === 'CT' && Rows > 100" },
        customAttributes: {
          set: { label: 'CT' },
          fromFirstInstance: { SeriesDescription: { expression: '`CT ${SeriesDescription}`' } },
        },
      },
    });
    expect(rules.ctOnly.priority).toBe(1);
    expect(rules.ctOnly.matches(makeInstance(), { series: {} })).toBe(true);
    expect(rules.ctOnly.matches(makeInstance({ Modality: 'MR' }), { series: {} })).toBe(false);
    expect(
      rules.ctOnly.customAttributes({} as never, {
        instances: [makeInstance({ SeriesDescription: 'CHEST' })],
      })
    ).toEqual({ label: 'CT', SeriesDescription: 'CT CHEST' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('resolves named classifiers from the options', () => {
    const rules = compileSplitRules(
      { stack: { priority: 1, matches: { classifier: 'stackImage' } } },
      { classifiers: { stackImage: instance => instance.Modality === 'US' } }
    );
    expect(rules.stack.matches(makeInstance({ Modality: 'US' }), { series: {} })).toBe(true);
    expect(rules.stack.matches(makeInstance(), { series: {} })).toBe(false);
  });

  it('passes a rule that code has already compiled through unchanged', () => {
    const matches = instance => instance.Modality === 'CT';
    const rules = compileSplitRules({
      native: { priority: 1, matches, groupBy: ['SeriesInstanceUID'] },
    });
    expect(rules.native.matches).toBe(matches);
  });

  it('keeps the keys and the priorities, including null', () => {
    const rules = compileSplitRules({
      volume3d: { priority: 4 },
      ctScout: { priority: -1, matches: { attribute: 'Modality', equals: 'CT' } },
      off: { priority: null },
    });
    expect(Object.fromEntries(Object.entries(rules).map(([id, r]) => [id, r.priority]))).toEqual({
      volume3d: 4,
      ctScout: -1,
      off: null,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  describe('a rule the compiler rejects is dropped, and the others stay in charge', () => {
    it.each([
      ['an unknown classifier', { priority: 1, matches: { classifier: 'nope' } }],
      ['an invalid expression', { priority: 1, matches: { expression: "Modality === 'CT" } }],
      ['a missing priority', { matches: { attribute: 'Modality', equals: 'CT' } }],
      ['a text priority', { priority: 'high', matches: { attribute: 'Modality', equals: 'CT' } }],
      ['an id that differs from the key', { id: 'other', priority: 1 }],
    ])('%s', (_label, entry) => {
      const rules = compileSplitRules({
        broken: entry as never,
        good: { priority: 2, matches: { attribute: 'Modality', equals: 'MR' } },
      });
      expect(Object.keys(rules)).toEqual(['good']);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("dropping split rule 'broken'"));

      // The broken rule claims nothing, so the CT instance is unmatched.
      const unmatched = [];
      const groups = groupInstancesBySplitRules([makeInstance()] as never, rules, instance =>
        unmatched.push(instance)
      );
      expect(groups).toHaveLength(0);
      expect(unmatched).toHaveLength(1);
    });

    it('also for a compiled rule with no usable priority', () => {
      const rules = compileSplitRules({ native: { matches: () => true } as never });
      expect(rules).toEqual({});
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("dropping split rule 'native'"));
    });
  });

  it('returns an empty rule set, with a warning, for input that is not a keyed rule set', () => {
    expect(compileSplitRules(undefined as never)).toEqual({});
    expect(compileSplitRules([{ id: 'a' }] as never)).toEqual({});
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('must be an object keyed by rule id'),
      undefined
    );
  });
});
