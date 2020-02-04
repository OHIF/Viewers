describe('OHIF Load Local File', () => {
  beforeEach(() => {
    cy.visit('/local');
  });

  it('checks if user can navigate to /local', () => {
    cy.get('.drag-drop-contents').should(
      'contain',
      'Drag and Drop DICOM files here to load them in the Viewer'
    );
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
