import { Accounts } from 'meteor/accounts-base';


Meteor.startup(function() {
    const options = {
        email: 'demo@ohif.org',
        password: '12345678aA*',
        profile: {
            fullName: 'Demo User'
        }
    };

    createDemoUser = function() {
        const user = Meteor.users.findOne({
            emails: {
                $elemMatch: {
                    address: 'demo@ohif.org'
                }
            }
        });
        if (user) {
            return;
        }
        console.log('create user!');

        // Create user
        const userId = Accounts.createUser(options);

        if (!userId) {
            console.log('Demo user cannot be created');
            return;
        }
    };

    // Create demo user
    createDemoUser();

});

