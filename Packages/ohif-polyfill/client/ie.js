import { Meteor } from 'meteor/meteor';
import { $ } from 'meteor/jquery';
import writeScript from './lib/writeScript';

// Check if browser is IE and add the polyfill scripts
if (navigator && /MSIE \d|Trident.*rv:/.test(navigator.userAgent)) {
    Meteor.startup(() => {
        $(window).on('load', () => {
            // Fix SVG+USE issues by calling the SVG polyfill
            writeScript('svgxuse.min.js');
        });
    });
}
