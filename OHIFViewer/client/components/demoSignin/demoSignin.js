import { OHIF } from 'meteor/ohif:core';
import { Router } from 'meteor/clinical:router';

Template.demoSignin.events({
    'click .googleSignInBtn'() {
        OHIF.user.login();
    },
    'click .anonSignInBtn'() {
        OHIF.user.demoLogin();
        Router.go('/', {}, { replaceState: true });
    }
});

