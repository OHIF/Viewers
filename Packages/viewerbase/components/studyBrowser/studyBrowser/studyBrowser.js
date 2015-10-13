Template.studyBrowser.helpers({
  studies : function() {
    var studies = Session.get('studies');
    return studies;
  }
});