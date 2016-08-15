Session.setDefault('ViewerData', {});

// verifyEmail controls whether emailVerification template will be rendered or not
var verifyEmail = Meteor.settings && Meteor.settings.public && Meteor.settings.public.verifyEmail || false;

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'layout'
});

Router.onBeforeAction('loading');

var data = {
    additionalTemplates: [
        'associationModal',
        'optionsModal',
        'serverInformationModal',
        'confirmRemoveTimepointAssociation',
        'lastLoginModal',
        'viewSeriesDetailsModal'
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
            Session.set('activeContentId', 'studylistTab');
            this.render('app', routerOptions);
        }

    } else {
        this.render('entrySignIn', routerOptions);
    }
});

Router.route('/viewer/timepoints/:_id', {
    layoutTemplate: 'layout',
    name: 'viewer',
    onBeforeAction: function() {
        var timepointId = this.params._id;

        this.render('app', routerOptions);
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
