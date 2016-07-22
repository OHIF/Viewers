Template.toolbarSectionTools.events({
    'click .js-open-more-tools'(event, instance) {
        const $target = $(event.currentTarget);
        const isActive = $target.hasClass('active');
        $target.toggleClass('active', !isActive);
        $target.closest('.toolbarSection').toggleClass('expanded', !isActive);
    }
});
