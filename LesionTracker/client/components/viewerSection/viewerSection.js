Template.viewerSection.events({
    'transitionend .sidebarMenu'(event) {
        if (!event.target.classList.contains('sidebarMenu')) {
            return;
        }

        handleResize();
    }
});

Template.viewerSection.helpers({
    leftSidebarOpen() {
        return Template.instance().data.state.get('leftSidebar');
    },

    rightSidebarOpen() {
        return Template.instance().data.state.get('rightSidebar');
    }
});
