import { MeasurementsConfiguration } from 'meteor/ohif:measurements/both/configuration/measurements';

Template.registerHelper('measurementConfiguration', () => {
	//console.log('helper:measurementTools');
    if (!MeasurementsConfiguration) {
        return;
    }

    const config = MeasurementsConfiguration.getConfiguration();
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
