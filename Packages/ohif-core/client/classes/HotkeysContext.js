import { OHIF } from 'meteor/ohif:core';

export class HotkeysContext {
    constructor(name, definitions, enabled) {
        this.name = name;
        this.definitions = Object.assign({}, definitions);
        this.enabled = enabled;
    }

    extend(definitions={}) {
        if (typeof definitions !== 'object') return;
        this.definitions = Object.assign({}, definitions);
        Object.keys(definitions).forEach(command => {
            const hotkey = definitions[command];
            this.unregister(command);
            if (hotkey) {
                this.register(command, hotkey);
            }

            this.definitions[command] = hotkey;
        });
    }

    register(command, hotkey) {
        if (!hotkey) {
            return;
        }

        if (!command) {
            return OHIF.log.warn(`No command was defined for hotkey "${hotkey}"`);
        }

        const bindingKey = `keydown.hotkey.${this.name}.${command}`;
        const bind = hotkey => $(document).bind(bindingKey, hotkey, event => {
            if (!this.enabled.get()) return;
            OHIF.commands.run(command);
            event.preventDefault();
        });

        if (hotkey instanceof Array) {
            hotkey.forEach(hotkey => bind(hotkey));
        } else {
            bind(hotkey);
        }
    }

    unregister(command) {
        const bindingKey = `keydown.hotkey.${this.name}.${command}`;
        if (this.definitions[command]) {
            $(document).unbind(bindingKey);
            delete this.definitions[command];
        }
    }

    initialize() {
        Object.keys(this.definitions).forEach(command => {
            const hotkey = this.definitions[command];
            this.register(command, hotkey);
        });
    }

    destroy() {
        $(document).unbind(`keydown.hotkey.${this.name}`);
    }
}
