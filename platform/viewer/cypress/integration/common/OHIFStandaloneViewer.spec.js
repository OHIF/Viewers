describe('OHIFStandaloneViewer', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads route with at least 2 rows', () => {
    cy.get('[data-cy="study-list-results"] tr')
      .its('length')
      .should('be.gt', 2);

    cy.screenshot();
    cy.percySnapshot('Study List', { width: [340, 768, 1000, 1780] });
  });
});
