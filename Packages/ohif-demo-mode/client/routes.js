import { Meteor } from 'meteor/meteor';
import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

const DEMO_SIGN_IN_PAGE = '/demo-signin';

Router.onRun(function() {
    if (!OHIF.demoMode)
        this.next();
    else if (this.url === DEMO_SIGN_IN_PAGE)
        this.next();
    else if (OHIF.demoMode.userLoggedIn() || OHIF.user.userLoggedIn()) {
        // user is logged in whether in demo or in oidc mode
        this.next();
    } else if (this.url === OHIF.user.getOidcRedirectUri()) {
        // allow oidc to sign in
        this.next();
    } else {
        // redirect to demo login page
        Router.go(DEMO_SIGN_IN_PAGE, {}, { replaceState: true });
    }
});

Router.route(DEMO_SIGN_IN_PAGE, function() {
    this.render('demoSignin');
}, { name: 'demo' });