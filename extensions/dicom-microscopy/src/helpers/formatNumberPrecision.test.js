import formatNumberPrecision from './formatNumberPrecision';

describe('formatNumberPrecision', () => {
  it('should format number precision', () => {
    const number = 0.229387;
    const formattedNumber = formatNumberPrecision(number, 2);
    expect(formattedNumber).toEqual(0.23);
  });
});
