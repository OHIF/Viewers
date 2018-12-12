import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

OHIF.user.changePassword = () => {
    Router.go('/changePassword');
};
