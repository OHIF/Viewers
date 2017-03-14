import { Meteor } from 'meteor/meteor';
import { OHIF } from 'meteor/ohif:core';

Meteor.startup(() => {
    OHIF.studylist.dropdown = new OHIF.ui.Dropdown();

    OHIF.studylist.dropdown.setItems([{
        action: OHIF.studylist.viewSeriesDetails,
        text: 'View Series Details'
    }, {
        text: 'Anonymize',
        disabled: true
    }, {
        text: 'Send',
        disabled: true,
        separatorAfter: true
    }, {
        text: 'Delete',
        disabled: true
    }, {
        action: OHIF.studylist.exportSelectedStudies,
        text: 'Export',
        title: 'Export Selected Studies'
    }]);
});
