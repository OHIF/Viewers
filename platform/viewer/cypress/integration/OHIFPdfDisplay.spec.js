describe('OHIF PDF Display', function () {
  before(() => {
    cy.openStudyInViewer(
      '2.25.317377619501274872606137091638706705333'
    );
  });

  beforeEach(function () {
    cy.resetViewport().wait(50);
  });

  it('checks if series thumbnails are being displayed', function () {
    cy.get('[data-cy="study-browser-thumbnail"]')
      .its('length')
      .should('be.gt', 0);
  });

});
