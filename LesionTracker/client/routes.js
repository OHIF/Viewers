Session.setDefault('ViewerData', {});

// Re-add any tab data saved in the Session
Object.keys(ViewerData).forEach(function(contentId) {
    var tabData = ViewerData[contentId];
    var data = {
        title: tabData.title,
        contentid: tabData.contentid
    };
    WorklistTabs.insert(data);
});

Router.configure({
    layoutTemplate: 'lesionTrackerLayout',
    loadingTemplate: 'lesionTrackerLayout',
    notFoundTemplate: 'notFound'
});

Router.onBeforeAction('loading');

var data = {
    additionalTemplates: [
        'associationModal',
        'optionsModal'
    ]
};

var routerOptions = {
    data: data
};

Router.route('/', function() {
    // Check user is logged in
    if (!Meteor.user() || !Meteor.userId()) {
        this.render('entrySignIn', routerOptions);
    } else{
        this.render('worklist', routerOptions);
    }
});

Router.route('/worklist', function() {
    // Check user is logged in
    if (!Meteor.user() || !Meteor.userId()) {
        this.render('entrySignIn', routerOptions);
    } else{
        this.render('worklist', routerOptions);
    }
});

Router.route('/viewer/timepoints/:_id', {
    layoutTemplate: 'lesionTrackerLayout',
    name: 'viewer',
    onBeforeAction: function() {
        var timepointId = this.params._id;

        // Check if this study is already loaded in a tab
        // If it is, stop here so we don't keep adding tabs on hot-code reloads
        var tab = WorklistTabs.findOne({
            timepointId: timepointId
        });
        if (tab) {
            return;
        }

        this.render('worklist', routerOptions);
        openNewTabWithTimepoint(timepointId);
    }
});
