Template.flexboxLayout.events({
    'transitionend .sidebarMenu'(event, instance) {
        handleResize();
    },
    'transitionend .sidebar-option'(event, instance) {
        // Prevent this event from bubbling
        event.stopPropagation();
    }
});

Template.flexboxLayout.helpers({
    leftSidebarOpen() {
        return Template.instance().data.state.get('leftSidebar');
    },

    lesionSidebarOpen() {
        return Template.instance().data.state.get('rightSidebar') === 'lesions';
    },

    additionalFindingsSidebarOpen() {
        return Template.instance().data.state.get('rightSidebar') === 'additional';
    },

    rightSidebarOpen() {
        return Template.instance().data.state.get('rightSidebar') !== null;
    }
});
