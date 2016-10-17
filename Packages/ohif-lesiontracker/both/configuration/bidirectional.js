import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { MeasurementSchemaTypes } from 'meteor/ohif:measurements/both/schema/measurements';

const CornerstoneHandleSchema = MeasurementSchemaTypes.CornerstoneHandleSchema;

const BidirectionalHandlesSchema = new SimpleSchema({
	start: {
		type: CornerstoneHandleSchema,
		label: 'Start'
	},
	end: {
		type: CornerstoneHandleSchema,
		label: 'End'
	},
	perpendicularStart: {
		type: CornerstoneHandleSchema,
		label: 'Perpendicular Start'
	},
	perpendicularEnd: {
		type: CornerstoneHandleSchema,
		label: 'Perpendicular End'
	},
	textBox: {
		type: CornerstoneHandleSchema,
		label: 'Text Box'
	},
});

const BidirectionalSchema = new SimpleSchema([MeasurementSchemaTypes.CornerstoneToolMeasurement, {
    handles: {
        type: BidirectionalHandlesSchema,
        label: 'Handles'
    },
    longestDiameter: {
    	type: Number,
    	label: 'Longest Diameter',
        decimal: true
    },
    shortestDiameter: {
    	type: Number,
    	label: 'Shortest Diameter',
        decimal: true
    },
    locationUid: {
    	type: String,
    	label: 'Location UID',
        optional: true // Optional because it is added after initial drawing, via a callback
    }
}]);

function displayFunction(data) {
    // Check whether this is a Nodal or Extranodal Measurement
    const targetType = 'target';
    const nodalType = data.isNodal ? 'nodal' : 'extraNodal';

    // Get criteria types
    const criteriaTypes = TrialCriteriaTypes.find({
        selected: true
    }).map(criteria => {
        return criteria.id;
    });

    const currentConstraints = OHIF.lesiontracker.getTrialCriteriaConstraints(criteriaTypes, data.imageId);

    if (data.shortestDiameter) {
        // TODO: Make this check criteria again to see if we should display
        // shortest x longest
        return data.longestDiameter + ' x ' + data.shortestDiameter;
    }

    return data.longestDiameter;
}

export const bidirectional = {
    id: 'targets',
    name: 'Targets',
    cornerstoneToolType: 'bidirectional',
    schema: BidirectionalSchema,
    options: {
        showInMeasurementTable: true,
        measurementTableOptions: {
            displayFunction: displayFunction
        },
        includeInCaseProgress: true,
    },
}
