//We excluded the tests for '**/studies/**' because the bulk/all of our other study/viewer tests use this route

describe('Visual Regression - OHIF Routes', function() {
  beforeEach(function() {
    cy.openStudyList();
  });

  it('checks PT/CT json url study route', function() {
    cy.visit(
      '/viewer?url=https://s3.eu-central-1.amazonaws.com/ohif-viewer/JSON/PTCTStudy.json'
    );

    cy.server();
    cy.route('GET', '**/PTCTStudy/**').as('getPTCTStudy');

    cy.wait('@getPTCTStudy.all');
    cy.get('@getPTCTStudy').should($route => {
      expect($route.status).to.be.eq(200);
    });

    cy.percyCanvasSnapshot('PT/CT json study route');
  });
});
