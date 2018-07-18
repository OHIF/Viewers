import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
import { Router } from 'meteor/clinical:router';

Router.onRun(function() {
    $(document.body).trigger('ohif.navigated');
    this.next();
});

if (Meteor.isDevelopment) {
    Router.route('/playground', function() {
        this.render('componentPlayground');
    });
}
