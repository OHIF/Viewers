describe('OHIF Download Snapshot File', () => {
  beforeEach(() => {
    cy.checkStudyRouteInViewer('1.2.840.113619.2.5.1762583153.215519.978957063.78');
    cy.expectMinimumThumbnails(3);
    cy.openDownloadImageModal();
  });

  it('checks displayed information for Desktop experience', function () {
    // Set Desktop resolution
    // cy.viewport(1750, 720);
    // Visual comparison
    // cy.screenshot('Download Image Modal - Desktop experience');
    //Check if all elements are displayed

    // TODO: need to add this attribute to the modal
    cy.get('[data-cy=modal-header]')
      .as('downloadImageModal')
      .should('contain.text', 'Download High Quality Image');

    // Check input fields
    // TODO: select2
    // cy.get('[data-cy="file-type"]')
    //   .select('png')
    //   .should('have.value', 'png')
    //   .select('jpg')
    //   .should('have.value', 'jpg');

    // Check image preview
    cy.get('[data-cy="image-preview"]').should('contain.text', 'Image preview');

    //TODO: This is a canvas now, not an img with src
    // cy.get('[data-cy="viewport-preview-img"]')
    //   .should('have.attr', 'src')
    //   .and('include', 'data:image');

    // Check buttons
    cy.get('[data-cy="cancel-btn"]').scrollIntoView().should('be.visible');
    cy.get('[data-cy="download-btn"]').scrollIntoView().should('be.visible');

    cy.get('[data-cy="cancel-btn"]').click();
  });

  /*it('cancel changes on download modal', function() {
    //Change Image Width, Filename and File Type
    cy.get('[data-cy="image-width"]')
      .clear()
      .type('300');
    cy.get('[data-cy="image-height"]') //Image Height should be the same as width
      .should('have.value', '300');
    cy.get('[data-cy="file-name"]')
      .clear()
      .type('new-filename');
    cy.get('[data-cy="file-type"]').select('png');
    //Click on Cancel button
    cy.get('[data-cy="cancel-btn"]')
      .scrollIntoView()
      .click();
    //Check modal is closed
    cy.get('[data-cy="modal"]').should('not.exist');
    //Open Modal
    cy.openDownloadImageModal();
    //Verify default values was restored
    cy.get('[data-cy="image-width"]').should('have.value', '512');
    cy.get('[data-cy="file-name"]').should('have.value', 'image');
    cy.get('[data-cy=file-type]').should('have.value', 'jpg');
  });*/

  // TO-DO once issue is fixed: https://github.com/OHIF/Viewers/issues/1217
  // it('checks error messages for empty fields', function() {
  //   //Clear fields Image Width and Filename
  //   cy.get('[data-cy="image-width"]').clear();
  //   cy.get('[data-cy="file-name"]').clear();

  //   //Click on Download button
  //   cy.get('[data-cy="download-btn"]')
  //     .scrollIntoView()
  //     .click();
  //   //Check error message
  // });

  /*it('checks if "Show Annotations" checkbox will display annotations', function() {
    // Close modal that is initially opened
    cy.get('[data-cy="close-button"]').click();

    // Add measurements in the viewport
    cy.addLengthMeasurement();
    cy.addAngleMeasurement();

    // Open Modal
    cy.openDownloadImageModal();
    // Select "Show Annotations" option
    cy.get('[data-cy="show-annotations"]').check();
    // Check image preview
    cy.get('[data-cy="image-preview"]').scrollIntoView();
    //Compare classes that exists on Image Preview with Annotations and Without Annotation
    cy.get('[data-cy="modal-content"]')
      .find('canvas')
      .should('have.class', 'magnifyTool'); //Class "MagnifyTool" exists with annotations displayed on Image preview
    // Uncheck "Show Annotations" option
    cy.get('[data-cy="show-annotations"]')
      .uncheck()
      .wait(300);
    // Check that class "MagnifyTool" should not exist
    cy.get('[data-cy="modal-content"]')
      .find('canvas')
      .should('not.have.class', 'magnifyTool');
  });*/
});
