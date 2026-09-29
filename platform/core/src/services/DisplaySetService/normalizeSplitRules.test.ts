import { compileExpression, groupInstancesBySplitRules } from '@cornerstonejs/metadata';
import type { SplitRuleSet, SplitRuleSetEntry } from '@cornerstonejs/metadata';
import { normalizeSplitRules } from './normalizeSplitRules';

const makeInstance = (overrides: Record<string, unknown> = {}) => ({
  SOPInstanceUID: 'sop-1',
  SeriesInstanceUID: 'series-1',
  Modality: 'CT',
  Rows: 256,
  ...overrides,
});

/** Normalizes a one-rule set and returns that rule, or undefined when dropped. */
const normalizeOne = (entry: Record<string, unknown>, id = 'rule') =>
  normalizeSplitRules({ [id]: { priority: 1, ...entry } as SplitRuleSetEntry })[id];

describe('normalizeSplitRules', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('passes engine-native rules through unchanged', () => {
    const rule: SplitRuleSetEntry = {
      priority: 1,
      matches: instance => instance.Modality === 'CT',
      groupBy: ['SeriesInstanceUID'],
    };
    expect(normalizeSplitRules({ native: rule })).toEqual({ native: rule });
  });

  it('compiles a string matches expression', () => {
    const rule = normalizeOne({ matches: "Modality === 'CT'" });
    expect(typeof rule.matches).toBe('function');
    expect(rule.matches(makeInstance(), {} as never)).toBe(true);
    expect(rule.matches(makeInstance({ Modality: 'MR' }), {} as never)).toBe(false);
  });

  describe('rules the engine would misinterpret are dropped', () => {
    // groupInstancesBySplitRules treats a rule with no `matches` as matching
    // every instance, so a $function that failed to compile must not survive.
    it('drops a rule whose authored matches did not compile', () => {
      expect(normalizeOne({ matches: undefined, groupBy: ['SeriesInstanceUID'] }, 'broken')).toBe(
        undefined
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("dropping split rule 'broken'"),
        undefined
      );
    });

    it('drops a rule whose matches is still an unresolved marker', () => {
      expect(normalizeOne({ matches: { $function: "Modality === 'CT'" } })).toBeUndefined();
    });

    it('drops a rule with an invalid groupBy entry', () => {
      expect(normalizeOne({ matches: () => true, groupBy: [undefined] }, 'badGroup')).toBe(
        undefined
      );
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("dropping split rule 'badGroup'"), [
        undefined,
      ]);
    });

    it('keeps a rule that legitimately omits matches (catch-all)', () => {
      expect(normalizeOne({})).toEqual({ priority: 1 });
      expect(warn).not.toHaveBeenCalled();
    });

    it('leaves the surviving rules in charge rather than claiming everything', () => {
      const rules = normalizeSplitRules({
        broken: { priority: 1, matches: undefined },
        good: {
          priority: 2,
          matches: instance => instance.Modality === 'MR',
          groupBy: ['SeriesInstanceUID'],
        },
      });
      const unmatched = [];
      const groups = groupInstancesBySplitRules(
        [makeInstance({ Modality: 'CT' })] as never,
        rules,
        instance => unmatched.push(instance)
      );
      // Without the drop, 'broken' would have claimed the CT instance.
      expect(groups).toHaveLength(0);
      expect(unmatched).toHaveLength(1);
    });
  });

  it('warns about an undefined series fact (the rule can never match)', () => {
    normalizeOne({ series: { frameCount: undefined }, matches: () => true }, 'badFact');
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("split rule 'badFact' has an undefined series fact 'frameCount'")
    );
  });

  it('wraps an object-form series map into the engine callback', () => {
    const rule = normalizeOne({
      series: {
        frameCount: compileExpression('sumOf(instances, defined(Rows) ? 1 : 0)'),
        literal: 7,
      },
      matches: () => true,
    });
    expect(rule.series({ instances: [makeInstance(), makeInstance()] })).toEqual({
      frameCount: 2,
      literal: 7,
    });
  });

  it('wraps an object-form customAttributes map into the engine callback', () => {
    const rule = normalizeOne({
      matches: () => true,
      customAttributes: {
        label: 'SCOUT',
        SeriesDescription: compileExpression('`SCOUT ${SeriesDescription}`'),
      },
    });
    const instances = [makeInstance({ SeriesDescription: 'CHEST' })];
    expect(
      rule.customAttributes({ instance: instances[0] }, { instances, splitNumber: 0 })
    ).toEqual({ label: 'SCOUT', SeriesDescription: 'SCOUT CHEST' });
  });

  it('returns an empty rule set, with a warning, for input that is not a keyed rule set', () => {
    expect(normalizeSplitRules(undefined as unknown as SplitRuleSet)).toEqual({});
    expect(normalizeSplitRules([{ id: 'a' }] as unknown as SplitRuleSet)).toEqual({});
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining('must be an object keyed by rule id'),
      undefined
    );
  });

  describe('priorities and ids', () => {
    it('keeps the keys and the priorities, including null', () => {
      const rules = normalizeSplitRules({
        volume3d: { priority: 4 },
        ctScout: { priority: -1, matches: () => true },
        off: { priority: null },
      });
      expect(Object.fromEntries(Object.entries(rules).map(([id, r]) => [id, r.priority]))).toEqual({
        volume3d: 4,
        ctScout: -1,
        off: null,
      });
      expect(warn).not.toHaveBeenCalled();
    });

    it('drops, rather than throws on, a rule with no usable priority', () => {
      // The engine throws on this. One bad customization layer must not stop
      // display set creation for every series.
      const rules = normalizeSplitRules({
        noPriority: { matches: () => true } as never,
        textPriority: { priority: 'high' } as never,
        good: { priority: 1 },
      });
      expect(Object.keys(rules)).toEqual(['good']);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("dropping split rule 'noPriority'"),
        undefined
      );
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("dropping split rule 'textPriority'"),
        'high'
      );
    });

    it('uses the key when an entry states a different id', () => {
      const rules = normalizeSplitRules({ copied: { id: 'original', priority: 1 } });
      expect(rules).toEqual({ copied: { priority: 1 } });
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("states the id 'original'"));
      // The engine accepts the result.
      expect(() => groupInstancesBySplitRules([makeInstance()] as never, rules)).not.toThrow();
    });
  });
});
