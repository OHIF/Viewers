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

const MeanStdDevSUV = new SimpleSchema({
    mean: {
        type: Number,
        label: 'meanSUV',
        decimal: true
    },
    stdDev: {
        type: Number,
        label: 'stdDevSUV',
        decimal: true
    }
});

const CachedStatsSchema = new SimpleSchema({
    area: {
        type: Number,
        label: 'area',
        decimal: true
    },
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
    variance: {
        type: Number,
        label: 'variance',
        decimal: true
    },
    stdDev: {
        type: Number,
        label: 'stdDev',
        decimal: true
    },
    min: {
        type: Number,
        label: 'min',
        decimal: true
    },
    max: {
        type: Number,
        label: 'max',
        decimal: true
    },
    meanStdDevSUV: {
        type: MeanStdDevSUV,
        label: 'meanStdDevSUV',
        optional: true
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
    cachedStats: {
        type: CachedStatsSchema,
        label: 'Cached Stats',
        optional: true
    }
}]);

const displayFunction = data => {
    let meanValue = '';
    if (data.cachedStats && data.cachedStats.mean) {
        meanValue = data.cachedStats.mean.toFixed(2) + ' HU';
    }
    return meanValue;
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
