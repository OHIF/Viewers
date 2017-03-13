import { Router } from 'meteor/iron:router';
import { OHIF } from 'meteor/ohif:core';

OHIF.user.audit = () => {
    Router.go('/audit');
};
