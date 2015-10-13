Router.configure({
  layoutTemplate: 'layout',
  //loadingTemplate: '',
  notFoundTemplate: 'notFound'
});



Router.route('/', function () {
  this.render('worklist', {
  });
});

ViewerStudies = new Mongo.Collection(null);

Router.route('/viewer/:_id', {
  layoutTemplate: 'layout',
  name: 'viewer',
  onBeforeAction: function() {
    var self = this;
    Meteor.call('GetStudyMetadata', this.params._id, function(error, study) {
      //console.log(study);
      sortStudy(study);

      var studies = [study];
      Session.set('studies', studies);

      self.render('viewer');
    });
  }
});


