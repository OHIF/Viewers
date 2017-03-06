import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';
import { Router } from 'meteor/iron:router';
import { OHIF } from 'meteor/ohif:core';

Session.setDefault('ViewerData', {});

// verifyEmail controls whether emailVerification template will be rendered or not
const verifyEmail = Meteor.settings && Meteor.settings.public && Meteor.settings.public.verifyEmail || false;

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'layout'
});

Router.onBeforeAction('loading');

const data = {
    additionalTemplates: [
        'viewSeriesDetailsModal'
    ]
};

const routerOptions = { data };

Router.route('/', function() {
    // Check user is logged in
    if (Meteor.user() && Meteor.userId()) {
        if (verifyEmail && Meteor.user().emails && !Meteor.user().emails[0].verified) {
            this.render('emailVerification', routerOptions);
        } else {
            const contentId = Session.get('activeContentId');
            if (!contentId) {
                Session.set('activeContentId', 'studylistTab');
            }

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
        const timepointId = this.params._id;

        this.render('app', routerOptions);
        OHIF.lesiontracker.openNewTabWithTimepoint(timepointId);
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
