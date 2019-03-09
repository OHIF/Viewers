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
    }
}]);

export const length = {
    id: 'length',
    name: 'Length',
    toolGroup: 'Target',
    cornerstoneToolType: 'length',
    schema: LengthSchema,
    options: {
        measurementTable: {
            displayFunction: data => data.response
        },
        caseProgress: {
            include: true
        }
    }
};
