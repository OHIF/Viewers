import { Meteor } from 'meteor/meteor';

if (!Meteor.settings.public ||
    !Meteor.settings.public.custom ||
    !Meteor.settings.public.custom.oidc) {

    console.log('To use the ohif-user-oidc package, you must add relevant OpenID Connect settings to Meteor.settings.public.custom.oidc (client-side).');
} else {
    require('../imports/client/index.js')
}
