/*
Temporarily disabling as we transition to containerized PACS for E2E tests

describe('OHIF HTML Extension', () => {
  before(() => {
    cy.openStudyInViewer(
      '1.2.826.0.13854362241694438965858641723883466450351448'
    );
    cy.expectMinimumThumbnails(3);
  });

  // TODO -> Commented these out until we get a seperate temporary PACS running on the CI.
  // As pointing these tests at a public PACS with public STOW functionality means this always breaks.

  it('checks if series thumbnails are being displayed', () => {
    cy.get('[data-cy="thumbnail-list"]')
      .contains('SR')
      .its('length')
      .should('to.be.at.least', 1);
  });

  // it('drags and drop a SR thumbnail into viewport', () => {
  //   cy.get('[data-cy="thumbnail-list"]')
  //     .contains('SR')
  //     .first()
  //     .drag('.viewport-drop-target');

  //   cy.get(':nth-child(2) > h1').should(
  //     'contain.text',
  //     'Imaging Measurement Report'
  //   );
  // });

  // it('checks if the HTML viewport has been set to active by interaction', () => {
  //   cy.setLayout('3', '3');

  //   // check if viewport has been set as active by CLICKING
  //   cy.get('[data-cy=viewprt-grid] > :nth-child(4)')
  //     .click()
  //     .then($viewport => {
  //       cy.wrap($viewport).should('have.class', 'active');
  //     });

  //   // check if viewport has been set as active by SCROLLING
  //   cy.get('[data-cy=viewprt-grid] > :nth-child(7)').then($viewport => {
  //     cy.wrap($viewport)
  //       .find('[data-cy=dicom-html-viewport]')
  //       .scrollTo('bottom');
  //     cy.wrap($viewport).should('have.class', 'active');
  //   });

  //   cy.setLayout('1', '1');
  // });
});

// describe('OHIF PDF Extension', () => {
//   before(() => {
//     cy.checkStudyRouteInViewer(
//       '1.2.826.0.13854362241694438965858641723883466450351448'
//     );
//     cy.expectMinimumThumbnails(5);
//   });

//   it('checks if series thumbnails are being displayed', () => {
//     cy.get('[data-cy="thumbnail-list"]')
//       .contains('DOC')
//       .its('length')
//       .should('to.be.at.least', 1);
//   });

//   it('drags and drop a PDF thumbnail into viewport', () => {
//     cy.get('[data-cy="thumbnail-list"]')
//       .contains('DOC')
//       .scrollIntoView()
//       .drag('.viewport-drop-target');

//     cy.get('.DicomPDFViewport')
//       .its('length')
//       .should('to.be.at.least', 1);

//     //Take Screenshot
//     cy.screenshot('PDF Extension - Should load PDF file');
//   });
// });
 */
