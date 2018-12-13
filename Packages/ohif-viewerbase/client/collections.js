import { Meteor } from 'meteor/meteor';
import { OHIF } from '../namespace';

const { TypeSafeCollection } = OHIF.classes;

// Create main Studies collection which will be used across the entire viewer...
const Studies = new TypeSafeCollection();

// Make it publicly available on "OHIF.viewer" namespace...
OHIF.viewer.Studies = Studies;

// Create main StudyMetadataList collection which will be used across the entire viewer...
const StudyMetadataList = new TypeSafeCollection();

// Make it publicly available on "OHIF.viewer" namespace...
OHIF.viewer.StudyMetadataList = StudyMetadataList;
