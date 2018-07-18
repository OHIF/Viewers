import { Router } from 'meteor/clinical:router';

Router.route('/login', function() {
    this.layout('mainLayout', { data: {} });
    this.render('userLogin');
}, { name: 'userLogin' });
