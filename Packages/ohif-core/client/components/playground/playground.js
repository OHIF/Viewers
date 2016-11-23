import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';

OHIF.ui.layoutState = {
    leftSidebar: new ReactiveVar(false),
    rightSidebar: new ReactiveVar(false),
    toolsDrawer: new ReactiveVar(false)
};

Template.componentPlayground.onRendered(() => {
    const instance = Template.instance();

    instance.$('.toolbar-drawer').adjustMax('height');
    instance.autorun(() => {
        const state = OHIF.ui.layoutState.toolsDrawer.get();
        instance.$('.toolbar-drawer').toggleClass('open', state);
    });

    instance.$('.layout-sidebar-left').adjustMax('width');
    instance.autorun(() => {
        const state = OHIF.ui.layoutState.leftSidebar.get();
        instance.$('.layout-sidebar-left').toggleClass('open', state);
    });

    instance.$('.layout-sidebar-right').adjustMax('width');
    instance.autorun(() => {
        const state = OHIF.ui.layoutState.rightSidebar.get();
        instance.$('.layout-sidebar-right').toggleClass('open', state);
    });
});

Template.componentPlayground.events({
    'click .js-tool-more'(event, instance) {
        const currentState = OHIF.ui.layoutState.toolsDrawer.get();
        OHIF.ui.layoutState.toolsDrawer.set(!currentState);
    },
    'click .js-toggle-left'(event, instance) {
        const currentState = OHIF.ui.layoutState.leftSidebar.get();
        OHIF.ui.layoutState.leftSidebar.set(!currentState);
    },
    'click .js-toggle-right'(event, instance) {
        const currentState = OHIF.ui.layoutState.rightSidebar.get();
        OHIF.ui.layoutState.rightSidebar.set(!currentState);
    }
});
