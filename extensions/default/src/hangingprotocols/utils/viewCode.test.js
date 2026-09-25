import viewCode from './viewCode';

describe('viewCode', () => {
  it.each([undefined, {}, { images: [] }, { images: [{}] }])(
    'returns undefined when a display set has no view-code metadata: %p',
    displaySet => {
      expect(viewCode(displaySet)).toBeUndefined();
    }
  );

  it('returns the coding scheme and value from the first image', () => {
    expect(
      viewCode({
        images: [
          {
            ViewCodeSequence: [
              {
                CodingSchemeDesignator: 'SRT',
                CodeValue: 'R-10242',
              },
            ],
          },
        ],
      })
    ).toBe('SRT:R-10242');
  });
});
