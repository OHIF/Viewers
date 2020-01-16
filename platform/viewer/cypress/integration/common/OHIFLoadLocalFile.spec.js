describe('OHIF Cornerstone Hotkeys', () => {
  beforeEach(() => {
    cy.visit('/local');
  });

  it('checks if user can navigate to /local', () => {
    cy.get('.drag-drop-contents').should(
      'contain',
      'Drag and Drop DICOM files here to load them in the Viewer'
    );
  });

  it('loads a PDF DICOM file and visualize it', () => {
    const fileName = 'PDFDICOMfile.pdf';

    cy.fixture(fileName).then(fileContent => {
      cy.get('input[type=file]')
        .first()
        .upload({
          fileContent,
          fileName,
          mimeType: 'application/pdf',
        });
    });

    //Verify if 1 thumbnail is visible
    cy.expectMinimumThumbnails(1);
    //Verify if DOC thumnails is displayed and load it on viewport
    cy.get('[data-cy="thumbnail-list"]')
      .contains('DOC')
      .click({ force: true });

    //Verify if PDF document is displayed on the viewport
    cy.get('#pdf-canvas-container').should('be.visible');
  });

  it('loads an invalid file and verify if viewer is empty', () => {
    const fileName = 'example.json';

    cy.fixture(fileName).then(fileContent => {
      cy.get('input[type=file]')
        .first()
        .upload({
          fileContent,
          fileName,
          mimeType: 'application/json',
        });
    });

    //Verify if there is no thumbnail visible
    cy.expectMinimumThumbnails(0);
    //Verify if DOC thumnails is displayed and load it on viewport
    cy.get('[data-cy="thumbnail-list"]').should('not.exist');
  });
});
