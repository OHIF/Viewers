describe('OHIF Study Viewer Page', () => {
  before(() => {
    cy.openStudy('MISTER^MR');
    cy.waitDicomImage();
  });

  beforeEach(() => {
    cy.initCommonElementsAliases();
    cy.resetViewport();
  });

  it('checks if series thumbnails are being displayed', () => {
    cy.get('.ThumbnailEntryContainer')
      .its('length')
      .should('be.gt', 1);
  });

  it('drags and drop a series thumbnail into viewport', () => {
    cy.get('.ThumbnailEntryContainer:nth-child(2)') //element to be dragged
      .drag('.cornerstone-canvas'); //dropzone element

    const expectedText =
      'Ser: 2Img: 1 1/13512 x 512Loc: -17.60 mm Thick: 3.00 mm';
    cy.get('@viewportInfoBottomLeft').should('contain.text', expectedText);
  });

  it('checks if Series left panel can be hidden/displayed', () => {
    cy.get('@seriesBtn').click();
    cy.get('@seriesPanel').should('not.be.enabled');

    cy.get('@seriesBtn').click();
    cy.get('@seriesPanel').should('be.visible');
  });

  it('checks if Measurements right panel can be hidden/displayed', () => {
    cy.get('@measurementsBtn').click();
    cy.get('@measurementsPanel').should('be.visible');

    cy.get('@measurementsBtn').click();
    cy.get('@measurementsPanel').should('not.be.enabled');
  });

  it('checks if measurement item can be Relabeled under Measurements panel', () => {
    cy.addLengthMeasurement(); //Adding measurement in the viewport
    cy.get('@measurementsBtn').click();
    cy.get('.measurementItem').click();

    // Click "Relabel"
    cy.get('.btnAction')
      .contains('Relabel')
      .click();

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
    // Close panel
    cy.get('@measurementsBtn').click();
    cy.get('@measurementsPanel').should('not.be.enabled');
  });

  //TO-DO: Test case will fail due to issue #1013: https://github.com/OHIF/Viewers/issues/1013

  // it('checks if Description can be added to measurement item under Measurements panel', () => {
  //   cy.addLengthMeasurement(); //Adding measurement in the viewport
  //   cy.get('@measurementsBtn').click();
  //   cy.get('.measurementItem').click();
  //
  //   // Click "Description"
  //   cy.get('.btnAction')
  //     .contains('Description')
  //     .click();
  //
  //   // Enter description text
  //   const descriptionText = 'Adding text for description test';
  //   cy.get('#description')
  //     .type(descriptionText);
  //
  //   // Confirm
  //   cy.get('.btn-confirm').click();
  //
  //   //Verify if descriptionText was added
  //   cy.get('.measurementLocation')
  //     .should('contain.text', descriptionText);
  // });

  it('checks if measurement item can be deleted through the context menu on the viewport', () => {
    cy.addLengthMeasurement([100, 100], [200, 100]); //Adding measurement in the viewport

    //Right click on measurement annotation
    const [x1, y1] = [150, 100];
    cy.get('@viewport')
      .trigger('mousedown', x1, y1, {
        which: 3,
      })
      .trigger('mouseup', x1, y1, {
        which: 3,
      });

    //Contextmenu is visible
    cy.get('.ToolContextMenu').should('be.visible');

    //Click "Delete measurement"
    cy.get('.form-action')
      .contains('Delete measurement')
      .click();

    //Open measurements menu
    cy.get('@measurementsBtn').click();

    //Verify measurements was removed from panel
    cy.get('.measurementItem')
      .should('not.exist')
      .log('Annotation removed with success');

    //Close panel
    cy.get('@measurementsBtn').click();
    cy.get('@measurementsPanel').should('not.be.enabled');
  });

  it('adds relabel and description to measurement item through the context menu on the viewport', () => {
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
});
