import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

Template.studyBrowser.helpers({
    studies() {
        // @TypeSafeStudies
        debugger;
        return OHIF.viewer.Studies.findAllBy({
            selected: true
        });
    }
});
