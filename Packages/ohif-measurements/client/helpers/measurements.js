import { OHIF } from 'meteor/ohif:core';

Template.registerHelper('measurementConfiguration', () => {
	//console.log('helper:measurementTools');
    if (!OHIF.measurements.MeasurementApi) {
        return;
    }

    const config = OHIF.measurements.MeasurementApi.getConfiguration();
    return config;
});

Template.registerHelper('measurementApiCollection', measurementTypeId => {
	//console.log('helper:measurementApiCollection');
    if (!measurementTypeId) {
        return;
    }

    const api = Template.instance().data.measurementApi;
    return api[measurementTypeId].find();
});
