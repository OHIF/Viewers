import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { MeasurementSchemaTypes } from 'meteor/ohif:measurements/both/schema/measurements';

const CornerstoneHandleSchema = MeasurementSchemaTypes.CornerstoneHandleSchema;

const handlesSchema = new SimpleSchema({
    start: {
        type: CornerstoneHandleSchema,
        label: 'Start'
    },
    middle: {
        type: CornerstoneHandleSchema,
        label: 'Middle'
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
        defaultValue: 'simpleAngle'
    },
    rAngle: {
        type: Number,
        label: 'Angle',
        optional: true,
        decimal: true
    }
}]);

const displayFunction = data => {
    let text = '';
    if (data.rAngle) {
        text = data.rAngle.toFixed(2) + String.fromCharCode(parseInt('00B0', 16));
    }
    return text;
};

export default {
    id: 'simpleAngle',
    name: 'SimpleAngle',
    toolGroup: 'allTools',
    cornerstoneToolType: 'simpleAngle',
    schema: toolSchema,
    options: {
        measurementTable: {
            displayFunction
        }
    }
};
