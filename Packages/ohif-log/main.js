import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';
import loglevel from 'loglevel';

const defaultLevel = Meteor.isProduction ? 'ERROR' : 'TRACE';

// Create package logger using loglevel
OHIF.log = loglevel.getLogger('OHIF');
OHIF.log.setLevel(defaultLevel);

// Add time and timeEnd to OHIF.log namespace
const times = new Map();

// Register the time method
OHIF.log.time = givenKey => {
    const key = typeof givenKey === 'undefined' ? 'default' : givenKey;
    times.set(key, new Date().getTime());
};

// Register the timeEnd method
OHIF.log.timeEnd = givenKey => {
    const key = typeof givenKey === 'undefined' ? 'default' : givenKey;
    const now = new Date().getTime();
    const last = times.get(key) || now;
    times.delete(key);
    const duration = now - last;
    OHIF.log.info(`${key}: ${duration}ms`);
};
