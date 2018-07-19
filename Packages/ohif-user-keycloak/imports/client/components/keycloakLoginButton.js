import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

import './keycloakLoginButton.html';

Template.keycloakLoginButton.events({
    'click .js-login-keycloak'() {
        Meteor.loginWithMeteorKeycloak({}, function(error) {
            if (error) {
                throw new Error(error);
            }

            Router.go('/studylist');
        });
    }
});
