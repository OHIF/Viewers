describe('OHIF HP', () => {
  beforeEach(() => {
    cy.checkStudyRouteInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1',
      '&hangingProtocolId=@ohif/mnGrid'
    );
    cy.expectMinimumThumbnails(3);
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
    cy.waitDicomImage();
  });

  it('Should display 3 up', () => {
    cy.get('[data-cy="viewport-pane"]').its('length').should('be.eq', 4);
  });

  it('Should navigate next/previous stage', () => {
    cy.get('body').type(',');
    cy.wait(250);
    cy.get('[data-cy="viewport-pane"]').its('length').should('be.eq', 4);

    cy.get('body').type('..');
    cy.wait(250);
    cy.get('[data-cy="viewport-pane"]').its('length').should('be.eq', 2);
  });

  it('Should navigate to display set specified', () => {
    Cypress.on('uncaught:exception', () => false);
    // This filters by series instance UID, meaning there will only be 1 thumbnail
    // It applies the initial SOP instance, navigating to that image
    cy.checkStudyRouteInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1',
      '&SeriesInstanceUID=1.3.6.1.4.1.25403.345050719074.3824.20170125113545.4&initialSopInstanceUID=1.3.6.1.4.1.25403.345050719074.3824.20170125113546.1'
    );
    cy.expectMinimumThumbnails(1);
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();

    // The specified series/sop UID's are index 101, so ensure that image is displayed
    cy.get('@viewportInfoBottomRight').should('contains.text', 'I:6');
  });
});
