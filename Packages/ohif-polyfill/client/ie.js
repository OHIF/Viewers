import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
import writeScript from './lib/writeScript';

// Check if browser is IE and add the polyfill scripts
if (navigator && /MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
    Meteor.startup(() => {
        // This is needed before window loading because it's used to parse DICOM images data
        writeScript('typedarray.min.js');

        $(window).on('load', () => {
            // Fix SVG+USE issues by calling the SVG polyfill
            writeScript('svg4everybody.min.js', () => window.svg4everybody());
        });
    });
}
