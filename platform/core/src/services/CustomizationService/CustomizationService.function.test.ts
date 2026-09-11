import CustomizationService, { CustomizationScope } from './CustomizationService';

/**
 * Tests for the `$function` read-time marker: declaring behavior as data
 * (JSONC-compatible) that is compiled once into a safe closure — and for the
 * policy that decides where such a marker is permitted at all.
 */
describe('CustomizationService $function', () => {
  let service: CustomizationService;
  let warn: jest.SpyInstance;

  /**
   * `$function` is gated on `appConfig.customizationFunctionPolicy`, read off
   * the extension manager. Tests that exercise the marker itself opt into a
   * permissive policy; tests that exercise the policy set their own.
   */
  const setPolicy = (policy: unknown) => {
    (service as any).extensionManager = {
      appConfig: policy === undefined ? {} : { customizationFunctionPolicy: policy },
    };
  };

  beforeEach(() => {
    service = new CustomizationService({ configuration: {}, commandsManager: {} } as any);
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    warn.mockRestore();
  });

  describe('compiling markers', () => {
    beforeEach(() => {
      setPolicy({ attributes: ['**'] });
    });

    it('resolves a string $function into a callable closure', () => {
      service.setCustomizations(
        { isMammo: { $function: "Modality in ['CR', 'DX', 'MG']" } },
        CustomizationScope.Global
      );
      const isMammo = service.getCustomization('isMammo') as (instance) => boolean;
      expect(typeof isMammo).toBe('function');
      expect(isMammo({ Modality: 'MG' })).toBe(true);
      expect(isMammo({ Modality: 'CT' })).toBe(false);
    });

    it('resolves the long form with custom params', () => {
      service.setCustomizations(
        {
          seriesFrameCount: {
            $function: {
              expr: 'sumOf(instances, defined(NumberOfFrames) ? NumberOfFrames : 1)',
              params: ['context'],
            },
          },
        },
        CustomizationScope.Global
      );
      const frameCount = service.getCustomization('seriesFrameCount') as (context) => number;
      expect(frameCount({ instances: [{ NumberOfFrames: 4 }, {}] })).toBe(5);
    });

    it('resolves $function markers nested inside objects and arrays', () => {
      service.setCustomizations(
        {
          splitRuleLike: {
            id: 'ctScout',
            matches: { $function: "Modality === 'CT'" },
            customAttributes: {
              label: 'SCOUT',
              SeriesDescription: { $function: '`SCOUT ${SeriesDescription}`' },
            },
          },
        },
        CustomizationScope.Global
      );
      const rule = service.getCustomization('splitRuleLike') as any;
      expect(rule.id).toBe('ctScout');
      expect(rule.matches({ Modality: 'CT' })).toBe(true);
      expect(rule.customAttributes.label).toBe('SCOUT');
      expect(rule.customAttributes.SeriesDescription({ SeriesDescription: 'CHEST' })).toBe(
        'SCOUT CHEST'
      );
    });

    it('memoizes the compiled closure across reads', () => {
      service.setCustomizations(
        { predicate: { $function: 'Rows > 0' } },
        CustomizationScope.Global
      );
      const first = service.getCustomization('predicate');
      const second = service.getCustomization('predicate');
      expect(first).toBe(second);
    });

    it('is not consumed by immutability-helper command processing', () => {
      // A value containing ONLY a $function marker must be stored verbatim
      // (not treated as an update() command spec).
      service.setCustomizations(
        { onlyFunction: { $function: '1 + 1' } },
        CustomizationScope.Global
      );
      const fn = service.getCustomization('onlyFunction') as () => number;
      expect(fn()).toBe(2);
    });

    it('warns and resolves to undefined for invalid definitions', () => {
      service.setCustomizations(
        {
          broken: { $function: '1 +' },
          empty: { $function: '' },
        },
        CustomizationScope.Global
      );
      expect(service.getCustomization('broken')).toBeUndefined();
      expect(service.getCustomization('empty')).toBeUndefined();
      expect(warn).toHaveBeenCalled();
    });
  });

  describe('attribute deny policy', () => {
    it('permits a marker anywhere by default', () => {
      setPolicy(undefined);
      service.setCustomizations(
        {
          useMetadataDisplaySet: {
            splitRules: [
              {
                id: 'ctScout',
                matches: { $function: "Modality === 'CT'" },
                series: { firstInstance: { $function: 'minOf(instances, InstanceNumber)' } },
                customAttributes: {
                  SeriesDescription: { $function: '`SCOUT ${SeriesDescription}`' },
                },
              },
            ],
          },
        },
        CustomizationScope.Global
      );
      const [rule] = (service.getCustomization('useMetadataDisplaySet') as any).splitRules;
      expect(rule.matches({ Modality: 'CT' })).toBe(true);
      expect(rule.series.firstInstance({ instances: [{ InstanceNumber: 3 }] })).toBe(3);
      expect(rule.customAttributes.SeriesDescription({ SeriesDescription: 'CHEST' })).toBe(
        'SCOUT CHEST'
      );
      expect(warn).not.toHaveBeenCalled();
    });

    it('refuses a marker at a denied path, leaving the rest of the rule intact', () => {
      setPolicy({
        denyAttributes: ['useMetadataDisplaySet.splitRules.customAttributes.SeriesDescription'],
      });
      service.setCustomizations(
        {
          useMetadataDisplaySet: {
            splitRules: [
              {
                id: 'ctScout',
                matches: { $function: "Modality === 'CT'" },
                customAttributes: {
                  label: 'SCOUT',
                  SeriesDescription: { $function: '`SCOUT ${SeriesDescription}`' },
                },
              },
            ],
          },
        },
        CustomizationScope.Global
      );
      const [rule] = (service.getCustomization('useMetadataDisplaySet') as any).splitRules;
      expect(rule.customAttributes.SeriesDescription).toBeUndefined();
      // The denial is scoped to the one attribute.
      expect(rule.customAttributes.label).toBe('SCOUT');
      expect(rule.matches({ Modality: 'CT' })).toBe(true);
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining(
          'useMetadataDisplaySet.splitRules.customAttributes.SeriesDescription'
        ),
        expect.anything()
      );
    });

    it('keys the path on shape, not on array position', () => {
      setPolicy({ denyAttributes: ['rules.matches'] });
      service.setCustomizations(
        {
          rules: [
            { id: 'a', matches: { $function: '1 == 1' } },
            { id: 'b', matches: { $function: '1 == 2' } },
          ],
        },
        CustomizationScope.Global
      );
      const rules = service.getCustomization('rules') as any[];
      // One pattern denies every rule in the list; reordering cannot change that.
      expect(rules[0].matches).toBeUndefined();
      expect(rules[1].matches).toBeUndefined();
    });

    it('matches a single segment with * and a subtree with a trailing **', () => {
      setPolicy({ denyAttributes: ['a.*.denied', 'b.**'] });
      service.setCustomizations(
        {
          a: { one: { denied: { $function: '1' } }, two: { allowed: { $function: '2' } } },
          b: { deep: { deeper: { $function: '3' } } },
        },
        CustomizationScope.Global
      );
      const a = service.getCustomization('a') as any;
      const b = service.getCustomization('b') as any;
      expect(a.one.denied).toBeUndefined();
      expect(a.two.allowed()).toBe(2);
      expect(b.deep.deeper).toBeUndefined();
    });

    it('disables $function entirely for ["**"]', () => {
      setPolicy({ denyAttributes: ['**'] });
      service.setCustomizations({ anything: { $function: '1' } }, CustomizationScope.Global);
      expect(service.getCustomization('anything')).toBeUndefined();
    });

    it('ignores a malformed policy rather than denying everything', () => {
      setPolicy({ denyAttributes: 'rules.matches' });
      service.setCustomizations({ anything: { $function: '1 + 1' } }, CustomizationScope.Global);
      const fn = service.getCustomization('anything') as () => number;
      expect(fn()).toBe(2);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('must be an'), expect.anything());
    });

    it('judges a referenced customization by its own path', () => {
      setPolicy({ denyAttributes: ['sharedRule.matches'] });
      service.setCustomizations(
        {
          sharedRule: { matches: { $function: "Modality === 'MR'" } },
          referrer: { rule: { $reference: 'sharedRule' } },
        },
        CustomizationScope.Global
      );
      // Reached through `referrer.rule`, but judged as `sharedRule.matches` — a
      // marker is governed by where it is defined, not by who reads it.
      const referrer = service.getCustomization('referrer') as any;
      expect(referrer.rule.matches).toBeUndefined();
    });
  });

  describe('registered signatures', () => {
    it('compiles a marker with the registered params, without the data saying so', () => {
      service.registerFunctionSignatures({
        'rules.compareInstances': ['a', 'b', 'context'],
      });
      service.setCustomizations(
        { rules: { compareInstances: { $function: 'a.SliceLocation - b.SliceLocation' } } },
        CustomizationScope.Global
      );
      const compare = service.getCustomization('rules') as any;
      const sorted = [{ SliceLocation: 3 }, { SliceLocation: 1 }, { SliceLocation: 2 }].sort(
        compare.compareInstances
      );
      expect(sorted.map(i => i.SliceLocation)).toEqual([1, 2, 3]);
    });

    it('passes the third parameter through', () => {
      service.registerFunctionSignatures({ 'cmp.fn': ['a', 'b', 'context'] });
      service.setCustomizations(
        {
          cmp: {
            fn: {
              $function:
                'context.descending ? b.InstanceNumber - a.InstanceNumber : a.InstanceNumber - b.InstanceNumber',
            },
          },
        },
        CustomizationScope.Global
      );
      const { fn } = service.getCustomization('cmp') as any;
      expect(fn({ InstanceNumber: 1 }, { InstanceNumber: 2 }, { descending: true })).toBe(1);
      expect(fn({ InstanceNumber: 1 }, { InstanceNumber: 2 }, {})).toBe(-1);
    });

    it('overrides params the data declared, and warns about the disagreement', () => {
      service.registerFunctionSignatures({ 'rules.matches': ['instance', 'context'] });
      service.setCustomizations(
        {
          rules: {
            // Wrong convention, copied from a comparator example. The registered
            // signature is authoritative because the caller defined it.
            matches: { $function: { expr: "Modality === 'CT'", params: ['a', 'b'] } },
          },
        },
        CustomizationScope.Global
      );
      const { matches } = service.getCustomization('rules') as any;
      expect(matches({ Modality: 'CT' })).toBe(true);
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('declares params'));
    });

    it('accepts a marker that spells the registered signature out', () => {
      service.registerFunctionSignatures({ 'rules.matches': ['instance', 'context'] });
      service.setCustomizations(
        {
          rules: {
            matches: {
              $function: { expr: "Modality === 'CT'", params: ['instance', 'context'] },
            },
          },
        },
        CustomizationScope.Global
      );
      const { matches } = service.getCustomization('rules') as any;
      expect(matches({ Modality: 'CT' })).toBe(true);
      expect(warn).not.toHaveBeenCalled();
    });

    it('prefers the most specific matching pattern', () => {
      service.registerFunctionSignatures({
        'rules.series.*': ['context'],
        'rules.series.special': ['instance', 'context'],
      });
      service.setCustomizations(
        {
          rules: {
            series: {
              generic: { $function: 'instances.length' },
              special: { $function: 'Rows' },
            },
          },
        },
        CustomizationScope.Global
      );
      const { series } = service.getCustomization('rules') as any;
      expect(series.generic({ instances: [1, 2, 3] })).toBe(3);
      expect(series.special({ Rows: 512 })).toBe(512);
    });

    it('falls back to the default convention when nothing is registered', () => {
      service.setCustomizations(
        { unregistered: { $function: "Modality === 'CT'" } },
        CustomizationScope.Global
      );
      const fn = service.getCustomization('unregistered') as (instance) => boolean;
      expect(fn({ Modality: 'CT' })).toBe(true);
    });

    it('re-reads customizations resolved before a signature was registered', () => {
      service.setCustomizations(
        { rules: { compareInstances: { $function: 'a.InstanceNumber - b.InstanceNumber' } } },
        CustomizationScope.Global
      );
      // Resolved with the default convention: `a` is not a parameter, so it
      // resolves off the first argument and the result is NaN.
      const before = service.getCustomization('rules') as any;
      expect(Number.isNaN(before.compareInstances({}, {}))).toBe(true);

      service.registerFunctionSignatures({ 'rules.compareInstances': ['a', 'b'] });

      const after = service.getCustomization('rules') as any;
      expect(after.compareInstances({ InstanceNumber: 2 }, { InstanceNumber: 1 })).toBe(1);
    });

    it('ignores a malformed signature', () => {
      service.registerFunctionSignatures({
        'rules.matches': 'instance' as unknown as string[],
      });
      expect(warn).toHaveBeenCalledWith(
        expect.stringContaining('must be an array of parameter names'),
        expect.anything()
      );
      service.setCustomizations(
        { rules: { matches: { $function: "Modality === 'CT'" } } },
        CustomizationScope.Global
      );
      const { matches } = service.getCustomization('rules') as any;
      expect(matches({ Modality: 'CT' })).toBe(true);
    });
  });
});
