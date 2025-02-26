describe('OHIF General Viewer', function () {
  beforeEach(() =>
    cy.initViewer('1.2.840.113619.2.5.1762583153.215519.978957063.78', {
      minimumThumbnails: 3,
    })
  );

  it('scrolls series stack using scrollbar', function () {
    cy.scrollToIndex(13);

    cy.get('@viewportInfoBottomRight').should('contains.text', '14');
  });

  it('performs right click to zoom', function () {
    // This is not used to activate the tool, it is used to ensure the
    // top left viewport info shows the zoom values (it only shows up
    // when the zoom tool is active)
    cy.get('@zoomBtn')
      .click()
      .then($zoomBtn => {
        cy.wrap($zoomBtn).should('have.class', 'bg-primary-light');
      });

    const zoomLevelInitial = cy.get('@viewportInfoTopLeft').then($viewportInfo => {
      return $viewportInfo.text().substring(6, 9);
    });

    //Right click on viewport
    cy.get('@viewport')
      .trigger('mousedown', 'top', { buttons: 2 })
      .trigger('mousemove', 'center', { buttons: 2 })
      .trigger('mouseup');

    // make sure the new zoom level is less than the initial
    cy.get('@viewportInfoBottomLeft').then($viewportInfo => {
      const zoomLevelFinal = $viewportInfo.text().substring(6, 9);
      expect(zoomLevelFinal < zoomLevelInitial).to.eq(true);
    });
  });

  /*it('performs middle click to pan', function() {
    //Get image position from cornerstone and check if y axis was modified
    let cornerstone;
    let currentPan;

    // TO DO: Replace the cornerstone pan check by Percy snapshot comparison
    cy.window()
      .its('cornerstone')
      .then(c => {
        cornerstone = c;
        currentPan = () =>
          cornerstone.getEnabledElements()[0].viewport.translation;
      });

    //pan image with middle click
    cy.get('@viewport')
      .trigger('mousedown', 'center', { buttons: 3 })
      .trigger('mousemove', 'bottom', { buttons: 3 })
      .trigger('mouseup', 'bottom')
      .then(() => {
        expect(currentPan().y > 0).to.eq(true);
      });
  });*/

  /*it('opens About modal and verify the displayed information', function() {
    cy.get('[data-cy="options-dropdown"]')
      .first()
      .click();
    cy.get('[data-cy="about-modal"]')
      .as('aboutOverlay')
      .should('be.visible');

    //check buttons and links
    cy.get('[data-cy="about-modal"]')
      .should('contains.text', 'Visit the forum')
      .and('contains.text', 'Report an issue')
      .and('contains.text', 'https://github.com/OHIF/Viewers/');

    //check version number
    cy.get('[data-cy="about-modal"]').then($modal => {
      cy.get('[data-cy="header-version-info"]').should($headerVersionNumber => {
        $headerVersionNumber = $headerVersionNumber.text().substring(1);
        expect($modal).to.contain($headerVersionNumber);
      });
    });

    //close modal
    cy.get('[data-cy="close-button"]').click();
    cy.get('@aboutOverlay').should('not.exist');
  });
  */
});
