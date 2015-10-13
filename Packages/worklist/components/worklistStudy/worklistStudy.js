Template.worklistStudy.events({
    'click': function (){
        Router.go('viewer', {_id: this.studyInstanceUid});

        Session.set('openNewTabEvent', self);
        var studyInstanceUid = this.studyInstanceUid;
        Meteor.call('GetStudyMetadata', studyInstanceUid, function(error, study) {
          //console.log(study);
          sortStudy(study);

          var studies = [study];
          Session.set('studies', studies);
          Session.set(activeTabId, studies);
          Session.set('showContentInTab', true);
          self.render('viewer');
        });
    }
});