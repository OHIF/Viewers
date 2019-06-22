describe('OHIFStandaloneViewer', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('loads route with at least 2 rows', () => {
    cy.get('#studyListData tr')
      .its('length')
      .should('be.gt', 2);
  });

  it('first 2 rows has values', () => {
    cy.get('#studyListData > :nth-child(1) > .patientId').should('be.visible');
    cy.get('#studyListData > :nth-child(2) > .patientId').should('be.visible');
  });
});
