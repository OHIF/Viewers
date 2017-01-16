import { Blaze } from 'meteor/blaze';

Blaze.registerHelper('inc', function(value) {
    return parseInt(value) + 1;
});
