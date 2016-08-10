Template.flexboxLayout.events({
    'transitionend .sidebarMenu'(event) {
        if (!event.target.classList.contains('sidebarMenu')) {
            return;
        }

        handleResize();
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
