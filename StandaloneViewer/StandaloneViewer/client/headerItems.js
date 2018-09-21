import { OHIF } from 'meteor/ohif:core';

console.log('18n', TAPi18n.getLanguages());

OHIF.header.dropdown.setItems([{
    action: () => OHIF.ui.showDialog('themeSelectorModal'),
    text: TAPi18n.__('Themes'),
    iconClasses: 'theme',
    iconSvgUse: 'packages/ohif_viewerbase/assets/icons.svg#theme',
    separatorAfter: false
}, {
    action: () => OHIF.ui.showDialog('userPreferencesDialog'),
    text: TAPi18n.__('Preferences'),
    icon: 'fa fa-user',
    separatorAfter: false
}]);
