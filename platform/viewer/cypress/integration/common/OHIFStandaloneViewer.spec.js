describe('OHIFStandaloneViewer', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads route with at least 2 rows', () => {
    cy.screenshot();
    cy.percySnapshot();

    cy.get('[data-cy="study-list-results"] tr')
      .its('length')
      .should('be.gt', 2);
  });

  it('first 2 rows has values', () => {
    cy.get(
      '[data-cy="study-list-results"] > :nth-child(1) > .patientId'
    ).should('be.visible');
    cy.get(
      '[data-cy="study-list-results"] > :nth-child(2) > .patientId'
    ).should('be.visible');
  });
});
