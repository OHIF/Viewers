describe('OHIF Load Local PDF File', () => {
  beforeEach(() => {
    cy.visit('/local');
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
});
