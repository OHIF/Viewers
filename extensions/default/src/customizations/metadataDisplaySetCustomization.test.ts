import getMetadataDisplaySetCustomization from './metadataDisplaySetCustomization';

describe('getMetadataDisplaySetCustomization', () => {
  const customization = () =>
    getMetadataDisplaySetCustomization({ servicesManager: { services: {} } } as never)
      .useMetadataDisplaySet;

  it('defaults to a keyed raw selector with the priorities 1..n', () => {
    const { splitRules } = customization();
    expect(Array.isArray(splitRules)).toBe(false);
    expect(
      Object.values(splitRules)
        .map(rule => rule.priority)
        .sort()
    ).toEqual([1, 2, 3, 4, 5]);
  });

  it('holds the default rules as data, with no functions in them', () => {
    // The rules go through the @cornerstonejs/metadata compiler; only the
    // classifiers are code.
    const { splitRules } = customization();
    expect(JSON.parse(JSON.stringify(splitRules))).toEqual(splitRules);
  });

  it('supplies the stackImage classifier the default rules reference', () => {
    expect(typeof customization().classifiers.stackImage).toBe('function');
  });
});
