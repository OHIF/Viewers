import { Router } from 'meteor/iron:router';

Meteor.startup(() => {
    Router.route('/login', function() {
        this.layout('mainLayout');
        this.render('userLogin');
    }, { name: 'userLogin' });
});
