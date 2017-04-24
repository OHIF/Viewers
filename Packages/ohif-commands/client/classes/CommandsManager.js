import { ReactiveDict } from 'meteor/reactive-dict';
import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';

export class CommandsManager {
    constructor() {
        this.contexts = {};

        Tracker.autorun(() => {
            const currentContextName = OHIF.context.get();
            OHIF.log.info(currentContextName);
            // TODO: initialize hotkeys context
        });
    }

    getContext(contextName) {
        const context = this.contexts[contextName];
        if (!context) {
            OHIF.log.warn(`No context found with name "${contextName}"`);
        }

        return context;
    }

    getCurrentContext(contextName) {
        return this.getContext(OHIF.context.get());
    }

    createContext(contextName) {
        if (this.contexts[contextName]) {
            return this.unsetCommands(contextName);
        }

        this.contexts[contextName] = new ReactiveDict();
    }

    setCommands(contextName, definitions) {
        if (typeof definitions !== 'object') return;
        const context = this.getContext(contextName);
        if (!context) return;

        this.unsetCommands(contextName);
        Object.keys(definitions).forEach(key => context.set(key, definitions[key]));
    }

    registerCommand(contextName, key, definition) {
        if (typeof definition !== 'object') return;
        const context = this.getContext(contextName);
        if (!context) return;

        context.set(key, definition);
    }

    unsetCommands(contextName) {
        const context = this.getContext(contextName);
        if (!context) return;

        context.clear();
    }
}
