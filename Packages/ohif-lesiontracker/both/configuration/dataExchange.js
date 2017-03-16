import { measurementTools } from './measurementTools';

export const retrieveMeasurements = (patientId, timepointIds) => {
    console.log('retrieveMeasurements');

    return new Promise((resolve, reject) => {
        Meteor.call('retrieveMeasurements', patientId, timepointIds, (error, response) => {
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

export const storeMeasurements = (measurementData, timepointIds) => {
    console.log('storeMeasurements');

    // Here is where we should do any required data transformation and API calls

    return new Promise((resolve, reject) => {
        Meteor.call('storeMeasurements', measurementData, timepointIds, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
};

export const retrieveTimepoints = filter => {
    console.log('retrieveTimepoints');

    return new Promise((resolve, reject) => {
        Meteor.call('retrieveTimepoints', filter, (error, response) => {
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
        Meteor.call('storeTimepoints', timepointData, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
};

export const updateTimepoint = (timepointData, query) => {
    console.log('updateTimepoint');
    console.log(timepointData);
    console.log(query);

    return new Promise((resolve, reject) => {
        Meteor.call('updateTimepoint', timepointData, query, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
};

export const removeTimepoint = timepointId => {
    console.log('removeTimepoint');
    console.log(timepointId);

    return new Promise((resolve, reject) => {
        Meteor.call('removeTimepoint', timepointId, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
};

export const disassociateStudy = (timepointIds, studyInstanceUid) => {
    console.log('disassociateStudy');
    console.log(timepointIds);
    console.log(studyInstanceUid);

    return new Promise((resolve, reject) => {
        Meteor.call('disassociateStudy', timepointIds, studyInstanceUid, (error, response) => {
            if (error) {
                reject(error);
            } else {
                resolve(response);
            }
        });
    });
};
