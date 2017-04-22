import { Router } from 'meteor/iron:router';
import { Session } from 'meteor/session';
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
