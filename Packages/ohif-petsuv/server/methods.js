import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { measurementTools } from 'meteor/ohif:petsuv/both/configuration/measurementTools';

let MeasurementCollections = {};
measurementTools.forEach(tool => {
	MeasurementCollections[tool.id] = new Mongo.Collection(tool.id);
});



Timepoints = new Mongo.Collection('timepoints');

// Drop our collections for testing purposes
Meteor.startup(() => {
	Timepoints.remove({});
	measurementTools.forEach(tool => {
		MeasurementCollections[tool.id].remove({});
	});
})


// TODO: Make storage use update instead of clearing the entire collection and 
// re-inserting everything.
Meteor.methods({
	storeTimepoints(timepoints) {
		console.log('Storing Timepoints on the Server')
		console.log(JSON.stringify(timepoints, null, 2));
		Timepoints.remove({});
		timepoints.forEach(timepoint => {
			delete timepoint._id;
			Timepoints.insert(timepoint);
		});
	},

	retrieveTimepoints() {
		console.log('Retrieving Timepoints from the Server');
		return Timepoints.find().fetch();
	},

	storeMeasurements(measurementData) {
		console.log('Storing Measurements on the Server')
		console.log(JSON.stringify(measurementData, null, 2));

		Object.keys(measurementData).forEach(toolId => {
			MeasurementCollections[toolId].remove({});

			const measurements = measurementData[toolId];
			measurements.forEach(measurement => {
				MeasurementCollections[toolId].insert(measurement);
			})
		});
	},

	retrieveMeasurements() {
		console.log('Retrieving Measurements from the Server');
		let measurementData = {};

		measurementTools.forEach(tool => {
			measurementData[tool.id] = MeasurementCollections[tool.id].find().fetch();
		});

		return measurementData;
	}
});