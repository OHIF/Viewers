import '@percy/cypress';

describe('OHIF Percy SR Hydration', () => {
  beforeEach(() => {
    cy.openStudyInViewer('1.2.840.113619.2.5.1762583153.215519.978957063.78');
    cy.wait(5000);
    cy.expectMinimumThumbnails(3);
  });

  it('should hydrate SR correctly', () => {
    cy.get('[data-cy="study-browser-thumbnail-no-image"]').first().dblclick();
    cy.wait(200);
    cy.percySnapshot('SR Preview');
    cy.get('body').type('{enter}');
    cy.wait(200);
    cy.percySnapshot('SR Hydrated');
  });
});
