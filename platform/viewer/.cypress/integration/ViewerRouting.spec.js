describe('ViewerRouting', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.contains('Study List');
    cy.get('#studyListData > :nth-child(1) > .patientId').click();
  });

  it('thumbnails list has more than 2 items', () => {
    cy.get('.scrollable-study-thumbnails div.ThumbnailEntryContainer')
      .its('length')
      .should('be.gte', 2);
  });

  it('loads route with at least 2 thumbnails', () => {
    cy.get(
      ':nth-child(1) > .ThumbnailEntry > .p-x-1 > .ImageThumbnail > .image-thumbnail-canvas > canvas'
    ).should('be.visible');
    cy.get(
      ':nth-child(2) > .ThumbnailEntry > .p-x-1 > .ImageThumbnail > .image-thumbnail-canvas > canvas'
    ).should('be.visible');
  });
});
