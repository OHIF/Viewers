import { Router } from 'meteor/iron:router';

Router.route('/login', function() {
    this.layout('mainLayout', { data: {} });
    this.render('userLogin');
}, { name: 'userLogin' });
