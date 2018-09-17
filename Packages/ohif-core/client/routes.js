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

import { hotkeys } from 'meteor/ohif:hotkeys';

Router.onBeforeAction(function() {
    const lastRoute = Session.get('lastRoute');
    const currentRoute = this.router.current().route.getName();
    if (currentRoute !== lastRoute) {
        hotkeys.switchToContext(null);
        Session.set('lastRoute', currentRoute);
    }

    this.next();
});
