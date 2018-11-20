import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { MeasurementSchemaTypes } from 'meteor/ohif:measurements/both/schema/measurements';

const { CornerstoneHandleSchema } = MeasurementSchemaTypes;

const BidirectionalHandleSchema = new SimpleSchema([CornerstoneHandleSchema, {
    selected: {
        type: Boolean,
        label: 'Selected',
        optional: true,
        defaultValue: false
    }
}]);

const BidirectionalHandlesSchema = new SimpleSchema({
    start: {
        type: BidirectionalHandleSchema,
        label: 'Start'
    },
    end: {
        type: BidirectionalHandleSchema,
        label: 'End'
    },
    perpendicularStart: {
        type: BidirectionalHandleSchema,
        label: 'Perpendicular Start'
    },
    perpendicularEnd: {
        type: BidirectionalHandleSchema,
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
    measurementNumber: {
        type: Number,
        label: 'Measurement Number'
    },
    location: {
        type: String,
        label: 'Location',
        optional: true
    },
    description: {
        type: String,
        label: 'Description',
        optional: true
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
    isSplitLesion: {
        type: Boolean,
        label: 'Is Split Lesion',
        optional: true,
        defaultValue: false
    }
}]);

const displayFunction = data => {
    if (data.shortestDiameter) {
        // TODO: Make this check criteria again to see if we should display shortest x longest
        return data.longestDiameter + ' x ' + data.shortestDiameter;
    }

    return data.longestDiameter;
};

export const bidirectional = {
    id: 'bidirectional',
    name: 'Target',
    toolGroup: 'targets',
    cornerstoneToolType: 'bidirectional',
    schema: BidirectionalSchema,
    options: {
        measurementTable: {
            displayFunction
        },
        caseProgress: {
            include: true
        }
    }
};
