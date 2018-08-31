import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { MeasurementSchemaTypes } from 'meteor/ohif:measurements/both/schema/measurements';

const CornerstoneHandleSchema = MeasurementSchemaTypes.CornerstoneHandleSchema;

const handlesSchema = new SimpleSchema({
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

const toolSchema = new SimpleSchema([MeasurementSchemaTypes.CornerstoneToolMeasurement, {
    handles: {
        type: handlesSchema,
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
    toolType: {
        type: String,
        label: 'Measurement Tool Type',
        defaultValue: 'arrowAnnotate'
    },
    text: {
        type: String,
        label: 'text',
        optional: true
    }
}]);

const displayFunction = data => {
    return data.text || '';
};

export default {
    id: 'arrowAnnotate',
    name: 'ArrowAnnotate',
    toolGroup: 'allTools',
    cornerstoneToolType: 'arrowAnnotate',
    schema: toolSchema,
    options: {
        measurementTable: {
            displayFunction
        }
    }
};
