import '@percy/cypress';

describe('OHIF Percy Segmentation Tools', () => {
  beforeEach(() => {
    cy.openStudyInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1',
      '',
      '/segmentation'
    );
    cy.wait(5000);
    cy.expectMinimumThumbnails(3);
  });

  it('should be able to use all segmentation tools and have them render correctly', () => {
    cy.get('[data-cy="study-browser-thumbnail"]').eq(1).dblclick();
    cy.percySnapshot('Segmentation tools are disabled');
    cy.get('span').contains('Add segmentation').click();
    cy.percySnapshot(
      'Segmentation tools are still disabled because no segmentation is added on non-reconstructable series'
    );
    cy.get('[data-cy="study-browser-thumbnail"]').eq(2).dblclick();
    cy.get('span').contains('Add segmentation').click();
    cy.percySnapshot('Segmentation tools are enabled');
  });
});
