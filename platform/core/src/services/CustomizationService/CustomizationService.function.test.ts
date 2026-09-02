import CustomizationService, { CustomizationScope } from './CustomizationService';

/**
 * Tests for the `$function` read-time marker: declaring behavior as data
 * (JSONC-compatible) that is compiled once into a safe closure.
 */
describe('CustomizationService $function', () => {
  let service: CustomizationService;

  beforeEach(() => {
    service = new CustomizationService({ configuration: {}, commandsManager: {} } as any);
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
    service.setCustomizations({ predicate: { $function: 'Rows > 0' } }, CustomizationScope.Global);
    const first = service.getCustomization('predicate');
    const second = service.getCustomization('predicate');
    expect(first).toBe(second);
  });

  it('is not consumed by immutability-helper command processing', () => {
    // A value containing ONLY a $function marker must be stored verbatim
    // (not treated as an update() command spec).
    service.setCustomizations({ onlyFunction: { $function: '1 + 1' } }, CustomizationScope.Global);
    const fn = service.getCustomization('onlyFunction') as () => number;
    expect(fn()).toBe(2);
  });

  it('warns and resolves to undefined for invalid definitions', () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    try {
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
    } finally {
      warn.mockRestore();
    }
  });
});
