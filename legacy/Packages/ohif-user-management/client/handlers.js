import { Accounts } from 'meteor/accounts-base';
import { Router } from 'meteor/clinical:router';

Accounts.onLogout(() => {
    Router.go('/entrySignIn');
});
