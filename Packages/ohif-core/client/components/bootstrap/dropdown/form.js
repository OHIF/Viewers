import { Template } from 'meteor/templating';

Template.dropdownFormMenu.helpers({
    isVisible(item) {
        let isVisible = true;
        if (typeof item.visible === 'function') {
            isVisible = item.visible();
        } else if (typeof item.visible !== 'undefined') {
            isVisible = !!item.visible;
        }

        return isVisible;
    },

    getText(item) {
        if (typeof item.text === 'function') {
            return item.text(item.params || {});
        }

        return item.text || '';
    }
});
