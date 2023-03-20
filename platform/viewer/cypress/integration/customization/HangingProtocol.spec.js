describe('OHIF HP', () => {
  const beforeSetup = () => {
    cy.checkStudyRouteInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1',
      '&hangingProtocolId=@ohif/hp-extension.mn'
    );
    cy.expectMinimumThumbnails(3);
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
  };

  it('Should display 3 up', () => {
    beforeSetup();

    cy.get('[data-cy="viewport-pane"]')
      .its('length')
      .should('be.eq', 3);
  });

  it('Should navigate next/previous stage', () => {
    beforeSetup();

    cy.get('body').type(',');
    cy.wait(250);
    cy.get('[data-cy="viewport-pane"]')
      .its('length')
      .should('be.eq', 4);

    cy.get('body').type('..');
    cy.wait(250);
    cy.get('[data-cy="viewport-pane"]')
      .its('length')
      .should('be.eq', 2);
  });

  it('Should navigate to display set specified', () => {
    cy.checkStudyRouteInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1',
      '&displaySet.SeriesInstanceUID=1.3.6.1.4.1.25403.345050719074.3824.20170125113545.4&displaySet.SOPInstanceUID=1.3.6.1.4.1.25403.345050719074.3824.20170125113558.2'
    );
    cy.expectMinimumThumbnails(3);
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();

    // The specified series/sop UID's are index 101, so ensure that image is displayed
    cy.get('@viewportInfoTopRight').should('contains.text', '101');
  });
});
