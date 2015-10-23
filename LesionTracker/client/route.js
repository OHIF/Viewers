Router.configure({
    layoutTemplate: 'layoutLesionTracker',
    //loadingTemplate: '',
    notFoundTemplate: 'notFound'
});

Router.route('/', function () {
    this.render('worklist', {});
});

tabs = new Meteor.Collection(null);
Session.setDefault('ViewerData', {});
Session.setDefault('ViewerDataUpdated', Random.id());

Object.keys(ViewerData).forEach(function(contentId) {
    var tabData = ViewerData[contentId];
    var data = {
        title: tabData.title,
        contentid: tabData.contentId,
    };
    tabs.insert(data);
});


Router.route('/viewer/:_id', {
    layoutTemplate: 'layout',
    name: 'viewer',
    onBeforeAction: function() {
        var self = this;

        Meteor.call('GetStudyMetadata', this.params._id, function(error, study) {
            sortStudy(study);

            var title = study.seriesList[0].instances[0].patientName;
            var contentid = generateUUID();

            var data = {
                title: title,
                contentid: contentid,
            };
            tabs.insert(data);

            data.studies = [study];

            self.render('worklist');
            Session.set('OpenNewTabEvent', data);
        });
    }
});