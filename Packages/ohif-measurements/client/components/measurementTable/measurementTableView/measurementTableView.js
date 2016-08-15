import { MeasurementsConfiguration } from 'meteor/ohif:measurements/both/configuration/measurements';

Template.measurementTableView.helpers({
    isFollowup() {
        const instance = Template.instance();
        const current = instance.data.timepointApi.current();
        return (current && current.timepointType === 'followup');
    },

    groupByMeasurementNumber(measurementTypeId) {
	    const api = Template.instance().data.measurementApi;
	    const Collection = api[measurementTypeId];
    	const data = Collection.find().fetch();
    	
        const groupObject = _.groupBy(data, entry => { return entry.measurementNumber });

        return Object.keys(groupObject).map(key => {
            return {
                measurementTypeId: measurementTypeId,
                measurementNumber: key,
                entries: groupObject[key]
            };
        });
    },

    newMeasurements() {
        // Find all measurements from this timepoint which do not have a corresponding measurement
        // at the prior timepoint.
        const instance = Template.instance();
        if (!instance.data.timepointApi) {
            return;
        }

        const api = instance.data.measurementApi;

        const config = MeasurementsConfiguration.getConfiguration();
        const measurementTools = config.measurementTools;

        // If this is a baseline, stop here since there are no new measurements to display
        const current = instance.data.timepointApi.current();
        if (!current || current.timepointType === 'baseline') {
            console.log('Skipping New Measurements section');
            return;
        }

        let data = [];
        measurementTools.forEach(tool => {
            // Handle only tools which are meant to be displayed in the measurement table
            if (!tool || !tool.options || !tool.options.showInMeasurementTable) {
                return;
            }

            // Find only those measurements made at this timepoint
            const selector = {
                timepointId: current.timepointId
            }

            // Sort ascending by measurement number
            const options = {
                sort: {
                    measurementNumber: 1
                }
            }

            // Retrieve measurements made at this timepoint
            const api = Template.instance().data.measurementApi;
            const measurementTypeId = tool.id;
            const Collection = api[measurementTypeId];
            const measurements = Collection.find(selector, options);

            // For each measurement, check if a previous measurement exists with an identical measurement number
            let newMeasurements = [];
            measurements.forEach(measurement => {
                // If no previous measurements exist, add it to the array of new measurements
                const selector = {
                    measurementNumber: measurement.measurementNumber,
                    timepointId: {
                        $ne: current.timepointId
                    }
                };

                const previousMeasurements = Collection.find(selector).fetch();
                if (previousMeasurements.length === 0) {
                    newMeasurements.push(measurement);
                }
            })

            // Concatenate new measurements of all measurement types
            data = data.concat(newMeasurements);
        })

        const groupObject = _.groupBy(data, entry => { return entry.measurementNumber });

        return Object.keys(groupObject).map(key => {
            return {
                measurementNumber: key,
                entries: groupObject[key]
            };
        });
    }
});
