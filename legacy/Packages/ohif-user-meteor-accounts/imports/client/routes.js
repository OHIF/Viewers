import { Meteor } from "meteor/meteor";
import { Router } from 'meteor/clinical:router';

if (Meteor.settings.public.userAuthenticationRoutesEnabled === true) {
    Router.route('/login', function() {
        this.layout('layout', { data: {} });
        this.render('userLogin');
    }, { name: 'userLogin' });
}
