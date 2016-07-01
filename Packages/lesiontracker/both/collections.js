Timepoints = new Meteor.Collection('timepoints');
Studies = new Meteor.Collection('studies');
Measurements = new Meteor.Collection('measurements');

// ImageMeasurements describe temporary measurements that aren't
// specifically listed in the Lesion Table
ImageMeasurements = new Meteor.Collection('imageMeasurements');

// Additional Findings stores details from the Additional Findings
// panel, and represents items such as data quality,
AdditionalFindings = new Meteor.Collection('additionalFindings');

WorklistSubscriptions = ['studies', 'timepoints'];
Reviewers = new Meteor.Collection('reviewers');
