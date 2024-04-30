import '@percy/cypress';

describe('OHIF Percy MPR Crosshairs', () => {
  beforeEach(() => {
    cy.openStudyInViewer(
      '1.3.6.1.4.1.14519.5.2.1.7009.2403.334240657131972136850343327463',
      '&hangingProtocolId=default',
      '/viewer'
    );
    cy.wait(5000);
    cy.expectMinimumThumbnails(4);
  });

  it('should enabled crosshairs in MPR and reset them when another series is loaded', () => {
    cy.get('[data-cy="study-browser-thumbnail"]').eq(2).dblclick();
    cy.selectLayoutPreset('MPR');
    cy.get('[data-cy="Crosshairs"]').click();
    cy.wait(500);
    cy.percyCanvasSnapshot('Crosshairs enabled');
    cy.wait(100);
    cy.get('[data-viewport-uid="mpr-axial"] > .viewport-element > .cornerstone-canvas').click(
      45,
      100
    );
    cy.wait(200);
    cy.percyCanvasSnapshot('Crosshairs are moved');
    cy.get('[data-cy="study-browser-thumbnail"]').eq(0).dblclick();
    cy.wait(500);
    cy.percyCanvasSnapshot('Another series dropped, Crosshairs are centered');
  });
});
