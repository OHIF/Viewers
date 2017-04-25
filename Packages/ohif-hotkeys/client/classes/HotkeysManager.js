import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import { OHIF } from 'meteor/ohif:core';
import { HotkeysContext } from 'meteor/ohif:hotkeys/client/classes/HotkeysContext';

export class HotkeysManager {
    constructor(retrieveFunction, storeFunction) {
        this.contexts = {};
        this.currentContextName = null;
        this.enabled = new ReactiveVar(true);

        Tracker.autorun(() => {
            const contextName = OHIF.context.get();
            this.switchToContext(contextName);
        });
    }

    disable() {
        this.enabled.set(false);
    }

    enable() {
        this.enabled.set(true);
    }

    getContext(contextName) {
        return this.contexts[contextName];
    }

    getCurrentContext() {
        return this.getContext(this.currentContextName);
    }

    set(contextName, contextDefinitions, extend=false) {
        const enabled = this.enabled;
        const context = new HotkeysContext(contextName, contextDefinitions, enabled);
        const currentContext = this.getCurrentContext();
        if (currentContext && currentContext.name === contextName) {
            currentContext.destroy();
            context.initialize();
        }

        this.contexts[contextName] = context;
    }

    register(contextName, command, hotkey) {
        if (!command || !hotkey) return;
        const context = this.getContext(contextName);
        if (!context) {
            this.set(contextName, {});
        }

        context.register(command, hotkey);
    }

    unsetContext(contextName) {
        if (contextName === this.currentContextName) {
            this.getCurrentContext().destroy();
        }

        delete this.contexts[contextName];
    }

    switchToContext(contextName) {
        const currentContext = this.getCurrentContext();
        if (currentContext) {
            currentContext.destroy();
        }

        const newContext = this.contexts[contextName];
        if (!newContext) return;

        this.currentContextName = contextName;
        newContext.initialize();
    }
}
