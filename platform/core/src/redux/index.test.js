import redux from './index.js';

describe('redux exports', () => {
  test('have not changed', () => {
    const expectedExports = ['actions', 'reducers', 'localStorage', 'sessionStorage'].sort();

    const exports = Object.keys(redux).sort();

    expect(exports).toEqual(expectedExports);
  });
});
