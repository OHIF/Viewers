import { Template } from 'meteor/templating';

Template.toolbarSectionTools.events({
    'click .expandable'(event, instance) {
        const $target = $(event.currentTarget);
        const isExpanded = $target.hasClass('expanded');
        $target.toggleClass('expanded', !isExpanded);
    }
});
