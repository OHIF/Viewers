describe('OHIF Double Click', () => {
  beforeEach(() => {
    cy.checkStudyRouteInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1',
      '&hangingProtocolId=@ohif/mnGrid'
    );
    cy.expectMinimumThumbnails(3);
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
  });

  it('Should double click each viewport to one up and back', () => {
    const numExpectedViewports = 3;
    cy.get('[data-cy="viewport-pane"]').its('length').should('be.eq', numExpectedViewports);

    for (let i = 0; i < numExpectedViewports; i += 1) {
      cy.wait(2000);

      // For whatever reason, with Cypress tests, we have to activate the
      // viewport we are double clicking first.
      cy.get('[data-cy="viewport-pane"]')
        .eq(i)
        .trigger('mousedown', 'center', {
          force: true,
        })
        .trigger('mouseup', 'center', {
          force: true,
        });

      // Wait for the viewport to be 'active'.
      // TODO Is there a better way to do this?
      cy.get('[data-cy="viewport-pane"]')
        .eq(i)
        .parent()
        .find('[data-cy="viewport-pane"]')
        .not('.pointer-events-none');

      // The actual double click.
      cy.get('[data-cy="viewport-pane"]').eq(i).trigger('dblclick', 'center');

      cy.get('[data-cy="viewport-pane"]').its('length').should('be.eq', 1);

      cy.get('[data-cy="viewport-pane"]')
        .trigger('mousedown', 'center', {
          force: true,
        })
        .trigger('mouseup', 'center', {
          force: true,
        });

      cy.get('[data-cy="viewport-pane"]').eq(0).trigger('dblclick', 'center');
    }
  });
});
