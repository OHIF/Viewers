import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { OHIF } from "meteor/ohif:core";

const doAuth = Meteor.users.find().count() ? true : false;

OHIF.user.authenticateUser = request => {
    // Only allow logged-in users to access this route
    const userId = request.headers['x-user-id'];
    const loginToken = request.headers['x-auth-token'];
    if (!userId || !loginToken) {
        return;
    }

    const hashedToken = Accounts._hashLoginToken(loginToken);

    return !!Meteor.users.findOne({
        _id: userId,
        'services.resume.loginTokens.hashedToken': hashedToken
    });
};
