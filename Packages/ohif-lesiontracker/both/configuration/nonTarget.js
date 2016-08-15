import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { MeasurementSchemaTypes } from 'meteor/ohif:measurements/both/schema/measurements';

const CornerstoneHandleSchema = MeasurementSchemaTypes.CornerstoneHandleSchema;

const NonTargetHandlesSchema = new SimpleSchema({
	start: {
		type: CornerstoneHandleSchema,
		label: 'Start'
	},
	end: {
		type: CornerstoneHandleSchema,
		label: 'End'
	},
	textBox: {
		type: CornerstoneHandleSchema,
		label: 'Text Box'
	}
});

const NonTargetSchema = new SimpleSchema([MeasurementSchemaTypes.CornerstoneToolMeasurement, {
    handles: {
        type: NonTargetHandlesSchema,
        label: 'Handles'
    },
    response: {
    	type: String,
    	label: 'Response',
        optional: true // Optional because it is added after initial drawing, via a callback
    },
    locationUid: {
        type: String,
        label: 'Location UID',
        optional: true // Optional because it is added after initial drawing, via a callback
    }
}]);

function displayFunction(data) {
    return data.response;
}

export const nonTarget = {
    id: 'nonTargets',
    name: 'Non-Targets',
    cornerstoneToolType: 'nonTarget',
    schema: NonTargetSchema,
    displayFunction: displayFunction,
    options: {
        showInMeasurementTable: true,
        measurementTableOptions: {
            displayFunction: displayFunction
        },
        includeInCaseProgress: true,        
    },
}