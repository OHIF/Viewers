describe('OHIFStandaloneViewer', () => {
  beforeEach(() => {
    cy.openStudyList();
  });

  it('loads route with at least 2 rows', () => {
    cy.screenshot();
    cy.percyCanvasSnapshot('Study List');

    cy.get('[data-cy="study-list-results"] tr')
      .its('length')
      .should('be.gt', 2);
  });
});
