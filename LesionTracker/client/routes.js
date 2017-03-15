import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';
import { OHIF } from 'meteor/ohif:core';

// TODO: remove the line below
window.Router = Router;

// verifyEmail controls whether emailVerification template will be rendered or not
const verifyEmail = Meteor.settings && Meteor.settings.public && Meteor.settings.public.verifyEmail || false;

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'layout'
});

Router.onBeforeAction('loading');

const data = {};

const routerOptions = { data };

Router.route('/', {
    name: 'home',
    onBeforeAction: function() {
        // Check if user needs to verify its email
        if (verifyEmail && Meteor.user().emails && !Meteor.user().emails[0].verified) {
            this.render('emailVerification', routerOptions);
        } else {
            this.render('app', routerOptions);
        }
    }
});

Router.route('/viewer/timepoints/:_id', {
    layoutTemplate: 'layout',
    name: 'viewerTimepoint',
    onBeforeAction: function() {
        const timepointId = this.params._id;

        this.render('app', routerOptions);
        OHIF.lesiontracker.openNewTabWithTimepoint(timepointId);
    }
});

OHIF.viewer.prepare = ({ studyInstanceUids, timepointId }) => {
    // Clear the cornerstone tool data to sync the measurements with the measurements API
    cornerstoneTools.globalImageIdSpecificToolStateManager = cornerstoneTools.newImageIdSpecificToolStateManager();

    return new Promise((resolve, reject) => {
        OHIF.studylist.retrieveStudiesMetadata(studyInstanceUids).then(studies => {
            // Add additional metadata to our study from the studylist
            studies.forEach(study => {
                const studylistStudy = OHIF.studylist.collections.Studies.findOne({
                    studyInstanceUid: study.studyInstanceUid
                });

                if (!studylistStudy) {
                    return;
                }

                Object.assign(study, studylistStudy);
            });

            resolve(studies);
        }).catch(reject);
    });
};

Router.route('/viewer/studies/:studyInstanceUids', {
    name: 'viewerStudies',
    onBeforeAction: function() {
        this.render('app', { data: { template: 'loadingText' } });

        const studyInstanceUids = this.params.studyInstanceUids.split(';');
        OHIF.viewer.prepare({ studyInstanceUids }).then(studies => {
            this.render('app', {
                data: {
                    template: 'viewer',
                    studies
                }
            });
        });
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
