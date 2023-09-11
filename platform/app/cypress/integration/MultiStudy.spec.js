describe('OHIF Multi Study', () => {
  const beforeSetup = () => {
    cy.checkStudyRouteInViewer(
      '1.3.6.1.4.1.25403.345050719074.3824.20170125113417.1,1.2.840.113619.2.5.1762583153.215519.978957063.78',
      '&hangingProtocolId=@ohif/hpCompare'
    );
    cy.expectMinimumThumbnails(4);
    cy.initCornerstoneToolsAliases();
    cy.initCommonElementsAliases();
  };

  it('Should display 2 comparison up', () => {
    beforeSetup();

    cy.get('[data-cy="viewport-pane"]').its('length').should('be.eq', 4);
    cy.get('[data-cy="studyDate"]').should(studyDate => {
      expect(studyDate.length).to.be.eq(4);
      expect(studyDate.text()).to.contain('2014').contain('2001');
      expect(studyDate.text().indexOf('2014')).to.be.lessThan(studyDate.text().indexOf('2001'));
    });
  });
});
