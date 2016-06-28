Template.flexboxLayout.onCreated(() => {
    const instance = Template.instance();
    instance.state = instance.data.state;
});

let resizeTimeout;
Template.flexboxLayout.onRendered(() => {
    const instance = Template.instance();

    instance.autorun(() => {
        Meteor.clearTimeout(resizeTimeout);

        // Trigger a resize any time the layout state changes
        instance.state.get('leftSidebar');
        instance.state.get('rightSidebar');

        resizeTimeout = Meteor.setTimeout(() => {
            handleResize();
        }, 300);
    });
});

Template.flexboxLayout.helpers({
    leftSidebarOpen() {
        return Template.instance().state.get('leftSidebar');
    },

    lesionSidebarOpen() {
        return Template.instance().state.get('rightSidebar') === 'lesions';
    },

    additionalMeasurementsSidebarOpen() {
        return Template.instance().state.get('rightSidebar') === 'additional';
    },

    rightSidebarOpen() {
        return Template.instance().state.get('rightSidebar') !== null;
    }
});
