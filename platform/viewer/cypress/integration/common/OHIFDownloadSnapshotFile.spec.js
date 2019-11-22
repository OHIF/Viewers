describe('OHIF Download Snapshot File', () => {
  before(() => {
    cy.openStudy('MISTER^MR');
    cy.waitDicomImage();
    cy.expectMinimumThumbnails(5);
  });

  beforeEach(() => {
    cy.openDownloadImageModal();
  });

  afterEach(() => {
    cy.get('[data-cy="close-button"]')
      .scrollIntoView()
      .click();
  });

  it('checks displayed information for Tablet experience', function() {
    // Set Tablet resolution
    cy.viewport(1000, 660);
    // Visual comparison
    cy.screenshot('Download Image Modal - Tablet experience');
    cy.percyCanvasSnapshot('Download Image Modal - Tablet experience');
    //Check if all elements are displayed
    cy.get('.OHIFModal')
      .as('downloadImageModal')
      .should('contain.text', 'Download High Quality Image');
    // Check input fields
    cy.get('.file-info-container')
      .should('contain.text', 'Image width (px)')
      .should('contain.text', 'Image height (px)')
      .and('contain.text', 'File name')
      .and('contain.text', 'File type')
      .and('contain.text', 'Show Annotations');
    cy.get('.file-type')
      .find('select')
      .select('png')
      .should('have.value', 'png')
      .select('jpg')
      .should('have.value', 'jpg');
    // Check image preview
    cy.get('.preview').should('contain.text', 'Image Preview');
    cy.get('[data-cy="viewport-preview-img"]')
      .should('have.attr', 'src')
      .and('include', 'data:image');
    // Check buttons
    cy.get('[data-cy="cancel-btn"]')
      .scrollIntoView()
      .should('have.text', 'Cancel');
    cy.get('[data-cy="download-btn"]')
      .scrollIntoView()
      .should('have.text', 'Download');
  });

  it('checks displayed information for Desktop experience', function() {
    // Set Desktop resolution
    cy.viewport(1750, 720);
    // Visual comparison
    cy.screenshot('Download Image Modal - Desktop experience');
    cy.percyCanvasSnapshot('Download Image Modal - Desktop experience');
    //Check if all elements are displayed
    cy.get('.OHIFModal')
      .as('downloadImageModal')
      .should('contain.text', 'Download High Quality Image');
    // Check input fields
    cy.get('.file-info-container')
      .should('contain.text', 'Image width (px)')
      .should('contain.text', 'Image height (px)')
      .and('contain.text', 'File name')
      .and('contain.text', 'File type')
      .and('contain.text', 'Show Annotations');
    cy.get('.file-type')
      .find('select')
      .select('png')
      .should('have.value', 'png')
      .select('jpg')
      .should('have.value', 'jpg');
    // Check image preview
    cy.get('.preview').should('contain.text', 'Image Preview');
    cy.get('[data-cy="viewport-preview-img"]')
      .should('have.attr', 'src')
      .and('include', 'data:image');
    // Check buttons
    cy.get('[data-cy="cancel-btn"]')
      .scrollIntoView()
      .should('have.text', 'Cancel');
    cy.get('[data-cy="download-btn"]')
      .scrollIntoView()
      .should('have.text', 'Download');
  });

  it('downloads image file', function() {
    cy.get('.width')
      .find('input')
      .clear()
      .type('300');
    cy.get('#file-name')
      .clear()
      .type('new-filename');
    cy.get('.file-type')
      .find('select')
      .select('png');

    // TO-DO: Implement a way to not trigger the button function to open the download browser dialog.
    // Suggestion of approach: https://github.com/cypress-io/cypress/issues/949
    // Once we can block the download dialog we can click on Download button.
    // cy.get('[data-cy="download-btn"]')
    //   .scrollIntoView()
    //   .click();
  });

  it('cancel changes on download modal', function() {
    //Change Image Width, Filename and File Type
    cy.get('.width')
      .find('input')
      .clear()
      .type('300');
    cy.get('#file-name')
      .clear()
      .type('new-filename');
    cy.get('.file-type')
      .find('select')
      .select('png');
    //Click on Cancel button
    cy.get('[data-cy="cancel-btn"]')
      .scrollIntoView()
      .click();
    //Check modal is closed
    cy.get('.OHIFModal').should('not.exist');
    //Open Modal
    cy.openDownloadImageModal();
    //Verify default values was restored
    cy.get('.width')
      .find('input')
      .should('have.value', '512');
    cy.get('#file-name').should('have.value', 'image');
    cy.get('.file-type')
      .find('select')
      .should('have.value', 'jpg');
  });

  // TO-DO once issue is fixed: https://github.com/OHIF/Viewers/issues/1217
  // it('checks error messages for empty fields', function() {
  //   //Clear fields Image Width and Filename
  //   cy.get('.width')
  //     .find('input')
  //     .clear();
  //   cy.get('#file-name').clear();

  //   //Click on Download button
  //   cy.get('[data-cy="download-btn"]')
  //     .scrollIntoView()
  //     .click();
  //   //Check error message
  // });

  it('checks if "Show Annotations" checkbox will display annotations', function() {
    // Close modal that is initially opened
    cy.get('[data-cy="close-button"]').click();

    // Add measurements in the viewport
    cy.addLengthMeasurement();
    cy.addAngleMeasurement();

    // Open Modal
    cy.openDownloadImageModal();
    // Select "Show Annotations" option
    cy.get('#show-annotations').check();
    // Check image preview
    cy.get('.preview').scrollIntoView();
    // Visual comparison
    cy.screenshot('Download Image Modal - Show Annotations checked');
    cy.percyCanvasSnapshot('Download Image Modal - Show Annotations checked');
    //Compare image src between Image with Annotations and without annotation
    cy.get('[data-cy="viewport-preview-img"]')
      .invoke('attr', 'src')
      .then($ImageSrcWithAnnotations => {
        // Uncheck "Show Annotations" option
        cy.get('#show-annotations').uncheck();
        //Compare if both images are diffent and have different src attribute
        cy.get('[data-cy="viewport-preview-img"]')
          .invoke('attr', 'src')
          .should('not.be.equal', $ImageSrcWithAnnotations);
      });
  });
});
