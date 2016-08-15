import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { MeasurementSchemaTypes } from 'meteor/ohif:measurements/both/schema/measurements';

const CornerstoneHandleSchema = MeasurementSchemaTypes.CornerstoneHandleSchema;

const EllipseHandlesSchema = new SimpleSchema({
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
	},
});

const MeanStdDevSchema = new SimpleSchema({
	count: {
		type: Number,
		label: 'Count'
	},
	mean: {
		type: Number,
		label: 'Mean',
		decimal: true
	},
	variance: {
		type: Number,
		label: 'Variance',
		decimal: true
	},
	stdDev: {
		type: Number,
		label: 'Variance',
		decimal: true
	}
});

const MeanStdDevSUVSchema = new SimpleSchema({
	mean: {
		type: Number,
		label: 'Mean SUV',
		decimal: true
	},
	stdDev: {
		type: Number,
		label: 'St. Dev SUV',
		decimal: true
	}
});

const EllipseSchema = new SimpleSchema([MeasurementSchemaTypes.CornerstoneToolMeasurement, {
    handles: {
        type: EllipseHandlesSchema,
        label: 'Handles'
    },
    meanStdDev: {
    	type: MeanStdDevSchema,
    	label: 'Mean St.Dev',
    	optional: true
    },
    meanStdDevSUV: {
    	type: MeanStdDevSUVSchema,
    	label: 'Mean St.Dev SUV',
    	optional: true
    },
    area: {
    	type: Number,
    	decimal: true,
    	optional: true
    }
}]);

function numberWithCommas(x) {
    // http://stackoverflow.com/questions/2901102/how-to-print-a-number-with-commas-as-thousands-separators-in-javascript
    var parts = x.toString().split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
}

function displayFunction(data) {
	if (!data.area ||
		!data.meanStdDev ||
		data.meanStdDev.mean === undefined) {
		return
	}

	return numberWithCommas(data.meanStdDev.mean.toFixed(2));
}

export const ellipse = {
    id: 'ellipse',
    name: 'Mean',
    cornerstoneToolType: 'ellipticalRoi',
    showInMeasurementTable: true,
    includeInCaseProgress: true,
    schema: EllipseSchema,
	displayFunction: displayFunction
}