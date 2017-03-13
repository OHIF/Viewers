import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';
import { ReactiveVar } from 'meteor/reactive-var';
import { OHIF } from 'meteor/ohif:core';

const studylistContentId = 'studylistTab';
const viewerContentId = 'viewerTab';

// Define the ViewerData global object
// If there is currently any Session data for this object,
// use this to repopulate the variable
Template.app.onCreated(() => {
    const instance = Template.instance();
    instance.headerClasses = new ReactiveVar('');

    ViewerData = Session.get('ViewerData') || {};

    OHIF.header.setDropdownItems([{
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
        const contentId = Session.get('activeContentId');
        instance.headerClasses.set(contentId === viewerContentId ? '' : 'header-big');
    });
});

Template.app.onRendered(() => {
    const contentId = Session.get('activeContentId');
    if (contentId === viewerContentId) {
        switchToTab(contentId);
    }
});

Template.app.events({
    'click .js-toggle-studyList'(event) {
        const contentId = Session.get('activeContentId');

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

            if (contentId !== studylistContentId) {
                switchToTab(studylistContentId);
            } else {
                switchToTab(viewerContentId);
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
        const viewerContentExists = !!Object.keys(ViewerData).length;
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
