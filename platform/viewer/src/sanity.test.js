describe('Sanity Test', () => {
  test('how many marbles?', () => {
    const expectedMarbles = 4;
    const actualMarbles = 2 + 2;

    expect(actualMarbles).toEqual(expectedMarbles);
  });
});
