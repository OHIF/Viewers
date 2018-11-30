import { Viewerbase } from 'meteor/ohif:viewerbase';

Template.flexboxLayout.helpers({
    leftSidebarOpen() {
        return Template.instance().data.state.get('leftSidebar');
    },

    rightSidebarOpen() {
        return Template.instance().data.state.get('rightSidebar');
    },

    ViewerMain() {
        return Viewerbase.components.viewer.ViewerMain;
    }
});
