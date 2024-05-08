import '@percy/cypress';

describe('OHIF Percy Segmentation Tools', () => {
  beforeEach(() => {
    Cypress.on('uncaught:exception', () => false);
    cy.openStudyInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1',
      '&hangingProtocolId=default',
      '/segmentation'
    );
    cy.wait(5000);
    cy.expectMinimumThumbnails(3);
  });

  it('should be able to use all segmentation tools and have them render correctly', () => {
    cy.get('[data-cy="study-browser-thumbnail"]').eq(1).dblclick();
    cy.percyCanvasSnapshot('Segmentation tools are disabled');
    cy.get('span').contains('Add segmentation').should('have.css', 'pointer-events', 'none');
    cy.percyCanvasSnapshot(
      'Add segmentation button is disabled when the displayset is none reconstructable'
    );
    cy.get('[data-cy="study-browser-thumbnail"]').eq(2).dblclick();
    cy.get('span').contains('Add segmentation').click();
    cy.wait(500);
    cy.percyCanvasSnapshot('Segmentation added and tools are enabled');
    cy.get('[data-cy="Brush"]').click();
    cy.percyCanvasSnapshot('Brush tool selected');
    cy.addBrush('.cornerstone-canvas');
    cy.percyCanvasSnapshot('Brush tool applied');
    cy.get('[data-cy="Eraser"]').click();
    cy.percyCanvasSnapshot('Eraser tool selected');
    cy.addEraser('.cornerstone-canvas');
    cy.percyCanvasSnapshot('Eraser tool applied');
    cy.selectLayoutPreset('MPR');
    cy.get('[data-cy="Brush"]').click();
    cy.percyCanvasSnapshot('Brush tool selected in MPR');
    cy.get('button').contains('Sphere').click();
    cy.percyCanvasSnapshot('Sphere mode for Brush tool selected');
    cy.addBrush('[data-viewport-uid="mpr-axial"] > .viewport-element > .cornerstone-canvas');
    cy.percyCanvasSnapshot('Sphere stroke for Brush tool applied');
  });
});
