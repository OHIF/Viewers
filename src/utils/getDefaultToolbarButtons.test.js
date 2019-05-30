import getDefaultToolbarButtons from './getDefaultToolbarButtons.js';

describe('getDefaultToolbarButtons.js', () => {
  it('returns a non-empty array', () => {
    const buttons = getDefaultToolbarButtons();

    expect(buttons.length).toBeGreaterThan(0);
  });
});
