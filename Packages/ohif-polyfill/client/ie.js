import { Meteor } from 'meteor/meteor';
import writeScript from './lib/writeScript';

Meteor.startup(() => {
    // Check if browser is IE and add the polyfill scripts
    if (navigator && /MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
        writeScript('typedarray.min.js');

        // Fix SVG+USE issues by calling the SVG polyfill
        writeScript('svg4everybody.min.js', () => window.svg4everybody());
    }
});
