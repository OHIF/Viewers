import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

Template.studylist.onCreated(() => {
    // Set the current context
    OHIF.context.set('studylist');
});

Template.studylist.onDestroyed(() => {
    // Reset the current context
    OHIF.context.set(null);
});
