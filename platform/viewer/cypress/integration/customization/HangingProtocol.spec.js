describe('OHIF HP', () => {
  beforeEach(() => {
    cy.checkStudyRouteInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1',
      '&hangingProtocolId=@ohif/hp-extension.mn'
    );
    cy.expectMinimumThumbnails(3);
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
  });

  it('Should display 3 up', () => {
    cy.get('[data-cy="viewport-pane"]')
      .its('length')
      .should('be.eq', 3);
  });

  it('Should navigate next/previous stage', () => {
    cy.get('body').type('{ctrl+home}');
    cy.wait(250);
    cy.get('[data-cy="viewport-pane"]')
      .its('length')
      .should('be.eq', 4);

    cy.get('body').type('{ctrl+end}{ctrl+end}');
    cy.wait(250);
    cy.get('[data-cy="viewport-pane"]')
      .its('length')
      .should('be.eq', 2);
  });
});
