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
    },
});

const MeanStdDevSchema = new SimpleSchema({
    count: {
        type: Number,
        label: 'count',
        decimal: true
    },
    mean: {
        type: Number,
        label: 'mean',
        decimal: true
    },
    stdDev: {
        type: Number,
        label: 'stdDev',
        decimal: true
    },
    variance: {
        type: Number,
        label: 'variance',
        decimal: true
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
    toolType: {
        type: String,
        label: 'Measurement Tool Type',
        defaultValue: 'ellipticalRoi'
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
    area: {
        type: Number,
        label: 'Ellipse Area value',
        decimal: true,
        optional: true
    },
    meanStdDev: {
        type: MeanStdDevSchema,
        label: 'MeanStd Values',
        optional: true
    }
}]);

const displayFunction = data => {
    let meanValue = '';
    if (data.meanStdDev && data.meanStdDev.mean) {
        meanValue = data.meanStdDev.mean.toFixed(2) + ' HU';
    }
    return meanValue;
    // let meanValue = data.meanStdDev && data.meanStdDev.mean || 0;
    // return numberWithCommas(meanValue).toFixed(2) + ' HU';
    //return data.meanStdDev.mean.toFixed(2);
};

export default {
    id: 'ellipticalRoi',
    name: 'Ellipse',
    toolGroup: 'allTools',
    cornerstoneToolType: 'ellipticalRoi',
    schema: toolSchema,
    options: {
        measurementTable: {
            displayFunction
        }
    }
};
