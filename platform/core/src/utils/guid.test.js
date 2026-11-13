import guid from './guid';

describe('guid', () => {
  const getRandomValues = jest
    .spyOn(crypto, 'getRandomValues')
    .mockImplementation(array => array.fill(0x77bf));
  const guidValue = guid();
  getRandomValues.mockRestore();

  test('should return 77bf77bf-77bf-77bf-77bf-77bf77bf77bf when crypto.getRandomValues returns 0x77bf', () => {
    expect(guidValue).toBe('77bf77bf-77bf-77bf-77bf-77bf77bf77bf');
  });

  test('should pad each group of four to four hexadecimal digits', () => {
    const spy = jest.spyOn(crypto, 'getRandomValues').mockImplementation(array => array.fill(0xa));
    const value = guid();
    spy.mockRestore();
    expect(value).toBe('000a000a-000a-000a-000a-000a000a000a');
  });

  test('should always return a guid of size 36', () => {
    expect(guidValue.length).toBe(36);
  });

  test('should always return a guid with five sequences', () => {
    expect(guidValue.split('-').length).toBe(5);
  });

  test('should always return a guid with four dashes', () => {
    expect(guidValue.split('-').length - 1).toBe(4);
  });

  test('should return the first sequence with length of eigth', () => {
    expect(guidValue.split('-')[0].length).toBe(8);
  });

  test('should return the second sequence with length of four', () => {
    expect(guidValue.split('-')[1].length).toBe(4);
  });

  test('should return the third sequence with length of four', () => {
    expect(guidValue.split('-')[2].length).toBe(4);
  });

  test('should return the fourth sequence with length of four', () => {
    expect(guidValue.split('-')[3].length).toBe(4);
  });

  test('should return the last sequence with length of twelve', () => {
    expect(guidValue.split('-')[4].length).toBe(12);
  });
});
