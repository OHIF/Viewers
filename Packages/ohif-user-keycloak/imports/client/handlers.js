import { Accounts } from 'meteor/accounts-base';
import { Meteor } from "meteor/meteor";

OHIF.user.getAccessToken = () => {
    const user = Meteor.user();
    if (!user) {
        return;
    }

    return user.services.keycloak.accessToken;
};

Accounts.onLogin(() => {
    Meteor.subscribe('user.services.keycloak', () => {
        sessionStorage.token = OHIF.user.getAccessToken();
    });
});

Accounts.onLogout(() => {
    const authServerUrl = Meteor.settings.public.custom.keycloak.authServerUrl;
    const realm = Meteor.settings.public.custom.keycloak.realmName;
    const redirectUri = Meteor.absoluteUrl('login');
    const logoutUrl = `${authServerUrl}/realms/${realm}/protocol/openid-connect/logout?redirect_uri=${redirectUri}`;
    window.location = logoutUrl;
});
