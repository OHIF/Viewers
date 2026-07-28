import { groupInstancesBySplitRules } from '@cornerstonejs/metadata';
import type { SplitRule } from '@cornerstonejs/metadata';
import { normalizeSplitRules } from './normalizeSplitRules';
import { compileExpression } from '../CustomizationService/expression';

const makeInstance = (overrides: Record<string, unknown> = {}) => ({
  SOPInstanceUID: 'sop-1',
  SeriesInstanceUID: 'series-1',
  Modality: 'CT',
  Rows: 256,
  ...overrides,
});

describe('normalizeSplitRules', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('passes engine-native rules through unchanged', () => {
    const rule: SplitRule = {
      id: 'native',
      matches: instance => instance.Modality === 'CT',
      groupBy: ['SeriesInstanceUID'],
    };
    expect(normalizeSplitRules([rule])).toEqual([rule]);
  });

  it('compiles a string matches expression', () => {
    const [rule] = normalizeSplitRules([
      { id: 'stringMatches', matches: "Modality === 'CT'" } as unknown as SplitRule,
    ]);
    expect(typeof rule.matches).toBe('function');
    expect(rule.matches(makeInstance(), {} as never)).toBe(true);
    expect(rule.matches(makeInstance({ Modality: 'MR' }), {} as never)).toBe(false);
  });

  describe('rules the engine would misinterpret are dropped', () => {
    // groupInstancesBySplitRules treats a rule with no `matches` as matching
    // every instance, so a $function that failed to compile must not survive.
    it('drops a rule whose authored matches did not compile', () => {
      const rules = normalizeSplitRules([
        { id: 'broken', matches: undefined, groupBy: ['SeriesInstanceUID'] } as SplitRule,
      ]);
      expect(rules).toHaveLength(0);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining("dropping split rule 'broken'"),
        undefined
      );
    });

    it('drops a rule whose matches is still an unresolved marker', () => {
      const rules = normalizeSplitRules([
        { id: 'marker', matches: { $function: "Modality === 'CT'" } } as unknown as SplitRule,
      ]);
      expect(rules).toHaveLength(0);
    });

    it('drops a rule with an invalid groupBy entry', () => {
      const rules = normalizeSplitRules([
        { id: 'badGroup', matches: () => true, groupBy: [undefined] } as unknown as SplitRule,
      ]);
      expect(rules).toHaveLength(0);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining("dropping split rule 'badGroup'"), [
        undefined,
      ]);
    });

    it('keeps a rule that legitimately omits matches (catch-all)', () => {
      const rules = normalizeSplitRules([{ id: 'catchAll' } as SplitRule]);
      expect(rules).toHaveLength(1);
      expect(warn).not.toHaveBeenCalled();
    });

    it('leaves the surviving rules in charge rather than claiming everything', () => {
      const good: SplitRule = {
        id: 'good',
        matches: instance => instance.Modality === 'MR',
        groupBy: ['SeriesInstanceUID'],
      };
      const rules = normalizeSplitRules([{ id: 'broken', matches: undefined } as SplitRule, good]);
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
    normalizeSplitRules([
      {
        id: 'badFact',
        series: { frameCount: undefined },
        matches: () => true,
      } as unknown as SplitRule,
    ]);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("undefined series fact 'frameCount'")
    );
  });

  it('wraps an object-form series map into the engine callback', () => {
    const [rule] = normalizeSplitRules([
      {
        id: 'declarative',
        series: {
          frameCount: compileExpression('sumOf(instances, defined(Rows) ? 1 : 0)'),
          literal: 7,
        },
        matches: () => true,
      } as unknown as SplitRule,
    ]);
    expect(rule.series({ instances: [makeInstance(), makeInstance()] })).toEqual({
      frameCount: 2,
      literal: 7,
    });
  });

  it('wraps an object-form customAttributes map into the engine callback', () => {
    const [rule] = normalizeSplitRules([
      {
        id: 'declarative',
        matches: () => true,
        customAttributes: {
          label: 'SCOUT',
          SeriesDescription: compileExpression('`SCOUT ${SeriesDescription}`'),
        },
      } as unknown as SplitRule,
    ]);
    const instances = [makeInstance({ SeriesDescription: 'CHEST' })];
    expect(
      rule.customAttributes({ instance: instances[0] }, { instances, splitNumber: 0 })
    ).toEqual({ label: 'SCOUT', SeriesDescription: 'SCOUT CHEST' });
  });

  it('returns an empty array for non-array input', () => {
    expect(normalizeSplitRules(undefined as unknown as SplitRule[])).toEqual([]);
  });
});
