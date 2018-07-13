import { Meteor } from 'meteor/meteor';
import { ServiceConfiguration } from 'meteor/service-configuration';
import { Accounts } from "meteor/accounts-base";

console.log('Keycloak settings were found! Enabling Keycloak integration.');

ServiceConfiguration.configurations.upsert(
    { service: 'keycloak' },
    {
        $set: {
            "realm": Meteor.settings.public.custom.keycloak.realmName,
            "auth-server-url": Meteor.settings.public.custom.keycloak.authServerUrl,
            "auth_redirect_uri": Meteor.settings.keycloak.authRedirectUri,
            "ssl-required": Meteor.settings.keycloak.sslRequired,
            "resource": Meteor.settings.keycloak.clientId,
            "client_id": Meteor.settings.keycloak.clientId,
            "loginStyle": Meteor.settings.keycloak.loginStyle,
            "secret": Meteor.settings.keycloak.clientSecret,
            "realm-public-key": Meteor.settings.keycloak.realmPublicKey,
            "public-client": false,
            "use-resource-role-mappings": false,
            "bearer-only": false,
        }
    }
);

Meteor.publish('user.services.keycloak', function() {
    const userId = this.userId;
    if (!userId) {
        return [];
    }

    return Meteor.users.find(userId, {
        fields: {
            'services.keycloak': 1
        }
    });
});

Accounts.onLogout(({ user }) => {
    if (!user) {
        return;
    }

    // Erase any Keycloak token that exists
    Meteor.users.update(user._id, {
        $unset: {
            'services.keycloak': 1
        }
    });
});
