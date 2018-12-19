import { OHIF } from 'meteor/ohif:core';
import { Router } from 'meteor/clinical:router';

Template.demoSignin.events({
    'click .googleSignInBtn'() {
        OHIF.gcloud.setEnabled(true);        
        OHIF.user.login();
    },
    'click .anonSignInBtn'() {
        OHIF.gcloud.setEnabled(false);
        OHIF.demoMode.login();
        Router.go('/studylist', {}, { replaceState: true });
    }
});

