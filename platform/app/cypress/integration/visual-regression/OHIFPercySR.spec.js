import '@percy/cypress';

describe('OHIF Percy SR', () => {
  beforeEach(() => {
    cy.openStudyInViewer('1.2.840.113619.2.5.1762583153.215519.978957063.78');
    cy.wait(5000);
    cy.expectMinimumThumbnails(3);
  });

  it('should hydrate SR correctly and Jump to Measurements', () => {
    cy.get('[data-cy="study-browser-thumbnail-no-image"]').first().dblclick();
    cy.wait(200);
    cy.percyCanvasSnapshot('SR Preview');
    cy.get('body').type('{enter}');
    cy.wait(200);
    cy.percyCanvasSnapshot('SR Hydrated');
    cy.get('[data-cy="trackedMeasurements-btn"]').click();
    cy.percyCanvasSnapshot('Opened Measurement Panel');
    cy.get('body').type('{downarrow}');
    cy.get('body').type('{downarrow}');
    cy.get('body').type('{downarrow}');
    cy.percyCanvasSnapshot('Scrolled away from measurements');
    cy.get('[data-cy="measurement-item"]').first().click();
    cy.percyCanvasSnapshot('Jumped to Measurement');
  });
});
