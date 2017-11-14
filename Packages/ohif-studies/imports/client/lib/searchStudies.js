import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

const studySearchPromises = new Map();

/**
 * Search for studies information by the given filter
 *
 * @param {Object} filter Filter that will be used on search
 * @returns {Promise} resolved with an array of studies information or rejected with an error
 */
OHIF.studies.searchStudies = filter => {
    const promiseKey = JSON.stringify(filter);
    if (studySearchPromises.has(promiseKey)) {
        return studySearchPromises.get(promiseKey);
    } else {
        const promise = new Promise((resolve, reject) => {
            Meteor.call('StudyListSearch', filter, (error, studiesData) => {
                if (error) {
                    reject(error);
                } else {
                    resolve(studiesData);
                }
            });
        });
        studySearchPromises.set(promiseKey, promise);
        return promise;
    }
};
