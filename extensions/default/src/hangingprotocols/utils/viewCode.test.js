import viewCode from './viewCode';

describe('viewCode', () => {
  it.each([undefined, {}, { instance: {} }, { instance: { ViewCodeSequence: [] } }])(
    'returns undefined when a display set has no view-code metadata: %p',
    displaySet => {
      expect(viewCode(displaySet)).toBeUndefined();
    }
  );

  it('returns the coding scheme and value from the display set instance', () => {
    expect(
      viewCode({
        instance: {
          ViewCodeSequence: [
            {
              CodingSchemeDesignator: 'SRT',
              CodeValue: 'R-10242',
            },
          ],
        },
      })
    ).toBe('SRT:R-10242');
  });
});
