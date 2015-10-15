Router.configure({
  layoutTemplate: 'layout',
  //loadingTemplate: '',
  notFoundTemplate: 'notFound'
});



Router.route('/', function () {
    this.render('worklist', {});
});

tabs = new Meteor.Collection(null);

Router.route('/viewer/:_id', {
    layoutTemplate: 'layout',
    name: 'viewer',
    onBeforeAction: function() {
        var self = this;

        Meteor.call('GetStudyMetadata', this.params._id, function(error, study) {
            sortStudy(study);

            var studies = [study];
            var title = study.seriesList[0].instances[0].patientName;
            var contentid = generateUUID();

            var newTabObject = {
                title: title,
                contentid: contentid,
            };
            tabs.insert(newTabObject);
            Session.set('StudiesInTab#' + contentid, studies);

            self.render('worklist');
        });
    }
});