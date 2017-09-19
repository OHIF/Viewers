import { Meteor } from 'meteor/meteor';
import writeScript from './lib/writeScript';

// Fix SVG+USE issues
writeScript('svg4everybody.min.js');
Meteor.startup(() => {
    // Call the SVG polyfill
    window.svg4everybody();
});
