import { Template } from 'meteor/templating';

Template.studyBrowserSidebar.events({
    'ohif.studies.study.click'(event, instance) {
        const $element = $(event.currentTarget);

        // Remove active class from sibling studies
        $element.siblings().removeClass('active');

        // Toggle the active class on clicked study
        $element.toggleClass('active');
    }
});
