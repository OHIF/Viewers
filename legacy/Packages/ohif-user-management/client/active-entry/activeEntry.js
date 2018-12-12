import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(function() {
    if (Meteor.isClient){
        ActiveEntry.configure({
            logo: {
                url: OHIF.utils.absoluteUrl('/images/logo.png'),
                displayed: true
            },
            signIn: {
                displayFullName: true,
                destination: '/'
            },
            signUp: {
                destination: '/'
            },
            themeColors: {
                primary: ''
            }
        });
    }
});
