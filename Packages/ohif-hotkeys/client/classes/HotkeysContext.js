import { OHIF } from 'meteor/ohif:core';

export class HotkeysContext {
    constructor(name, definitions, enabled) {
        this.name = name;
        this.definitions = definitions;
        this.enabled = enabled;
    }

    extend(definitions={}) {
        if (typeof definitions !== 'object') return;
        this.destroy();
        Object.assign(this.definitions, definitions);
        this.initialize();
    }

    initialize() {
        Object.keys(this.definitions).forEach(definitionKey => {
            const { hotkey, action, disabled } = this.definitions[definitionKey];
            let message;
            if (!hotkey) {
                message = `No hotkey was defined for "${definitionKey}"`;
            } else if (!action) {
                message = `No action was defined for "${definitionKey}" using "${hotkey}" hotkey`;
            }

            if (message) {
                return OHIF.log.warn(message);
            }

            const bindHotkey = hotkey => $(document).bind(`keydown.hotkey.${this.name}`, hotkey, event => {
                if (!this.enabled.get()) return;
                if (typeof disabled !== undefined) {
                    if ((typeof disabled === 'function' && disabled()) || disabled) return;
                }

                action(event);
            });

            if (hotkey instanceof Array) {
                hotkey.forEach(hotkey => bindHotkey(hotkey));
            } else {
                bindHotkey(hotkey);
            }
        });
    }

    destroy() {
        $(document).unbind(`keydown.hotkey.${this.name}`);
    }
}
