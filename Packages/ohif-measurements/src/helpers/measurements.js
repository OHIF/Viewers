import { Template } from 'meteor/templating';

import { OHIF } from 'meteor/ohif:core';

// Get the current measurement API configuration with information about tools, data exchange
// and data validation.
Template.registerHelper('measurementConfiguration', () => {
    return OHIF.measurements.MeasurementApi.getConfiguration();
});

// Translates the location and return a string containing its label
Template.registerHelper('getLocationLabel', label => {
    return OHIF.measurements.getLocationLabel(label);
});
