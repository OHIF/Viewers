import { Router } from 'meteor/clinical:router';
import { OHIF } from 'meteor/ohif:core';

OHIF.user.audit = () => {
    Router.go('/audit');
};
