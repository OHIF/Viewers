import getDefaultToolbarButtons from './getDefaultToolbarButtons.js';

describe('getDefaultToolbarButtons.js', () => {
  it('returns a non-empty array', () => {
    const basePath = '/';

    const buttons = getDefaultToolbarButtons(basePath);

    expect(buttons.length).toBeGreaterThan(0);
  });

  it('uses the provided basePath in buttons with an svgUrl property', () => {
    const basePath = '/demo/';

    const buttons = getDefaultToolbarButtons(basePath);
    const hasOneOrMoreButtonsWithSvgUrlProperty = buttons.some(btn =>
      btn.hasOwnProperty('svgUrl')
    );
    const usesBasePathInButtonSvgUrls = buttons.every(
      btn => !btn.hasOwnProperty('svgUrl') || btn.svgUrl.includes(basePath)
    );

    expect(hasOneOrMoreButtonsWithSvgUrlProperty).toBeTruthy();
    expect(usesBasePathInButtonSvgUrls).toBeTruthy();
  });
});
