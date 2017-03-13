import { Router } from 'meteor/iron:router';
import { OHIF } from 'meteor/ohif:core';

OHIF.user.changePassword = () => {
    Router.go('/changePassword');
};
