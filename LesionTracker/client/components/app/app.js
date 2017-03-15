import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { Router } from 'meteor/iron:router';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';

const studylistContentId = 'studylistTab';
const viewerContentId = 'viewerTab';

// Define the OHIF.viewer.data global object
Template.app.onCreated(() => {
    const instance = Template.instance();
    instance.headerClasses = new ReactiveVar('');

    OHIF.viewer.data = instance.data.viewerData || {};

    OHIF.header.dropdown.setItems([{
        action: OHIF.user.audit,
        text: 'View Audit Log',
        iconClasses: 'log',
        iconSvgUse: 'packages/ohif_user-management/assets/user-menu-icons.svg#log',
        separatorAfter: true
    }, {
        action: () => OHIF.ui.showDialog('themeSelectorModal'),
        text: 'Themes',
        iconClasses: 'theme',
        iconSvgUse: 'packages/ohif_user-management/assets/user-menu-icons.svg#theme',
        separatorAfter: true
    }, {
        action: () => OHIF.ui.showDialog('serverInformationModal'),
        text: 'Server Information',
        iconClasses: 'server',
        iconSvgUse: 'packages/ohif_user-management/assets/user-menu-icons.svg#server',
        separatorAfter: true
    }, {
        action: OHIF.user.changePassword,
        text: 'Change Password',
        iconClasses: 'password',
        iconSvgUse: 'packages/ohif_user-management/assets/user-menu-icons.svg#password'
    }, {
        action: OHIF.user.logout,
        text: 'Logout',
        iconClasses: 'logout',
        iconSvgUse: 'packages/ohif_user-management/assets/user-menu-icons.svg#logout'
    }]);

    instance.autorun(() => {
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
    });
});

Template.app.events({
    'click .js-toggle-studyList'(event) {
        OHIF.ui.unsavedChanges.presentProactiveDialog('viewer.*', (hasChanges, userChoice) => {
            if (hasChanges) {

                switch (userChoice) {
                    case 'abort-action':
                        return;
                    case 'save-changes':
                        OHIF.ui.unsavedChanges.trigger('viewer', 'save', false);
                        OHIF.ui.unsavedChanges.clear('viewer.*');
                        break;
                    case 'abandon-changes':
                        OHIF.ui.unsavedChanges.clear('viewer.*');
                        break;
                }

            }
        }, {
            position: {
                x: event.clientX + 15,
                y: event.clientY + 15
            }
        });
    }
});

Template.app.helpers({
    userName: OHIF.user.getName,

    studyListToggleText() {
        const contentId = Session.get('activeContentId');

        // If the Viewer has not been opened yet, 'Back to viewer' should
        // not be displayed
        const viewerContentExists = !!Object.keys(OHIF.viewer.data).length;
        if (!viewerContentExists) {
            return;
        }

        if (contentId === studylistContentId) {
            return 'Back to viewer';
        } else if (contentId === viewerContentId) {
            return 'Study list';
        }
    },

    onStudyList() {
        return (Session.get('activeContentId') === 'studylistTab');
    },

    dasherize(text) {
        return text.replace(/ /g, '-').toLowerCase();
    }
});

Session.set('defaultSignInMessage', 'Tumor tracking in your browser.');
