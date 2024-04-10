describe('OHIF Measurement Panel', function () {
  beforeEach(function () {
    cy.checkStudyRouteInViewer('1.2.840.113619.2.5.1762583153.215519.978957063.78');

    cy.expectMinimumThumbnails(3);
    cy.initCommonElementsAliases();
    cy.initCornerstoneToolsAliases();
    cy.waitDicomImage();
  });

  it('checks if Measurements right panel can be hidden/displayed', function () {
    cy.get('@measurementsPanel').should('exist');
    cy.get('@measurementsPanel').should('be.visible');

    cy.get('@RightCollapseBtn').click();
    cy.get('@measurementsPanel').should('not.exist');

    cy.get('@RightCollapseBtn').click();
    cy.get('@measurementsPanel').should('exist');
    cy.get('@measurementsPanel').should('be.visible');
  });

  it('checks if measurement item can be Relabeled under Measurements panel', function () {
    // Add length measurement
    cy.addLengthMeasurement();

    cy.get('[data-cy="viewport-notification"]').as('viewportNotification').should('exist');
    cy.get('[data-cy="viewport-notification"]').as('viewportNotification').should('be.visible');

    cy.get('[data-cy="prompt-begin-tracking-yes-btn"]').as('yesBtn').click();

    cy.get('[data-cy="measurement-item"]').as('measurementItem').click();

    cy.get('[data-cy="measurement-item"]').find('svg').eq(0).as('measurementItemSvg').click();

    // enter Bone label
    cy.get('[data-cy="input-annotation"]').should('exist');
    cy.get('[data-cy="input-annotation"]').should('be.visible');
    cy.get('[data-cy="input-annotation"]').type('Bone{enter}');

    cy.get('[data-cy="measurement-item"]').as('measurementItem').should('contain.text', 'Bone');
  });

  it('checks if image would jump when clicked on a measurement item', function () {
    // Add length measurement
    cy.addLengthMeasurement().wait(250);
    cy.get('[data-cy="prompt-begin-tracking-yes-btn"]').as('yesBtn').click();

    cy.scrollToIndex(13);

    // Reset to default tool so that the new add length works
    cy.addLengthMeasurement([100, 100], [200, 200]); //Adding measurement in the viewport

    cy.get('@viewportInfoBottomRight').should('contains.text', '(14/');

    // Click on first measurement item
    cy.get('[data-cy="measurement-item"]').eq(0).click();

    cy.get('@viewportInfoBottomRight').should('contains.text', '(1/');
    cy.get('@viewportInfoBottomRight').should('not.contains.text', '(14/');
  });

  /*
  TODO: Not sure why this is failing
  it('checks if Description can be added to measurement item under Measurements panel', () => {
    cy.addLengthMeasurement(); //Adding measurement in the viewport
    cy.get('@measurementsBtn').click();
    cy.get('.measurementItem').click();

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

  /*it('checks if measurement item can be deleted through the context menu on the viewport', function() {
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
    cy.get('@measurementsPanel').should('not.exist');
  });*/

  /*it('adds relabel and description to measurement item through the context menu on the viewport', function() {
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
    cy.get('@measurementsPanel').should('not.exist');
  });*/
});
