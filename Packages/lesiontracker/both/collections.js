import { Mongo } from 'meteor/mongo';

Timepoints = new Mongo.Collection('timepoints');
Studies = new Mongo.Collection('studies');
Measurements = new Mongo.Collection('measurements');

// ImageMeasurements describe temporary measurements that aren't
// specifically listed in the Lesion Table
ImageMeasurements = new Mongo.Collection('imageMeasurements');

// Additional Findings stores details from the Additional Findings
// panel, and represents items such as data quality,
AdditionalFindings = new Mongo.Collection('additionalFindings');

Servers = new Mongo.Collection('servers');
WorklistSubscriptions = ['studies', 'timepoints'];
Reviewers = new Mongo.Collection('reviewers');
