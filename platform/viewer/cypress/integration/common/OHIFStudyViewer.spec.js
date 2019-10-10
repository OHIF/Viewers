describe('OHIF Study Viewer Page', () => {
  before(() => {
    cy.openStudy('MISTER^MR');
    cy.waitSeriesMetadata();
  });

  beforeEach(() => {
    cy.initCommonElementsAliases();
    //Following best practices, reset should be done before each test
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

    //Verify if 'Bone' label was added
    cy.get('.measurementLocation').should('contain.text', 'Bone');
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
});
