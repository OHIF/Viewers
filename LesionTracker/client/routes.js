import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';
import { OHIF } from 'meteor/ohif:core';

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'layout'
});

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
    except: ['entrySignIn', 'entrySignUp', 'forgotPassword', 'resetPassword', 'emailVerification']
});

Router.route('/', function() {
    Router.go('studylist', {}, { replaceState: true });
}, { name: 'home' });

Router.route('/studylist', {
    name: 'studylist',
    onBeforeAction: function() {
        const next = this.next;

        // Retrieve the timepoints data to display in studylist
        const promise = OHIF.studylist.timepointApi.retrieveTimepoints({});
        promise.then(() => next());
    },
    action: function() {
        this.render('app', { data: { template: 'studylist' } });
    }
});

Router.route('/viewer/timepoints/:timepointId', function() {
    const timepointId = this.params.timepointId;
    OHIF.viewerbase.renderViewer(this, { timepointId });
}, { name: 'viewerTimepoint' });

Router.route('/viewer/studies/:studyInstanceUids', function() {
    const studyInstanceUids = this.params.studyInstanceUids.split(';');
    OHIF.viewerbase.renderViewer(this, { studyInstanceUids });
}, { name: 'viewerStudies' });

// OHIF #98 Show specific series of study
Router.route('/study/:studyInstanceUid/series/:seriesInstanceUids', function () {
    const studyInstanceUid = this.params.studyInstanceUid;
    const seriesInstanceUids = this.params.seriesInstanceUids.split(';');
    OHIF.viewerbase.renderViewer(this, { studyInstanceUids: [studyInstanceUid], seriesInstanceUids });
}, { name: 'viewerSeries' });