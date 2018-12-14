import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'ohif-core';

import Viewer from '../viewer/viewer.js';

Template.ohifViewer.onCreated(() => {
    const instance = Template.instance();
    instance.headerClasses = new ReactiveVar('');

    const headerItems = [{
        action: () => OHIF.ui.showDialog('serverInformationModal'),
        text: 'Server Information',
        icon: 'fa fa-server fa-lg',
        separatorAfter: true
    }, {
        action: () => OHIF.ui.showDialog('themeSelectorModal'),
        text: 'Themes',
        iconClasses: 'theme',
        iconSvgUse: 'packages/ohif_viewerbase/assets/icons.svg#theme',
        separatorAfter: false
    }, {
        action: () => OHIF.ui.showDialog('userPreferencesDialog'),
        text: 'Preferences',
        icon: 'fa fa-user',
        separatorAfter: true
    }, {
        action: () => OHIF.ui.showDialog('aboutModal'),
        text: 'About',
        icon: 'fa fa-info'
    }];

    if (OHIF.user.userLoggedIn() === true) {
        headerItems.push({
            action: OHIF.user.logout,
            text: 'Logout',
            iconClasses: 'logout',
            iconSvgUse: 'packages/ohif_viewerbase/assets/user-menu-icons.svg#logout'
        });
    }

    OHIF.header.dropdown.setItems(headerItems);

    /*instance.autorun(() => {
        const currentRoute = Router.current();
        if (!currentRoute) return;
        const routeName = currentRoute.route.getName();
        const isViewer = routeName.indexOf('viewer') === 0;

        // Add or remove the strech class from body
        $(document.body)[isViewer ? 'addClass' : 'removeClass']('stretch');

        // Set the header on its bigger version if the viewer is not opened
        instance.headerClasses.set(isViewer ? '' : 'header-big');

        // Set the viewer open state on session
        Session.set('ViewerOpened', isViewer);
    });*/
});

Template.ohifViewer.events({
    'click .js-toggle-studyList'(event) {
        event.preventDefault();
    }
});

Template.ohifViewer.helpers({
    studyListToggleText() {
        const instance = Template.instance();
        const isViewer = Session.get('ViewerOpened');

        if (isViewer) {
            instance.hasViewerData = true;
            return 'Study list';
        }

        return instance.hasViewerData ? 'Back to viewer' : '';
    },

    Viewer() {
        return Viewer;
    },

    studies() {
        return Template.instance().data.studies;
    }
});
