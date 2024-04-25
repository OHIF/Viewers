import '@percy/cypress';

describe('OHIF Percy MPR Display', () => {
  beforeEach(() => {
    cy.openStudyInViewer('1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1');
    cy.wait(5000);
    cy.expectMinimumThumbnails(3);
  });

  it('should display MPR correctly', () => {
    cy.get('[data-cy="study-browser-thumbnail"]').eq(2).dblclick();
    cy.wait(200);
    cy.percySnapshot('MPR Series loaded');
    cy.get('[data-cy="Layout"]').click();
    cy.wait(200);
    cy.percySnapshot('Layout tool opened');
    cy.get('div').contains('MPR').click();
    cy.wait(2000);
    cy.percySnapshot('MPR Display');
  });
});
