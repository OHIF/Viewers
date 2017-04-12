import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/iron:router';

Meteor.startup(() => {
    Router.route('/login', function() {
        this.layout('mainLayout', { data: {} });
        this.render('userLogin');
    }, { name: 'userLogin' });
});
