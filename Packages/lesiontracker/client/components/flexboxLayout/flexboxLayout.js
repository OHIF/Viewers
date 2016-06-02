Template.flexboxLayout.onCreated(() => {
    const instance = Template.instance();
    instance.state = instance.data.state;
    instance.timepointType = new ReactiveVar();
});

var resizeTimeout;
Template.flexboxLayout.onRendered(() => {
    const instance = Template.instance();

    instance.autorun(function() {
        Meteor.clearTimeout(resizeTimeout);

        // Trigger a resize any time the layout state changes
        var studySidebarOpen = instance.state.get('studySidebarOpen');
        var lesionSidebarOpen = instance.state.get('lesionSidebarOpen');

        resizeTimeout = Meteor.setTimeout(function() {
            handleResize();
        }, 300);
    });
});

Template.flexboxLayout.helpers({
    buttonGroupData() {
        const instance = Template.instance();
        return {
            value: instance.timepointType,
            options: [{
                key: 'key',
                text: 'Key Timepoints'
            }, {
                key: 'all',
                text: 'All Timepoints'
            }]
        };
    },
    studySidebarOpen() {
        const instance = Template.instance();
        return instance.state.get('studySidebarOpen');
    },
    lesionSidebarOpen() {
        const instance = Template.instance();
        return instance.state.get('lesionSidebarOpen');
    }
});
