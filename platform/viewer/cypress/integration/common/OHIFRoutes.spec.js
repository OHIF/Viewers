//We excluded the tests for '**/studies/**' because the bulk/all of our other study/viewer tests use this route

describe('OHIF Routes', function() {
  beforeEach(function() {
    cy.openStudyList();
  });

  it('checks PT/CT json url study route', function() {
    cy.fixture('./../fixtures/PTCTStudy.json').as('PTCTStudyJSON');

    cy.visit('/');
    cy.request('viewer?url=PTCTStudyJSON');

    cy.server();
    cy.route('GET', '**/PTCTStudy/**').as('getPTCTStudy');

    cy.wait('@getPTCTStudy.all');
    cy.get('@getPTCTStudy').should($route => {
      expect($route.status).to.be.eq(200);
    });

    cy.screenshot();
    cy.percyCanvasSnapshot('PT/CT json study route');
  });
});
