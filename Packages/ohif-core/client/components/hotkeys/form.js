import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { $ } from 'meteor/jquery';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

Template.hotkeysForm.onCreated(() => {
    const instance = Template.instance();
    const { contextName } = instance.data;

    instance.api = {
        save() {
            const form = instance.$('form').first().data('component');
            const definitions = form.value();
            const promise = OHIF.hotkeys.store(contextName, definitions);
            promise.then(() => {
                const successMessage = 'The keyboard shortcut preferences were successfully saved.';
                OHIF.ui.notifications.success({ text: successMessage });
                OHIF.hotkeys.load(contextName).then(defs => instance.hotkeysDefinitions.set(defs));
            });
            return promise;
        },

        resetDefaults() {
            const dialogOptions = {
                class: 'themed',
                title: 'Reset Keyboard Shortcuts',
                message: 'Are you sure you want to reset all the shortcuts to their defaults?'
            };

            return OHIF.ui.showDialog('dialogConfirm', dialogOptions).then(() => {
                const resetDefaults = OHIF.hotkeys.resetDefaults(contextName);
                resetDefaults.then(() => {
                    OHIF.hotkeys.load(contextName).then(defs => instance.hotkeysDefinitions.set(defs));
                });
            });
        }
    };

    const rg = (start, end) => _.range(start, end + 1);
    instance.allowedKeys = _.union(
        [8, 13, 27, 32, 46], // BACKSPACE, ENTER, ESCAPE, SPACE, DELETE
        [12, 106, 107, 109, 110, 111], // Numpad keys
        rg(219, 221), // [\]
        rg(186, 191), // ;=,-./
        rg(112, 130), // F1-F19
        rg(33, 40), // arrow keys, home/end, pg dn/up
        rg(48, 57), // 0-9
        rg(65, 90) // A-Z
    );

    instance.updateInputText = (event, displayPressedKey=false) => {
        const $target = $(event.currentTarget);
        const keysPressedArray = instance.getKeysPressedArray(event);

        if (displayPressedKey) {
            const specialKeyName = jQuery.hotkeys.specialKeys[event.which];
            const keyName = specialKeyName || String.fromCharCode(event.keyCode) || event.key;
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

    instance.getConflictingCommand = (currentCommand, currentCombination) => {
        const form = instance.$('form').first().data('component');
        const hotkeys = form.value();

        let conflict = '';
        _.each(hotkeys, (combination, command) => {
            if (combination && combination === currentCombination && command !== currentCommand) {
                conflict = command;
            }
        });

        return conflict;
    };

    instance.disallowedCombinations = {
        '': [],
        ALT: ['SPACE'],
        SHIFT: [],
        CTRL: ['F4', 'F5', 'F11', 'W', 'R', 'T', 'O', 'P', 'A', 'D', 'F', 'G', 'H', 'J', 'L', 'Z', 'X', 'C', 'V', 'B', 'N', 'PAGEDOWN', 'PAGEUP'],
        'CTRL+SHIFT': ['Q', 'W', 'R', 'T', 'P', 'A', 'H', 'V', 'B', 'N']
    };

    const hotkeysContext = OHIF.hotkeys.getContext(contextName) || {};
    instance.hotkeysDefinitions = new ReactiveVar(hotkeysContext.definitions);
    OHIF.hotkeys.load(contextName).then(defs => instance.hotkeysDefinitions.set(defs));
});

Template.hotkeysForm.events({
    'keydown .hotkey'(event, instance) {
        // Prevent ESC key from propagating and closing the modal
        if (event.keyCode === 27) {
            event.stopPropagation();
        }

        if (instance.allowedKeys.indexOf(event.keyCode) > -1) {
            instance.updateInputText(event, true);
            $(event.currentTarget).trigger('hotkeyChange');
        } else {
            instance.updateInputText(event);
        }

        event.preventDefault();
    },

    'hotkeyChange .hotkey'(event, instance, data={}) {
        const $target = $(event.currentTarget);
        const combination = $target.val();
        const keys = combination.split('+');
        const lastKey = keys.pop();
        const modifierCombination = keys.join('+');
        const isModifier = ['CTRL', 'ALT', 'SHIFT'].indexOf(lastKey) > -1;

        const formItem = $target.data('component');
        const conflictedCommand = instance.getConflictingCommand(this.key, combination);
        if (isModifier) {
            // Clean the input if left with only a modifier key or browser specific command
            formItem.error(`It's not possible to define only modifier keys (CTRL, ALT and SHIFT) as a shortcut`);
            $target.val('').focus();
        } else if (instance.disallowedCombinations[modifierCombination].indexOf(lastKey) > -1) {
            // Clean the input and show error if combination is not allowed
            formItem.error(`The "${combination}" shortcut combination is not allowed`);
            $target.val('').focus();
        } else if (conflictedCommand) {
            if (data.blurTrigger) return;

            // Remove the error message
            formItem.error(false);
            formItem.toggleTooltip(false);

            const placement = $target.closest('.hotkeys-left').length ? 'right' : 'left';
            const commandsContext = OHIF.commands.getContext(instance.data.contextName);
            const popoverData = {
                conflictedFunctionName: commandsContext[conflictedCommand].name,
                newFunctionName: commandsContext[this.key].name,
                hotkeyCombination: combination,
            };

            const popoverOptions = {
                event,
                placement
            };

            const conflictedFormItem = instance.$('form').first().data('component').item(conflictedCommand);
            formItem.state('error', true);
            conflictedFormItem.state('error', true);

            const cleanup = () => {
                instance.popoverVisible = false;
                formItem.state('error', false);
                conflictedFormItem.state('error', false);
            };

            const popoverTemplate = 'hotkeysConfirmReplacementPopover';
            instance.popoverVisible = true;
            OHIF.ui.showPopover(popoverTemplate, popoverData, popoverOptions).then(() => {
                cleanup();
                formItem.value(combination);
                conflictedFormItem.value('');
                $target.blur();
            }).catch(() => {
                cleanup();
                $target.val('').focus();
            });
        } else {
            // Remove the error message and blur the component if everything is fine
            formItem.error(false);
            if (!data.blurTrigger) {
                $target.blur();
            }
        }
    },

    'blur .hotkey'(event, instance, data={}) {
        $(event.currentTarget).trigger('hotkeyChange', { blurTrigger: true });
    },

    'keyup .hotkey'(event, instance) {
        if (!instance.popoverVisible) {
            instance.updateInputText(event);
        }
    }
});

Template.hotkeysForm.helpers({
    getHotkeyInputInformationLists() {
        OHIF.hotkeys.changeObserver.depend();

        const instance = Template.instance();
        const { contextName } = instance.data;

        const hotkeyDefinitions = instance.hotkeysDefinitions.get();
        const commandsContext = OHIF.commands.getContext(contextName);
        if (!hotkeyDefinitions || !commandsContext) return {};

        const commands = Object.keys(OHIF.hotkeys.defaults[contextName] || {});
        const list = [];
        commands.forEach(commandName => {
            const commandDefinitions = commandsContext[commandName];
            if (!commandDefinitions) return;
            list.push({
                key: commandName,
                label: commandDefinitions.name,
                value: hotkeyDefinitions[commandName] || ''
            });
        });

        const left = list.splice(0, Math.ceil(list.length / 2));
        const right = list;

        return {
            left,
            right
        };
    }
});
