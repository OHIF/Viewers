import { OHIF } from 'meteor/ohif:core';

OHIF.header.dropdown.setItems([{
    action: () => OHIF.ui.showDialog('themeSelectorModal'),
    text: 'Themes',
    iconClasses: 'theme',
    iconSvgUse: 'packages/ohif_viewerbase/assets/icons.svg#theme',
    separatorAfter: false
}, {
    action: () => OHIF.ui.showDialog('userPreferencesDialog'),
    text: 'Preferences',
    icon: 'fa fa-user',
    separatorAfter: false
}]);
