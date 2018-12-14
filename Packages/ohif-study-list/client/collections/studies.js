import { OHIF } from 'ohif-core';

// Define the Studies Collection. This is a client-side only Collection which stores the list of
// studies in the StudyList
const Studies = new Meteor.Collection(null);
Studies._debugName = 'Studies';

OHIF.studylist.collections = {};
OHIF.studylist.collections.Studies = Studies;
