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
    measurementNumber: {
        type: Number,
        label: 'Measurement Number'
    },
    response: {
        type: String,
        label: 'Response',
        optional: true // Optional because it is added after initial drawing, via a callback
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
    }
}]);

export const nonTarget = {
    id: 'nonTarget',
    name: 'Non-Target',
    toolGroup: 'nonTargets',
    cornerstoneToolType: 'nonTarget',
    schema: NonTargetSchema,
    options: {
        measurementTable: {
            displayFunction: data => data.response
        },
        caseProgress: {
            include: true
        }
    }
};
