import { SimpleSchema } from 'meteor/aldeed:simple-schema';
import { MeasurementSchemaTypes } from 'meteor/ohif:measurements/both/schema/measurements';
// import { OHIF } from 'meteor/ohif:core';

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
    locationUid: {
        type: String,
        label: 'Location UID',
        optional: true // Optional because it is added after initial drawing, via a callback
    }
}]);

const displayFunction = data => {
    // Check whether this is a Nodal or Extranodal Measurement
    // const targetType = 'target';
    // const nodalType = data.isNodal ? 'nodal' : 'extraNodal';

    // Get criteria types
    // const criteriaTypes = OHIF.lesiontracker.TrialCriteriaTypes.find({
    //     selected: true
    // }).map(criteria => {
    //     return criteria.id;
    // });

    // const currentConstraints = OHIF.lesiontracker.getTrialCriteriaConstraints(criteriaTypes, data.imageId);

    if (data.shortestDiameter) {
        // TODO: Make this check criteria again to see if we should display
        // shortest x longest
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
