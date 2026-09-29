import { groupInstancesBySplitRules } from '@cornerstonejs/metadata';
import { compileSplitRules, SplitRuleRunError } from './compileSplitRules';

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
    const { rules, errors } = compileSplitRules({
      ctOnly: {
        priority: 1,
        matches: { expression: "Modality === 'CT' && Rows > 100" },
        customAttributes: {
          set: { label: 'CT' },
          fromFirstInstance: { SeriesDescription: { expression: '`CT ${SeriesDescription}`' } },
        },
      },
    });
    expect(errors).toEqual([]);
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
    const { rules } = compileSplitRules(
      { stack: { priority: 1, matches: { classifier: 'stackImage' } } },
      { classifiers: { stackImage: instance => instance.Modality === 'US' } }
    );
    expect(rules.stack.matches(makeInstance({ Modality: 'US' }), { series: {} })).toBe(true);
    expect(rules.stack.matches(makeInstance(), { series: {} })).toBe(false);
  });

  it('uses a rule that code has already compiled, with the same behaviour', () => {
    const matches = jest.fn(instance => instance.Modality === 'CT');
    const { rules, errors } = compileSplitRules({
      native: { priority: 1, matches, groupBy: ['SeriesInstanceUID'] },
    });
    expect(errors).toEqual([]);
    const context = { series: {} };
    expect(rules.native.matches(makeInstance(), context)).toBe(true);
    expect(rules.native.matches(makeInstance({ Modality: 'MR' }), context)).toBe(false);
    expect(matches).toHaveBeenCalledWith(makeInstance(), context);
    expect(rules.native.groupBy).toEqual(['SeriesInstanceUID']);
  });

  it('keeps the keys and the priorities, including null', () => {
    const { rules, errors } = compileSplitRules({
      volume3d: { priority: 4 },
      ctScout: { priority: -1, matches: { attribute: 'Modality', equals: 'CT' } },
      off: { priority: null },
    });
    expect(errors).toEqual([]);
    expect(Object.fromEntries(Object.entries(rules).map(([id, r]) => [id, r.priority]))).toEqual({
      volume3d: 4,
      ctScout: -1,
      off: null,
    });
    expect(warn).not.toHaveBeenCalled();
  });

  describe('a rule that does not compile is reported, not dropped (SP-SAFE-7)', () => {
    it.each([
      ['an unknown classifier', { priority: 1, matches: { classifier: 'nope' } }],
      ['an invalid expression', { priority: 1, matches: { expression: "Modality === 'CT" } }],
      ['a missing priority', { matches: { attribute: 'Modality', equals: 'CT' } }],
      ['a text priority', { priority: 'high', matches: { attribute: 'Modality', equals: 'CT' } }],
      ['an id that differs from the key', { id: 'other', priority: 1 }],
      ['an entry that is not an object', 'not a rule'],
    ])('%s', (_label, entry) => {
      const { rules, errors } = compileSplitRules({
        broken: entry as never,
        good: { priority: 2, matches: { attribute: 'Modality', equals: 'MR' } },
      });
      expect(errors).toEqual([{ ruleId: 'broken', message: expect.any(String) }]);
      expect(errors[0].message).not.toBe('');
      // The good rule still compiles, but the caller must not use the set.
      expect(Object.keys(rules)).toEqual(['good']);
      expect(warn).not.toHaveBeenCalled();
    });

    it('also for a compiled rule with no usable priority', () => {
      const { errors } = compileSplitRules({ native: { matches: () => true } as never });
      expect(errors).toEqual([{ ruleId: 'native', message: expect.stringContaining('priority') }]);
    });

    it('names every rule that fails, because each rule compiles alone (SP-PIPE-3)', () => {
      const { errors } = compileSplitRules({
        first: { priority: 1, matches: { classifier: 'nope' } },
        good: { priority: 2 },
        second: { priority: 'high' } as never,
      });
      expect(errors.map(({ ruleId }) => ruleId)).toEqual(['first', 'second']);
    });
  });

  it('reports input that is not a keyed rule set', () => {
    for (const input of [undefined, [{ id: 'a' }]]) {
      const { rules, errors } = compileSplitRules(input as never);
      expect(rules).toEqual({});
      expect(errors).toEqual([{ message: expect.stringContaining('keyed by rule id') }]);
    }
  });

  describe('a run-time error names the rule and the field', () => {
    const fail = () => {
      throw new Error('bad value');
    };
    const expectRunError = (call: () => unknown, ruleId: string, field: string) => {
      let caught: unknown;
      try {
        call();
      } catch (error) {
        caught = error;
      }
      expect(caught).toBeInstanceOf(SplitRuleRunError);
      const runError = caught as SplitRuleRunError;
      expect(runError.ruleId).toBe(ruleId);
      expect(runError.field).toBe(field);
      expect((runError.cause as Error).message).toBe('bad value');
      expect(runError.message).toBe(`Split rule '${ruleId}' failed in '${field}': bad value`);
    };

    it.each([
      ['matches', { matches: fail }, 'matches'],
      ['a groupBy part', { groupBy: ['SeriesInstanceUID', fail] }, 'groupBy[1]'],
      ['runBy', { runBy: fail }, 'runBy'],
      ['series', { series: fail }, 'series'],
      ['compareInstances', { compareInstances: fail }, 'compareInstances'],
    ])('in %s of a rule that code supplies, through the engine', (_label, fields, field) => {
      const { rules } = compileSplitRules({ native: { priority: 1, ...fields } as never });
      expectRunError(
        () =>
          groupInstancesBySplitRules(
            [makeInstance(), makeInstance({ SOPInstanceUID: 'sop-2' })] as never,
            rules
          ),
        'native',
        field
      );
    });

    it('in customAttributes, which the display set factory calls', () => {
      const { rules } = compileSplitRules({
        native: { priority: 1, matches: () => true, customAttributes: fail } as never,
      });
      expectRunError(
        () => rules.native.customAttributes({} as never, { instances: [] }),
        'native',
        'customAttributes'
      );
    });

    it('in a named classifier that a raw rule references', () => {
      const { rules } = compileSplitRules(
        { raw: { priority: 1, matches: { classifier: 'throws' } } },
        { classifiers: { throws: fail } }
      );
      expectRunError(
        () => groupInstancesBySplitRules([makeInstance()] as never, rules),
        'raw',
        'matches'
      );
    });
  });
});
