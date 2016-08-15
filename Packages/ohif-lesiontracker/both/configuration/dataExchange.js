import { measurementTools } from './measurementTools';

export const retrieveMeasurements = () => {
	console.log('retrieveMeasurements');

	return new Promise((resolve, reject) => {
	    Meteor.call("retrieveMeasurements", (error, response) => {
	      if (error) {
	        reject(error);
	      } else {
	      	console.log(response);

      		/*measurementTools.forEach(tool => {
				console.log('Retrieving tool: ' + tool.id);
			});*/

	        resolve(response);
	      }
	    });
	});
};

export const storeMeasurements = (measurementData) => {
	console.log('storeMeasurements');

	// Here is where we should do any required data transformation and API calls

	return new Promise((resolve, reject) => {
	    Meteor.call("storeMeasurements", measurementData, (error, response) => {
	      if (error) {
	        reject(error);
	      } else {
	        resolve(response);
	      }
	    });
	});
};

export const retrieveTimepoints = () => {
	console.log('retrieveTimepoints');

	return new Promise((resolve, reject) => {
	    Meteor.call("retrieveTimepoints", (error, response) => {
	      if (error) {
	        reject(error);
	      } else {
	        resolve(response);
	      }
	    });
	});
};

export const storeTimepoints = (timepointData) => {
	console.log('storeTimepoints');
	console.log(timepointData);

	return new Promise((resolve, reject) => {
	    Meteor.call("storeTimepoints", timepointData, (error, response) => {
	      if (error) {
	        reject(error);
	      } else {
	        resolve(response);
	      }
	    });
	});
};