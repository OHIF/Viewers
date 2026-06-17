import dental2x2Protocol from './dental2x2';

describe('dental2x2Protocol', () => {
  it('defines a fixed 2x2 layout', () => {
    const stage = dental2x2Protocol.stages[0];

    expect(stage.viewportStructure.properties).toMatchObject({
      rows: 2,
      columns: 2,
    });
    expect(stage.viewports).toHaveLength(4);
  });

  it('places current, prior, and bitewing placeholders in stable viewport slots', () => {
    const viewportIds = dental2x2Protocol.stages[0].viewports.map(
      viewport => viewport.viewportOptions.viewportId
    );

    expect(viewportIds).toEqual([
      'dental-current',
      'dental-prior',
      'dental-bitewing-left',
      'dental-bitewing-right',
    ]);
  });

  it('requires prior display sets to match current modality', () => {
    const priorSelector =
      dental2x2Protocol.displaySetSelectors.priorSameModalityDisplaySetId;

    expect(priorSelector.seriesMatchingRules).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          attribute: 'sameAttributeAsDisplaySet',
          required: true,
        }),
      ])
    );
  });

  it('keeps bottom viewports as static placeholders without display set matching', () => {
    const [, , bitewingLeft, bitewingRight] = dental2x2Protocol.stages[0].viewports;

    expect(bitewingLeft.displaySets).toEqual([]);
    expect(bitewingRight.displaySets).toEqual([]);
  });
});
