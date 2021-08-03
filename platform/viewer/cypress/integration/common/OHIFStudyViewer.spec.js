describe('OHIF Study Viewer Page', function() {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.2.840.113619.2.5.1762583153.215519.978957063.78'
    );
    cy.expectMinimumThumbnails(3);
  });

  beforeEach(function() {
    cy.initCommonElementsAliases();
    cy.resetViewport().wait(50);
  });

  it('checks if series thumbnails are being displayed', function() {
    cy.get('[data-cy="thumbnail-list"]')
      .its('length')
      .should('be.gt', 1);
  });

  it('drags and drop a series thumbnail into viewport', function() {
    cy.get('[data-cy="thumbnail-list"]:nth-child(2)') //element to be dragged
      .drag('.cornerstone-canvas'); //dropzone element

    const expectedText =
      'Ser: 2Img: 1 1/13512 x 512Loc: -17.60 mm Thick: 3.00 mm';
    cy.get('@viewportInfoBottomLeft').should('contain.text', expectedText);
  });

  it('checks if Series left panel can be hidden/displayed', function() {
    cy.get('@seriesBtn').click();
    cy.get('@seriesPanel').should('not.be.enabled');

    cy.get('@seriesBtn').click();
    cy.get('@seriesPanel').should('be.visible');
  });

  it('checks if Measurements right panel can be hidden/displayed', function() {
    cy.get('@measurementsBtn').click();
    cy.get('@measurementsPanel').should('be.visible');

    cy.get('@measurementsBtn').click();
    cy.get('@measurementsPanel').should('not.be.enabled');
  });

  it('checks if measurement item can be Relabeled under Measurements panel', function() {
    cy.addLengthMeasurement(); //Adding measurement in the viewport
    cy.get('@measurementsBtn').click();
    cy.get('.measurementItem')
      .first()
      .click();

    // Click "Relabel"
    cy.get('.btnAction', { timeout: 10000 })
      .first()
      .contains('Relabel')
      .click().should('be.visible');

    // Search for "Bone"
    cy.get('.searchInput').type('Bone');

    // Select "Bone" Result
    cy.get('.treeInputs > .wrapperLabel')
      .contains('Bone')
      .click();

    // Confirm Selection
    cy.get('.checkIconWrapper').click();

    // Verify if 'Bone' label was added
    cy.get('.measurementLocation').should('contain.text', 'Bone');

    // Remove the measurement we just added
    cy.get('.btnAction')
      .last()
      .contains('Delete')
      .click()

    // Close panel
    cy.get('@measurementsBtn').click();
    cy.get('@measurementsPanel').should('not.be.enabled');
  });

  /*
  TODO: Not sure why this is failing
  it('checks if Description can be added to measurement item under Measurements panel', () => {
    cy.addLengthMeasurement(); //Adding measurement in the viewport
    cy.get('@measurementsBtn').click();
    cy.get('.measurementItem')
      .first()
      .click();

    // Click "Description"
    cy.get('.btnAction')
      .contains('Description')
      .click();

    // Enter description text
    const descriptionText = 'Adding text for description test';
    cy.get('#description').type(descriptionText);

    // Confirm
    cy.get('.btn-confirm').click();

    //Verify if descriptionText was added
    cy.get('.measurementLocation').should('contain.text', descriptionText);

    // Remove the measurement we just added
    cy.get('.btnAction')
      .last()
      .contains('Delete')
      .click()

    // Close panel
    cy.get('@measurementsBtn').click();
    cy.get('@measurementsPanel').should('not.be.enabled');
  });
   */


  it('checks if measurement item can be deleted through the context menu on the viewport', function() {
    cy.addLengthMeasurement([100, 100], [200, 100]); //Adding measurement in the viewport

    //Right click on measurement annotation
    const [x1, y1] = [150, 100];
    cy.get('@viewport')
      .trigger('mousedown', x1, y1, {
        which: 3,
      })
      .trigger('mouseup', x1, y1, {
        which: 3,
      })
      .wait(300)
      .then(() => {
        //Contextmenu is visible
        cy.get('.ToolContextMenu').should('be.visible');
      });

    //Click "Delete measurement"
    cy.get('.form-action')
      .contains('Delete measurement')
      .click();

    //Open measurements menu
    cy.get('@measurementsBtn').click();

    //Verify measurements was removed from panel
    cy.get('.measurementItem')
      .should('not.exist')
      .log('Annotation successfully removed');

    //Close panel
    cy.get('@measurementsBtn').click();
    cy.get('@measurementsPanel').should('not.be.enabled');
  });

  it('adds relabel and description to measurement item through the context menu on the viewport', function() {
    cy.addLengthMeasurement([100, 100], [200, 100]); //Adding measurement in the viewport

    // Relabel
    // Right click on measurement annotation
    const [x1, y1] = [150, 100];
    cy.get('@viewport')
      .trigger('mousedown', x1, y1, {
        which: 3,
      })
      .trigger('mouseup', x1, y1, {
        which: 3,
      });

    // Contextmenu is visible
    cy.get('.ToolContextMenu').should('be.visible');

    // Click "Relabel"
    cy.get('.form-action')
      .contains('Relabel')
      .click();

    // Search for "Brain"
    cy.get('.searchInput').type('Brain');

    // Select "Brain" Result
    cy.get('.treeInputs > .wrapperLabel')
      .contains('Brain')
      .click();

    // Confirm Selection
    cy.get('.checkIconWrapper').click();

    // Description
    // Right click on measurement annotation
    cy.get('@viewport')
      .trigger('mousedown', x1, y1, {
        which: 3,
      })
      .trigger('mouseup', x1, y1, {
        which: 3,
      });

    // Contextmenu is visible
    cy.get('.ToolContextMenu').should('be.visible');

    // Click "Description"
    cy.get('.form-action')
      .contains('Add Description')
      .click();

    // Enter description text
    const descriptionText = 'Adding text for description test';
    cy.get('#description').type(descriptionText);

    // Confirm
    cy.get('.btn-confirm').click();

    //Open measurements menu
    cy.get('@measurementsBtn').click();

    // Verify if label was added
    cy.get('.measurementLocation')
      .should('contain.text', 'Brain')
      .log('Relabel added with success');

    //Verify if descriptionText was added
    cy.get('.measurementLocation')
      .should('contain.text', descriptionText)
      .log('Description added with success');

    // Close panel
    cy.get('@measurementsBtn').click();
    cy.get('@measurementsPanel').should('not.be.enabled');
  });

  it('scrolls series stack using scrollbar', function() {
    // Workaround implemented based on Cypress issue:
    // https://github.com/cypress-io/cypress/issues/1570#issuecomment-450966053
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
      window.HTMLInputElement.prototype,
      'value'
    ).set;

    cy.get('input.imageSlider[type=range]').then($range => {
      // get the DOM node
      const range = $range[0];
      // set the value manually
      nativeInputValueSetter.call(range, 13);
      // now dispatch the event
      range.dispatchEvent(new Event('change', { value: 13, bubbles: true }));
    });

    const expectedText =
      'Ser: 2Img: 13 13/13512 x 512Loc: 18.40 mm Thick: 3.00 mm'; //'Img: 13 13/13';
    cy.get('@viewportInfoBottomLeft').should('contains.text', expectedText);
  });

  it('performs single-click to load thumbnail in active viewport', () => {
    cy.get('[data-cy="thumbnail-list"]:nth-child(3)').click();

    const expectedText = 'Ser: 3';
    cy.get('@viewportInfoBottomLeft').should('contains.text', expectedText);
  });

  it('performs right click to zoom', function() {
    //Right click on viewport
    cy.get('@viewport')
      .trigger('mousedown', 'top', { which: 3 })
      .trigger('mousemove', 'center', { which: 3 })
      .trigger('mouseup');


    const expectedText = 'Zoom: 442%';
    cy.get('@viewportInfoBottomRight').should('contains.text', expectedText);
  });

  it('performs middle click to pan', function() {
    //Get image position from cornerstone and check if y axis was modified
    let cornerstone;
    let currentPan;

    // TO DO: Replace the cornerstone pan check by Percy snapshop comparison
    cy.window()
      .its('cornerstone')
      .then(c => {
        cornerstone = c;
        currentPan = () =>
          cornerstone.getEnabledElements()[0].viewport.translation;
      });

    //pan image with middle click
    cy.get('@viewport')
      .trigger('mousedown', 'center', { which: 2 })
      .trigger('mousemove', 'bottom', { which: 2 })
      .trigger('mouseup', 'bottom')
      .then(() => {
        expect(currentPan().y > 0).to.eq(true);
      });
  });

  it('opens About modal and verify the displayed information', function() {
    cy.get('[data-cy="options-menu"]')
      .first()
      .click();
    cy.get('[data-cy="dd-item-menu"]')
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
});
