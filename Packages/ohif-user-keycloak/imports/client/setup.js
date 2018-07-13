import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

Router.waitOn(function() {
    return [
        Meteor.subscribe('user.services.keycloak'),
    ];
}, { except: ['userLogin'] });

Router.onBeforeAction(function() {
    // Check if user is signed in
    if (!Meteor.userId() && !Meteor.loggingIn()) {
        this.redirect('userLogin');
    } else {
        this.next();
    }
}, {
    except: ['userLogin', 'entrySignUp', 'forgotPassword', 'resetPassword']
});

OHIF.user.additionalLoginButtons = OHIF.user.additionalLoginButtons || [];

OHIF.user.additionalLoginButtons.push({
    template: 'keycloakLoginButton'
});

if (!Meteor.settings.public.userAuthenticationRoutesEnabled) {
    OHIF.log.error('Please set Meteor.settings.public.userAuthenticationRoutesEnabled=true');
}
