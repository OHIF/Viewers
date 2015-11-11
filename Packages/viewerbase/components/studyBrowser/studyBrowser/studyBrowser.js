Template.studyBrowser.helpers({
  studies : function() {
    var studies = Session.get('studies');
      console.log(studies);
    
    var array = [];
    studies.forEach(function(study, index) {
        array.push({
            studyIndex: index,
            study: study
        });
    });
    return array;
  }
});