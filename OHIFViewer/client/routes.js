import { Meteor } from "meteor/meteor";
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

Router.configure({
    layoutTemplate: 'layout',
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

Router.route('/', function() {
    Router.go('studylist', {}, { replaceState: true });
}, { name: 'home' });

Router.route('/studylist', function() {
    this.render('ohifViewer', { data: { template: 'studylist' } });
}, { name: 'studylist' });

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

Router.route('/IHEInvokeImageDisplay', function() {
    const requestType = this.params.query.requestType;

    if (requestType === "STUDY") {
        const studyInstanceUids = this.params.query.studyUID.split(';');

        OHIF.viewerbase.renderViewer(this, {studyInstanceUids}, 'ohifViewer');
    } else if (requestType === "STUDYBASE64") {
        const uids = this.params.query.studyUID;
        const decodedData = window.atob(uids);
        const studyInstanceUids = decodedData.split(';');

        OHIF.viewerbase.renderViewer(this, {studyInstanceUids}, 'ohifViewer');
    } else if (requestType === "PATIENT") {
        const patientUids = this.params.query.patientID.split(';');

        Router.go('studylist', {}, {replaceState: true});
    } else {
        Router.go('studylist', {}, {replaceState: true});
    }
});
