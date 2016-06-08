Session.setDefault('ViewerData', {});

// verifyEmail controls whether emailVerification template will be rendered or not
var verifyEmail = Meteor.settings && Meteor.settings.public && Meteor.settings.public.verifyEmail || false;

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
    loadingTemplate: 'lesionTrackerLayout'
});

Router.onBeforeAction('loading');

var data = {
    additionalTemplates: [
        'associationModal',
        'optionsModal',
        'serverInformationModal',
        'confirmRemoveTimepointAssociation',
        'lastLoginModal'
    ]
};

var routerOptions = {
    data: data
};

Router.route('/', function() {
    // Check user is logged in
    if (Meteor.user() && Meteor.userId()) {
        if (verifyEmail && Meteor.user().emails && !Meteor.user().emails[0].verified) {
            this.render('emailVerification', routerOptions);
        } else {
            Session.set('activeContentId', 'worklistTab');
            this.render('lesionTracker', routerOptions);
        }

    } else {
        this.render('entrySignIn', routerOptions);
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

        this.render('lesionTracker', routerOptions);
        openNewTabWithTimepoint(timepointId);
    }
});

Router.onBeforeAction(function() {
    if (!Meteor.userId() && !Meteor.loggingIn()) {
        this.render('entrySignIn');
    } else {
        this.next();
    }
}, {
    except: ['entrySignIn', 'entrySignUp', 'forgotPassword', 'resetPassword']
});
