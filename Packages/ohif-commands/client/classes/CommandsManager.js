import { Tracker } from 'meteor/tracker';
import { _ } from 'meteor/underscore';
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
            return OHIF.log.warn(`No context found with name "${contextName}"`);
        }

        return context;
    }

    getCurrentContext() {
        const contextName = OHIF.context.get();
        if (!contextName) {
            return OHIF.log.warn('There is no selected context');
        }

        return this.getContext(contextName);
    }

    createContext(contextName) {
        if (!contextName) return;
        if (this.contexts[contextName]) {
            return this.unsetCommands(contextName);
        }

        this.contexts[contextName] = {};
    }

    setCommands(contextName, definitions) {
        if (typeof definitions !== 'object') return;
        const context = this.getContext(contextName);
        if (!context) return;

        this.unsetCommands(contextName);
        Object.keys(definitions).forEach(command => (context[command] = definitions[command]));
    }

    registerCommand(contextName, command, definition) {
        if (typeof definition !== 'object') return;
        const context = this.getContext(contextName);
        if (!context) return;

        context[command] = definition;
    }

    unsetCommands(contextName) {
        if (!contextName) return;
        this.contexts[contextName] = {};
    }

    run(command) {
        const context = this.getCurrentContext();
        if (!context) return;
        const definition = context[command];
        if (!definition) {
            return OHIF.log.warn(`Command "${command}" not found in current context`);
        }

        const { action, disabled, params } = definition;
        if ((_.isFunction(disabled) && disabled()) || (!_.isUndefined(disabled) && disabled)) return;
        if (typeof action !== 'function') {
            return OHIF.log.warn(`No action was defined for command "${command}"`);
        } else {
            return action(params);
        }
    }
}
