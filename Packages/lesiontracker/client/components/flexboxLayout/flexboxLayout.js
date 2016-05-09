Template.flexboxLayout.onCreated(function() {
    var instance = this;

    instance.state = instance.data.state;
});

var resizeTimeout;
Template.flexboxLayout.onRendered(function() {
    var instance = this;

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
    studySidebarOpen: function() {
        var instance = Template.instance();
        return instance.state.get('studySidebarOpen');
    },
    lesionSidebarOpen: function() {
        var instance = Template.instance();
        return instance.state.get('lesionSidebarOpen');
    }
});