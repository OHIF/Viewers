describe('OHIF PDF Display', function () {
  beforeEach(function () {
    cy.openStudyInViewer('2.25.317377619501274872606137091638706705333');
  });

  it('checks if series thumbnails are being displayed', function () {
    cy.get('[data-cy="study-browser-thumbnail-no-image"]').its('length').should('be.gt', 0);
  });
});
