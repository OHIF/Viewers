import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';
import loglevel from 'loglevel';

const defaultLevel = Meteor.isProduction ? 'ERROR' : 'TRACE';

// Create package logger using loglevel
OHIF.log = loglevel.getLogger('OHIF');
OHIF.log.setLevel(defaultLevel);
