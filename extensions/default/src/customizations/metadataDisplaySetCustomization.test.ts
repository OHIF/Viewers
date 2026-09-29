import getMetadataDisplaySetCustomization from './metadataDisplaySetCustomization';

describe('getMetadataDisplaySetCustomization', () => {
  const registered = () => {
    const registerFunctionSignatures = jest.fn();
    getMetadataDisplaySetCustomization({
      servicesManager: { services: { customizationService: { registerFunctionSignatures } } },
    } as never);
    return registerFunctionSignatures.mock.calls[0][0];
  };

  it('registers the comparator signature for the host compareInstances', () => {
    // Without it, `a.SliceLocation - b.SliceLocation` compiles with
    // (instance, context), returns NaN on every call, and the engine reads NaN
    // as "no opinion" - so the comparator does nothing, with no warning.
    expect(registered()['useMetadataDisplaySet.compareInstances']).toEqual(['a', 'b', 'context']);
  });

  it('registers the rule signatures under the rule id segment of the keyed rule set', () => {
    expect(registered()).toMatchObject({
      'useMetadataDisplaySet.splitRules.*.matches': ['instance', 'context'],
      'useMetadataDisplaySet.splitRules.*.compareInstances': ['a', 'b', 'context'],
      'useMetadataDisplaySet.splitRules.*.series.*': ['context'],
    });
  });

  it('defaults to a keyed rule set with the priorities 1..n', () => {
    const { useMetadataDisplaySet } = getMetadataDisplaySetCustomization({
      servicesManager: { services: {} },
    } as never);
    expect(Array.isArray(useMetadataDisplaySet.splitRules)).toBe(false);
    expect(
      Object.values(useMetadataDisplaySet.splitRules)
        .map(rule => rule.priority)
        .sort()
    ).toEqual([1, 2, 3, 4, 5]);
  });
});
