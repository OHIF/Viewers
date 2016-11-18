const isSidebarOpen = sidebarName => {
    handleResize();
    return Template.instance().data.state.get(sidebarName);
};

Template.viewerSection.helpers({
    leftSidebarOpen() {
        return isSidebarOpen('leftSidebar');
    },

    rightSidebarOpen() {
        return isSidebarOpen('rightSidebar');
    }
});
