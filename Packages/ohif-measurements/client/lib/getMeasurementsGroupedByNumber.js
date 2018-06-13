import { OHIF } from 'meteor/ohif:core';
import { _ } from 'meteor/underscore';

// TODO: change this to a const after refactoring newMeasurements code on measurementTableView.js
OHIF.measurements.getLocation = collection => {
    for (let i = 0; i < collection.length; i++) {
        if (collection[i].location) {
            return collection[i].location;
        }
    }
};

// TODO: change this to a const after refactoring newMeasurements code on measurementTableView.js
OHIF.measurements.getDescription = collection => {
    for (let i = 0; i < collection.length; i++) {
        if (collection[i].description) {
            return collection[i].description;
        }
    }
};

/**
 * Group all measurements by its tool group and measurement number.
 *
 * @param measurementApi
 * @param timepointApi
 * @returns {*} A list containing each toolGroup and an array containing the measurement rows
 */
OHIF.measurements.getMeasurementsGroupedByNumber = (measurementApi, timepointApi) => {
    const getPath = OHIF.utils.ObjectPath.get;
    const configuration = OHIF.measurements.MeasurementApi.getConfiguration();

    if (!measurementApi || !timepointApi || !configuration) return;

    // Check which tools are going to be displayed
    const displayToolGroupMap = {};
    const displayToolList = [];
    configuration.measurementTools.forEach(toolGroup => {
        displayToolGroupMap[toolGroup.id] = false;
        toolGroup.childTools.forEach(tool => {
            const willDisplay = !!getPath(tool, 'options.measurementTable.displayFunction');
            if (willDisplay) {
                displayToolList.push(tool.id);
                displayToolGroupMap[toolGroup.id] = true;
            }
        });
    });

    // Create the result object
    const groupedMeasurements = [];

    const baseline = timepointApi.baseline();
    if (!baseline) return;

    configuration.measurementTools.forEach(toolGroup => {
        // Skip this tool group if it should not be displayed
        if (!displayToolGroupMap[toolGroup.id]) return;

        // Retrieve all the data for this Measurement type (e.g. 'targets')
        // which was recorded at baseline.
        const atBaseline = measurementApi.fetch(toolGroup.id, {
            timepointId: baseline.timepointId
        });

        // Obtain a list of the Measurement Numbers from the
        // measurements which have baseline data
        const numbers = atBaseline.map(m => m.measurementNumber);

        // Retrieve all the data for this Measurement type which
        // match the Measurement Numbers obtained above
        const data = measurementApi.fetch(toolGroup.id, {
            toolId: {
                $in: displayToolList
            },
            measurementNumber: {
                $in: numbers
            }
        });

        // Group the Measurements by Measurement Number
        const groupObject = _.groupBy(data, entry => entry.measurementNumber);

        // Reformat the data for display in the table
        const measurementRows = Object.keys(groupObject).map(key => ({
            measurementTypeId: toolGroup.id,
            measurementNumber: key,
            location: OHIF.measurements.getLocation(groupObject[key]),
            description: OHIF.measurements.getDescription(groupObject[key]),
            responseStatus: false, // TODO: Get the latest timepoint and determine the response status
            entries: groupObject[key]
        }));

        // Add the group to the result
        groupedMeasurements.push({
            toolGroup,
            measurementRows
        });
    });

    return groupedMeasurements;
};
