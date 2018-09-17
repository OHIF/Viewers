import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { OHIF } from 'meteor/ohif:core';

// Use Aldeed's meteor-template-extension package to replace the
// default StudyListStudy template.
// See https://github.com/aldeed/meteor-template-extension
const defaultTemplate = 'studylistStudy';

if (OHIF.studylist) {
    Template.longitudinalStudyListStudy.replaces(defaultTemplate);

    // Add the TimepointName helper to the default template. The
    // HTML of this template is replaced with that of longitudinalStudyListStudy
    Template[defaultTemplate].helpers({
        timepointName() {
            const instance = Template.instance();
            const timepointApi = OHIF.studylist.timepointApi;
            if (!timepointApi) {
                return;
            }

            const timepoint = timepointApi.study(instance.data.studyInstanceUid)[0];
            if (!timepoint) {
                return;
            }

            return timepointApi.name(timepoint);
        }
    });
}
