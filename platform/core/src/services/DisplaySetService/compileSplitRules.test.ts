import { compiledDisplaySetRules, groupInstancesBySplitRules } from '@cornerstonejs/metadata';
import { compileSplitRules, SplitRuleRunError } from './compileSplitRules';

const makeInstance = (overrides: Record<string, unknown> = {}) => ({
  SOPInstanceUID: 'sop-1',
  SeriesInstanceUID: 'series-1',
  Modality: 'CT',
  Rows: 256,
  ...overrides,
});

/** Compiles every rule of the registry, in key order. */
const compileAll = (registry, options = {}) =>
  compileSplitRules(registry, Object.keys(registry), options);

describe('compileSplitRules', () => {
  let warn: jest.SpyInstance;

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  it('compiles raw selector data with the metadata compiler', () => {
    const { rules, errors } = compileAll({
      ctOnly: {
        context: { isLargeCt: "Modality == 'CT' && Rows > 100" },
        matches: { isLargeCt: true },
        attributes: {
          label: { template: 'CT' },
          SeriesDescription: { template: 'CT {SeriesDescription}' },
        },
      },
    });
    expect(errors).toEqual([]);
    const [ctOnly] = rules;
    expect(ctOnly.id).toBe('ctOnly');
    expect(ctOnly.matches(makeInstance(), { series: {} })).toBe(true);
    expect(ctOnly.matches(makeInstance({ Modality: 'MR' }), { series: {} })).toBe(false);
    expect(
      ctOnly.customAttributes({} as never, {
        instances: [makeInstance({ SeriesDescription: 'CHEST' })],
      })
    ).toEqual({ label: 'CT', SeriesDescription: 'CT CHEST' });
    expect(warn).not.toHaveBeenCalled();
  });

  it('resolves the entries of the metadata context from the options', () => {
    const {
      rules: [stack],
    } = compileAll(
      { stack: { matches: { isUltrasound: true } } },
      { context: { isUltrasound: "Modality == 'US'" } }
    );
    expect(stack.matches(makeInstance({ Modality: 'US' }), { series: {} })).toBe(true);
    expect(stack.matches(makeInstance(), { series: {} })).toBe(false);
  });

  it('keeps a function in a raw field, and compiles the data next to it', () => {
    const matches = jest.fn(instance => instance.Modality === 'CT');
    const {
      rules: [native],
      errors,
    } = compileAll({
      native: { matches, groupBy: ['SeriesInstanceUID'] },
    });
    expect(errors).toEqual([]);
    const context = { series: {} };
    expect(native.matches(makeInstance(), context)).toBe(true);
    expect(native.matches(makeInstance({ Modality: 'MR' }), context)).toBe(false);
    expect(matches).toHaveBeenCalledWith(makeInstance(), context);
    // The data part is compiled too, and reads the same key.
    const [seriesKey] = native.groupBy as ((...args: unknown[]) => unknown)[];
    expect(seriesKey(makeInstance(), context)).toBe('series-1');
  });

  describe('a rule that mixes functions with data compiles every data field', () => {
    const mr = (sop: string, bValue: number) =>
      makeInstance({ SOPInstanceUID: sop, Modality: 'MR', DiffusionBValue: bValue });
    const bValuesOf = rules =>
      groupInstancesBySplitRules([mr('b0', 0), mr('b800', 800)] as never, rules).map(group =>
        group.instances.map(instance => instance.DiffusionBValue)
      );

    it('a data groupBy part next to a function matches', () => {
      const { rules, errors } = compileAll({
        dwi: {
          matches: instance => instance.Modality === 'MR',
          groupBy: ['SeriesInstanceUID', 'DiffusionBValue'],
        } as never,
      });
      expect(errors).toEqual([]);
      expect(bValuesOf(rules)).toEqual([[0], [800]]);
    });

    it('an invalid data field next to a function is an error', () => {
      const { errors } = compileAll({
        dwi: {
          matches: () => true,
          groupBy: [{ attribute: 'DiffusionBValue', unknownKey: true }],
        } as never,
      });
      expect(errors).toEqual([{ ruleId: 'dwi', message: expect.any(String) }]);
    });
  });

  it('rejects a rule that the compiler has already compiled', () => {
    // A compiled rule has the hook `series`, which is not a raw field.
    const compiledVolume = compiledDisplaySetRules.find(rule => rule.id === 'volume3d');
    const { rules, errors } = compileAll({ volume3d: compiledVolume as never });
    expect(errors).toEqual([
      { ruleId: 'volume3d', message: expect.stringContaining("unknown field 'series'") },
    ]);
    expect(rules).toEqual([]);
  });

  it('reports a __proto__ rule id instead of losing the rule', () => {
    // JSON.parse makes `__proto__` a real own key.
    const { rules, errors } = compileAll(JSON.parse('{"__proto__": {}, "good": {}}'));
    expect(errors).toEqual([{ ruleId: '__proto__', message: expect.stringContaining('id') }]);
    expect(rules.map(rule => rule.id)).toEqual(['good']);
  });

  it('returns the rules in the order, and does not compile a registry rule that the order omits', () => {
    const { rules, errors } = compileSplitRules(
      {
        volume3d: {},
        ctScout: { matches: { Modality: 'CT' } },
        off: { matches: { nope: true } },
      },
      ['ctScout', 'volume3d']
    );
    expect(errors).toEqual([]);
    expect(rules.map(rule => rule.id)).toEqual(['ctScout', 'volume3d']);
    expect(warn).not.toHaveBeenCalled();
  });

  describe('a rule that does not compile is reported, not dropped (SP-SAFE-7)', () => {
    it.each([
      ['an unknown name', { matches: { nope: true } }],
      ['an invalid expression', { context: { isCt: "Modality == 'CT" }, matches: { isCt: true } }],
      ['an id that differs from the key', { id: 'other' }],
      ['an entry that is not an object', 'not a rule'],
    ])('%s', (_label, entry) => {
      const { rules, errors } = compileAll({
        broken: entry as never,
        good: { matches: { Modality: 'MR' } },
      });
      expect(errors).toEqual([{ ruleId: 'broken', message: expect.any(String) }]);
      expect(errors[0].message).not.toBe('');
      // The good rule still compiles, but the caller must not use the set.
      expect(rules.map(rule => rule.id)).toEqual(['good']);
      expect(warn).not.toHaveBeenCalled();
    });

    it('an id of the order that is not in the registry, or that occurs twice', () => {
      const { rules, errors } = compileSplitRules({ good: {} }, ['missing', 'good', 'good']);
      expect(errors).toEqual([
        { ruleId: 'missing', message: expect.stringContaining('not in the registry') },
        { ruleId: 'good', message: expect.stringContaining('more than once') },
      ]);
      expect(rules.map(rule => rule.id)).toEqual(['good']);
    });

    it('names every rule that fails, because each rule compiles alone (SP-PIPE-3)', () => {
      const { errors } = compileAll({
        first: { matches: { nope: true } },
        good: {},
        second: { id: 'other' } as never,
      });
      expect(errors.map(({ ruleId }) => ruleId)).toEqual(['first', 'second']);
    });
  });

  it('reports a registry that is not keyed, and an order that is not an array', () => {
    for (const registry of [undefined, [{ id: 'a' }]]) {
      const { rules, errors } = compileSplitRules(registry as never, []);
      expect(rules).toEqual([]);
      expect(errors).toEqual([{ message: expect.stringContaining('keyed by rule id') }]);
    }
    const { errors } = compileSplitRules({}, undefined as never);
    expect(errors).toEqual([{ message: expect.stringContaining('array of rule ids') }]);
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
      ['a sortBy function', { sortBy: [fail] }, 'compareInstances'],
    ])('in %s of a rule that code supplies, through the engine', (_label, fields, field) => {
      const { rules } = compileAll({ native: { ...fields } as never });
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

    it('in an attributes function, which the display set factory calls', () => {
      const {
        rules: [native],
      } = compileAll({
        native: { matches: () => true, attributes: fail } as never,
      });
      expectRunError(
        () => native.customAttributes({} as never, { instances: [] }),
        'native',
        'customAttributes'
      );
    });

    it('in a code entry of the metadata context that a raw rule references', () => {
      const { rules } = compileAll(
        { raw: { matches: { throws: true } } },
        { context: { throws: fail } }
      );
      expectRunError(
        () => groupInstancesBySplitRules([makeInstance()] as never, rules),
        'raw',
        'matches'
      );
    });
  });
});
