import { Meteor } from 'meteor/meteor';

if (!Meteor.settings.public ||
    !Meteor.settings.public.custom ||
    !Meteor.settings.public.custom.keycloak) {

    console.log('To use the ohif-user-keycloak package, you must add relevant Keycloak settings to Meteor.settings.public.custom.keycloak (client-side).');
} else {
    require('../imports/client/index.js')
}
