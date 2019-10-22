describe('OHIFStandaloneViewer', () => {
  beforeEach(() => {
    cy.openStudyList();
  });

  it('loads route with at least 2 rows', () => {
    cy.screenshot();
    cy.percySnapshot();

    cy.get('#studyListData tr')
      .its('length')
      .should('be.gt', 2);
  });

  it('first 2 rows has values', () => {
    cy.get('#studyListData > :nth-child(1) > .patientId', {
      timeout: 15000,
    }).should('be.visible');
    cy.get('#studyListData > :nth-child(2) > .patientId', {
      timeout: 15000,
    }).should('be.visible');
  });
});
