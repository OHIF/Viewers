import { OHIF } from 'meteor/ohif:core';
import { loglevel } from 'meteor/practicalmeteor:loglevel';

const defaultLevel = Meteor.isProduction ? 'error' : 'trace';

// Create package logger using loglevel
OHIF.log = loglevel.createLogger('', defaultLevel);
