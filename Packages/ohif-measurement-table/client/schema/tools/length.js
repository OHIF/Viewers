import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { MeasurementSchemaTypes } from 'meteor/ohif:measurements/both/schema/measurements';

const CornerstoneHandleSchema = MeasurementSchemaTypes.CornerstoneHandleSchema;

const LengthHandlesSchema = new SimpleSchema({
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

const LengthSchema = new SimpleSchema([MeasurementSchemaTypes.CornerstoneToolMeasurement, {
    handles: {
        type: LengthHandlesSchema,
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
        defaultValue: 'length'
    },
    length: {
        type: Number,
        label: 'Length',
        optional: true,
        decimal: true
    }
}]);

const displayFunction = data => {
    let lengthValue = '';
    if (data.length) {
        lengthValue = data.length.toFixed(2) + ' mm';
    }
    return lengthValue;
};

export const length = {
    id: 'length',
    name: 'Length',
    toolGroup: 'allTools',
    cornerstoneToolType: 'length',
    schema: LengthSchema,
    options: {
        measurementTable: {
            displayFunction
        }
    }
};
