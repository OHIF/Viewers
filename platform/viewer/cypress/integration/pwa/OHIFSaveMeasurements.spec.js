describe('OHIF Save Measurements', function() {
  before(() => {
    cy.checkStudyRouteInViewer(
      '1.2.840.113619.2.5.1762583153.215519.978957063.78'
    );
    cy.expectMinimumThumbnails(3);
  });

  beforeEach(() => {
    // Wait image to load on viewport
    cy.wait(2000);
    cy.resetViewport();
    cy.initCommonElementsAliases();
  });

  it('saves new measurement annotation', function() {
    // Add measurement in the viewport
    cy.addLengthMeasurement();

    // Verify if measurement annotation was added into the measurements panel
    cy.get('@measurementsBtn').click();
    cy.get('.measurementItem')
      .its('length')
      .should('be.at.least', 1);

    // TODO: Don't save until we're using in-memory data store
    // Save new measurement
    // cy.get('[data-cy="save-measurements-btn"]').click();

    // Verify that success message overlay is displayed
    // cy.get('.sb-success')
    //   .should('be.visible')
    //   .and('contains.text', 'Measurements saved successfully');

    // Visual test comparison
    cy.screenshot('Save Measurements - new measurement added');
    cy.percyCanvasSnapshot('Save Measurements - new measurement added');
  });

  // it('retrieves saved measurements', function() {
  //   // Add measurement in the viewport
  //   cy.addLengthMeasurement();

  //   // Verify if measurement annotation was added into the measurements panel
  //   cy.get('@measurementsBtn').click();
  //   cy.get('.measurementDisplayText') // Get label size of the recently added measurement
  //     .last()
  //     .then($measurementSizeLabel => {
  //       // Save new measurement
  //       // TODO: Do not save
  //       cy.get('[data-cy="save-measurements-btn"]')
  //         .click()
  //         .then(() => {
  //           // Verify that success message overlay is displayed
  //           cy.get('.sb-success').should('be.visible');
  //         });
  //       // Reload the page
  //       cy.reload()
  //         .wait(1000) //Wait page to load
  //         .expectMinimumThumbnails(2); //wait all thumbnails to load
  //       //  Verify that recently added measurement was retrieved
  //       cy.get('@measurementsBtn').click();
  //       cy.get('.measurementDisplayText') // Get label size of the recently added measurement
  //         .last()
  //         .then($retrivedMeasurementSizeLabel => {
  //           expect($retrivedMeasurementSizeLabel.textContent).to.eq(
  //             $measurementSizeLabel.textContent
  //           );
  //         });
  //     });
  // });

  // it('checks error message when saving without any measurement', function() {
  //   // Checks that measurement list is empty
  //   cy.get('.numberOfItems').should('have.text', '0');

  //   // Click on Save Measurement button
  //   cy.get('[data-cy="save-measurements-btn"]').click();

  //   // Verify that error message overlay is displayed
  //   cy.get('.sb-error')
  //     .should('be.visible')
  //     .and('contains.text', 'Error while saving the measurements');
  //   // Close message overlay
  //   cy.get('.sb-closeIcon').click();
  // });

  it('checks if warning message is displayed on measurements of unsupported tools', function() {
    // Add measurement for unsupported tool in the viewport
    cy.addAngleMeasurement();

    // Verify if measurement annotation was added into the measurements panel
    cy.get('@measurementsBtn').click();
    cy.get('.measurementItem')
      .its('length')
      .should('be.at.least', 1);

    // Check that warning is displayed for unsupported tool
    cy.get('.hasWarnings').should('be.visible');

    // // Save new measurement
    // cy.get('[data-cy="save-measurements-btn"]').click();

    // // Verify that error message overlay is displayed
    // cy.get('.sb-error')
    //   .should('be.visible')
    //   .and('contains.text', 'Error while saving the measurements');

    // Close Measurements panel
    cy.get('@measurementsBtn').click();
  });

  /*it('checks if measurements of unsupported tools were not saved', function() {
    // Add measurement for supported tool in the viewport
    cy.addLengthMeasurement();
    // Add measurement for unsupported tool in the viewport
    cy.addAngleMeasurement();

    // Verify if measurement annotation was added into the measurements panel
    cy.get('@measurementsBtn').click();
    cy.get('.measurementItem')
      .its('length')
      .should('be.eq', 2);

    // Check that warning is displayed for unsupported tool
    cy.get('.hasWarnings').should('be.visible');

    // Save new measurement
    cy.get('[data-cy="save-measurements-btn"]').click();

    // Verify that success message overlay is displayed
    cy.get('.sb-success')
      .should('be.visible')
      .and('contains.text', 'Measurements saved successfully');

    // Reload the page
    cy.reload()
      .wait(1000) //Wait page to load
      .expectMinimumThumbnails(2); //wait all thumbnails to load

    //Verify that measurement for unsupported tool was not saved
    cy.get('@measurementsBtn').click();
    cy.get('.measurementItem')
      .its('length')
      .should('be.eq', 1);

    // Close Measurements panel
    cy.get('@measurementsBtn').click();
  });*/
});
