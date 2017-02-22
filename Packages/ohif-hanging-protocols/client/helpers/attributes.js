import { Blaze } from 'meteor/blaze';


Blaze.registerHelper('viewportSettingsTypes', function() {
    return HP.viewportSettingsTypes;
});

Blaze.registerHelper('toolSettingsTypes', function() {
    return HP.toolSettingsTypes;
});

Blaze.registerHelper('studyAttributes', function() {
    return HP.studyAttributes;
});

Blaze.registerHelper('seriesAttributes', function() {
    return HP.seriesAttributes;
});

Blaze.registerHelper('instanceAttributes', function() {
    return HP.instanceAttributes;
});
