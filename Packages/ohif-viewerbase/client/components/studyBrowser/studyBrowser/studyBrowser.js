import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

Template.studyBrowser.helpers({
    studies() {
        // @TypeSafeStudies
        return OHIF.viewer.Studies.findAllBy({
            selected: true
        });
    }
});
