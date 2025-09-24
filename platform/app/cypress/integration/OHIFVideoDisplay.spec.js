describe('OHIF Video Display', function () {
  beforeEach(function () {
    Cypress.on('uncaught:exception', () => false);
    cy.openStudyInViewer('2.25.96975534054447904995905761963464388233');
  });

  it('checks if series thumbnails are being displayed', function () {
    cy.get('[data-cy="study-browser-thumbnail-no-image"]').its('length').should('be.eq', 1);
  });

  it('performs double-click to load thumbnail in active viewport', () => {
    cy.get('[data-cy="study-browser-thumbnail-no-image"]:nth-child(1)').dblclick();

    //const expectedText = 'Ser: 3';
    //cy.get('@viewportInfoBottomLeft').should('contains.text', expectedText);
  });
});
