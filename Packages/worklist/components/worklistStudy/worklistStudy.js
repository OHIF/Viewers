Template.worklistStudy.events({
    'click': function (){
        Router.go('viewer', {_id: this.studyInstanceUid});
    }
});