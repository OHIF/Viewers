describe('Visual Regression - OHIF Cornerstone Hotkeys', () => {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.2.840.113619.2.5.1762583153.215519.978957063.78'
    );
    cy.expectMinimumThumbnails(3);
  });

  beforeEach(() => {
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
    cy.resetViewport();
  });

  it('checks if hotkey "I" can invert the image', () => {
    // Hotkey I
    cy.get('body').type('I');
    // Visual comparison
    cy.screenshot('Hotkey I - Should Invert Image');
    cy.percyCanvasSnapshot('Hotkey I - Should Invert Image');
  });

  it('checks if hotkey "SPACEBAR" can reset the image', () => {
    // Press multiples hotkeys
    cy.get('body').type('V+++I');

    // Hotkey SPACEBAR
    cy.get('body').type(' ');

    // Visual comparison to make sure the 'inverted' image was reset
    cy.screenshot('Hotkey SPACEBAR - Should Reset Image');
    cy.percyCanvasSnapshot('Hotkey SPACEBAR - Should Reset Image');
  });
});
