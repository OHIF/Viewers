import { Router } from 'meteor/iron:router';
import { OHIF } from 'meteor/ohif:core';
import {Meteor} from "meteor/meteor";
import {Accounts} from "meteor/accounts-base";

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading'
});

// If we are running a disconnected client similar to the StandaloneViewer
// (see https://docs.ohif.org/standalone-viewer/usage.html) we don't want
// our routes to get stuck while waiting for Pub / Sub.
//
// In this case, the developer is required to add Servers and specify
// a CurrentServer with some other approach (e.g. a separate script).
if (Meteor.settings &&
    Meteor.settings.public &&
    Meteor.settings.public.clientOnly !== true) {
    Router.waitOn(function() {
        return [
            Meteor.subscribe('servers'),
            Meteor.subscribe('currentServer')
        ];
    });
}

Router.onBeforeAction('loading');

Router.onBeforeAction(function() {
    // verifyEmail controls whether emailVerification template will be rendered or not
    const publicSettings = Meteor.settings && Meteor.settings.public;
    const verifyEmail = publicSettings && publicSettings.verifyEmail || false;

    // Check if user is signed in or needs an email verification
    if (!Meteor.userId() && !Meteor.loggingIn()) {
        this.render('entrySignIn');
    } else if (verifyEmail && Meteor.user().emails && !Meteor.user().emails[0].verified) {
        this.render('emailVerification');
    } else {
        this.next();
    }
}, {
    except: ['entrySignIn', 'entrySignUp', 'forgotPassword', 'resetPassword', 'emailVerification', 'verifyEmail']
});

Router.route('/', function() {
    Router.go('studylist', {}, { replaceState: true });
}, { name: 'home' });

Router.route( '/verify-email/:token', {
    name: 'verifyEmail',
    action() {
        Accounts.verifyEmail( this.params.token, ( error ) =>{
            if ( error ) {
                ActiveEntry.errorMessages.set('validationEmailError', error.message);
                return;
            } else {
                this.render('entrySignIn');
            }
        });
    }
});


Router.route('/studylist', {
    action: function () {
        this.render('ohifViewer', { data: { template: 'studylist' } });
    },
    onBeforeAction: function() {
        const next = this.next;

        // Retrieve the timepoints data to display in studylist
        const promise = OHIF.studylist.timepointApi.retrieveTimepoints({});
        promise.then(() => next());
    },
    name: 'studylist'
});

Router.route('/viewer/timepoints/:timepointId', function() {
    const timepointId = this.params.timepointId;
    OHIF.viewerbase.renderViewer(this, { timepointId }, 'ohifViewer');
}, { name: 'viewerTimepoint' });

Router.route('/viewer/:studyInstanceUids', function() {
    const studyInstanceUids = this.params.studyInstanceUids.split(';');
    OHIF.viewerbase.renderViewer(this, { studyInstanceUids }, 'ohifViewer');
}, { name: 'viewerStudies' });

// OHIF #98 Show specific series of study
Router.route('/study/:studyInstanceUid/series/:seriesInstanceUids', function () {
    const studyInstanceUid = this.params.studyInstanceUid;
    const seriesInstanceUids = this.params.seriesInstanceUids.split(';');
    OHIF.viewerbase.renderViewer(this, { studyInstanceUids: [studyInstanceUid], seriesInstanceUids }, 'ohifViewer');
}, { name: 'viewerSeries' });
