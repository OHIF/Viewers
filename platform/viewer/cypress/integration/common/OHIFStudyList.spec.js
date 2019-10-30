import { createPartiallyEmittedExpression } from 'typescript';

describe('OHIF Study List', function() {
  context('Desktop resolution', function() {
    beforeEach(function() {
      cy.viewport(1750, 720);
      cy.openStudyList();
      cy.initStudyListAliasesOnDesktop();
      // run these tests as if in a desktop
    });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches Patient Name with camel case', function() {
    //   cy.get('@patientName').type('Mister');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 5);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches Patient Name with lower case', function() {
    //   cy.get('@patientName').type('fall');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 4);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches Patient Name with upper case', function() {
    //   cy.get('@patientName').type('JUNO');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 2);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches Patient Name with mixed case', function() {
    //   cy.get('@patientName').type('JuNo');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 2);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches MRN with camel case', function() {
    //   cy.get('@MRN').type('ProstateX-0000');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 2);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches MRN with lower case', function() {
    //   cy.get('@MRN').type('prostatex-0000');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 2);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches MRN with upper case', function() {
    //   cy.get('@MRN').type('PROSTATEX-0000');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 2);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches MRN with mixed case', function() {
    //   cy.get('@MRN').type('PrOsTaTeX-0000');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 2);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches Accession with camel case', function() {
    //   cy.get('@accessionNumber').type('Fpcben98890');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 2);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches Accession with lower case', function() {
    //   cy.get('@accessionNumber').type('fpcben98890');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 2);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches Accession with upper case', function() {
    //   cy.get('@accessionNumber').type('FPCBEN98890');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 2);
    // });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches Accession with mixed case', function() {
    //   cy.get('@accessionNumber').type('fPcBeN98890');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 2);
    // });

    it('searches Modality with camel case', function() {
      cy.get('@modalities').type('Mr');
      cy.wait('@getStudies.all')
        .its('response.body.length')
        .should('be.greaterThan', 1);

      return new Cypress.Promise((resolve, reject) => {
        cy.get('table > tbody > tr')
          .its('length')
          .should('be.eq', 17);
        resolve(true);
      });
    });

    it('searches Modality with lower case', function() {
      cy.get('@modalities').type('mr');
      cy.wait('@getStudies.all')
        .its('response.body.length')
        .should('be.greaterThan', 1);

      return new Cypress.Promise((resolve, reject) => {
        cy.get('table > tbody > tr')
          .its('length')
          .should('be.eq', 17);
        resolve(true);
      });
    });

    it('searches Modality with upper case', function() {
      cy.get('@modalities').type('MR');
      cy.wait('@getStudies.all')
        .its('response.body.length')
        .should('be.greaterThan', 1);

      return new Cypress.Promise((resolve, reject) => {
        cy.get('table > tbody > tr')
          .its('length')
          .should('be.eq', 17);
        resolve(true);
      });
    });

    // //TO-TO: This test should be uncommented once issue #1114 is fixed: https://github.com/OHIF/Viewers/issues/1114
    // it('searches Description with camel case', function() {
    //   cy.get('@studyDescription').type('Ct Chest');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 7);
    // });

    // it('searches Description with lower case', function() {
    //   cy.get('@studyDescription').type('ct chest');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 7);
    // });

    // it('searches Description with upper case', function() {
    //   cy.get('@studyDescription').type('CT CHEST');
    //   cy.get('@searchResult')
    //     .its('length')
    //     .should('be.eq', 7);
    // });

    it('changes rows per page and checks the study count', function() {
      //Show rows per page options
      const pageRows = [25, 50, 100];

      //Check all options of rows
      pageRows.forEach(numRows => {
        cy.get('select').select(numRows.toString()); //Select rows per page option

        cy.wait('@getStudies.all')
          .its('response.body.length')
          .should('be.greaterThan', 1);

        //Compare the search result with the Study Count on the table header
        cy.get('@studyCount')
          .should($studyCount => {
            expect(parseInt($studyCount.text())).to.be.at.most(numRows); //less than or equals to
          })
          .then($studyCount => {
            //Compare to the number of rows in the search result
            cy.get('table > tbody > tr').then($searchResult => {
              let countResults = $searchResult.length;
              expect($studyCount.text()).to.be.eq(countResults.toString());
            });
          });
      });
    });

    //TO-TO: This test should be uncommented once issue #1120 is fixed:
    //https://github.com/OHIF/Viewers/issues/1120
    // it('filter study list by Study Date', function() {
    //   //Type Start and End dates
    //   cy.get('@studyListStartDate').type('01/01/2000');
    //   cy.get('@studyListEndDate').type('01/01/2019');
    //   //Display all results into one page
    //   cy.get('select').select('100');
    //   //Checks if all expected results are displayed
    //   cy.wait('@getStudies');
    //   cy.get('table > tbody > tr')
    //     .its('length')
    //     .should('be.eq', 42);
    // });
  });
});
