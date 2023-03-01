describe('OHIF Video Display', function() {
  beforeEach(function() {
    cy.openStudyInViewer('2.25.96975534054447904995905761963464388233');
    cy.resetViewport().wait(50);
  });

  it('checks if series thumbnails are being displayed', function() {
    cy.get('[data-cy="study-browser-thumbnail"]')
      .its('length')
      .should('be.gt', 1);
  });

  it('performs double-click to load thumbnail in active viewport', () => {
    cy.get('[data-cy="study-browser-thumbnail"]:nth-child(2)').dblclick();

    //const expectedText = 'Ser: 3';
    //cy.get('@viewportInfoBottomLeft').should('contains.text', expectedText);
  });
});
