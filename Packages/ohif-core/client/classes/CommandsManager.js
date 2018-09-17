import { ReactiveVar } from 'meteor/reactive-var';
import { _ } from 'meteor/underscore';
import { OHIF } from 'meteor/ohif:core';

export class CommandsManager {
    constructor() {
        this.contexts = {};

        // Enable reactivity by storing the last executed command
        this.last = new ReactiveVar('');
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
            return this.clear(contextName);
        }

        this.contexts[contextName] = {};
    }

    set(contextName, definitions, extend=false) {
        if (typeof definitions !== 'object') return;
        const context = this.getContext(contextName);
        if (!context) return;

        if (!extend) {
            this.clear(contextName);
        }

        Object.keys(definitions).forEach(command => (context[command] = definitions[command]));
    }

    register(contextName, command, definition) {
        if (typeof definition !== 'object') return;
        const context = this.getContext(contextName);
        if (!context) return;

        context[command] = definition;
    }

    setDisabledFunction(contextName, command, func) {
        if (!command || typeof func !== 'function') return;
        const context = this.getContext(contextName);
        if (!context) return;
        const definition = context[command];
        if (!definition) {
            return OHIF.log.warn(`Trying to set a disabled function to a command "${command}" that was not yet defined`);
        }

        definition.disabled = func;
    }

    clear(contextName) {
        if (!contextName) return;
        this.contexts[contextName] = {};
    }

    getDefinition(command) {
        const context = this.getCurrentContext();
        if (!context) return;
        return context[command];
    }

    isDisabled(command) {
        const definition = this.getDefinition(command);
        if (!definition) return false;
        const { disabled } = definition;
        if (_.isFunction(disabled) && disabled()) return true;
        if (!_.isFunction(disabled) && disabled) return true;
        return false;
    }

    run(command) {
        const definition = this.getDefinition(command);
        if (!definition) {
            return OHIF.log.warn(`Command "${command}" not found in current context`);
        }

        const { action, params } = definition;
        if (this.isDisabled(command)) return;
        if (typeof action !== 'function') {
            return OHIF.log.warn(`No action was defined for command "${command}"`);
        } else {
            const result = action(params);
            if (this.last.get() === command) {
                this.last.dep.changed();
            } else {
                this.last.set(command);
            }

            return result;
        }
    }
}
