import { Template } from 'meteor/templating';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';

Template.hotkeysForm.onCreated(() => {
    const instance = Template.instance();

    const rg = (start, end) => _.range(start, end + 1);
    instance.allowedKeys = _.union(rg(32, 40), rg(48, 57), rg(65, 90), rg(112, 121), [123]);

    instance.updateInputText = (event, displayPressedKey=false) => {
        const $target = $(event.currentTarget);
        const keysPressedArray = instance.getKeysPressedArray(event);

        if (displayPressedKey) {
            const specialKeyName = jQuery.hotkeys.specialKeys[event.which];
            const keyName = specialKeyName || event.key;
            keysPressedArray.push(keyName.toUpperCase());
        }

        $target.val(keysPressedArray.join('+'));
    };

    instance.getKeysPressedArray = event => {
        const keysPressedArray = [];

        if (event.ctrlKey && !event.altKey) {
            keysPressedArray.push('CTRL');
        }

        if (event.shiftKey && !event.altKey) {
            keysPressedArray.push('SHIFT');
        }

        if (event.altKey && !event.ctrlKey) {
            keysPressedArray.push('ALT');
        }

        return keysPressedArray;
    };
});

Template.hotkeysForm.events({
    'keydown .hotkey'(event, instance) {
        if (instance.allowedKeys.indexOf(event.keyCode) > -1) {
            instance.updateInputText(event, true);
            $(event.currentTarget).blur();
        } else {
            instance.updateInputText(event);
        }

        event.preventDefault();
    },

    'keyup .hotkey'(event, instance) {
        instance.updateInputText(event);
    }
});
