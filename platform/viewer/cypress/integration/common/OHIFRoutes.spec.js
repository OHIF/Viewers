// type definitions for Cypress object "cy"
/// <reference types="cypress" />

describe('OHIF Routes', function() {
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
  });

  it('checks studies route', function() {
    cy.openStudy('MISTER^MR');

    cy.server();
    cy.route('GET', '**/studies/**').as('getStudies');
    cy.route('GET', '**/studies/**/series').as('getSeries');
    cy.route('GET', '**/studies/**/series/**/metadata').as('getMetadata');
    cy.route('GET', '**/studies/**/series/**/instances/**/frames/1').as(
      'getFrames'
    );

    cy.wait(['@getStudies', '@getSeries', '@getMetadata', '@getFrames']).spread(
      (getStudies, getSeries, getMetadata, getFrames) => {
        expect(getStudies.status).to.be.eq(200);
        expect(getSeries.status).to.be.eq(200);
        expect(getMetadata.status).to.be.eq(200);
        expect(getFrames.status).to.be.eq(200);
      }
    );
  });
});
